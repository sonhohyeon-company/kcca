// Imports every public post, image and attachment from the old imweb site (kcca-society.kr) into DATA_DIR.
// Re-runnable: posts imported before (by id = imweb idx) are skipped, so admin edits and deletions stay.
// After the DNS cutover, set IMWEB_URL to imweb's own domain (imweb 관리자 → 도메인) to crawl imweb there.
//
//   node --no-warnings scripts/import-imweb.ts                 import new posts (+ the home popup if none is set)
//   node --no-warnings scripts/import-imweb.ts --dry-run       crawl and print the plan, write nothing
//   node --no-warnings scripts/import-imweb.ts --update-views  also raise view counts of existing posts to imweb's
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { setTimeout as sleep } from "node:timers/promises";
import sharp from "sharp";
import { dataDir, openDb } from "../lib/schema.ts";
import {
  BASE,
  COVER_INDEX,
  IMWEB_BOARDS,
  imageAlt,
  parseDetail,
  parseList,
  postRecord,
  targetBoard,
  toMarkup,
} from "./imweb.ts";
import type { ListRow } from "./imweb.ts";

const dryRun = process.argv.includes("--dry-run");
const updateViews = process.argv.includes("--update-views");
const uploadsDir = path.join(dataDir(), "uploads");

// Same allow-list as lib/uploads.ts saveFile (that module is server-only, so it cannot be imported here).
const ATTACHMENT_EXTS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "pdf",
  "hwp",
  "hwpx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
];

const POPUP = {
  image: "https://cdn.imweb.me/upload/S20260629dc9b4a986a297/bfb9745b9bf56.jpg",
  alt: "2026 대한민국 청목캘리그라피 공모전 포스터",
  link: "/notice-contest/173353860",
  until: "2026-11-10",
};

/** GET with retries (network errors, 429 and 5xx: 4 tries, 2s/4s/8s backoff). */
async function get(url: string, redirect: RequestRedirect = "follow") {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        redirect,
        headers: { "User-Agent": "Mozilla/5.0 (KCCA migration)" },
        signal: AbortSignal.timeout(120_000),
      });
      if (res.status >= 400)
        throw Object.assign(new Error(`HTTP ${res.status} ${url}`), {
          status: res.status,
        });
      return { res, body: Buffer.from(await res.arrayBuffer()) };
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500;
      if (attempt === 4 || (status < 500 && status !== 429)) throw error;
      console.warn(`  retry ${attempt}: ${(error as Error).message}`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}

const getText = async (url: string) => (await get(url)).body.toString("utf8");

// Same encoding as lib/uploads.ts saveImage: EXIF rotation applied, ≤2400px, WebP, metadata stripped.
const toWebp = (data: Buffer) =>
  sharp(data)
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

const cleanFileName = (name: string) =>
  (name.split(/[\\/]/).pop() ?? "")
    .replace(/[\u0000-\u001f\u007f"]/g, "")
    .slice(0, 200) || "첨부파일";

async function crawlBoard(slug: string) {
  const rows: ListRow[] = [];
  // Pages come from the pagination links; a page past the end repeats the last page, so stop on repeats too.
  for (let page = 1, last = 1; page <= last; page++) {
    const list = parseList(
      await getText(
        page === 1 ? `${BASE}/${slug}` : `${BASE}/${slug}/?page=${page}`,
      ),
    );
    const fresh = list.rows.filter(
      (row) => !rows.some((seen) => seen.idx === row.idx),
    );
    if (page > 1 && !fresh.length) break;
    rows.push(...fresh);
    last = Math.max(last, list.maxPage);
  }
  return rows;
}

const dbFile = path.join(dataDir(), "kcca.db");
const db = dryRun
  ? existsSync(dbFile)
    ? new DatabaseSync(dbFile, { readOnly: true })
    : null
  : openDb();
// Every imweb idx ever imported, so a post the admin deleted is not imported again.
const imported = new Set<number>(
  JSON.parse(
    String(
      db
        ?.prepare("SELECT value FROM settings WHERE key = 'imwebImported'")
        .get()?.value ?? "[]",
    ),
  ),
);
const remember = (id: number) => {
  if (imported.has(id)) return;
  imported.add(id);
  if (!dryRun)
    db!
      .prepare(
        "INSERT INTO settings (key, value) VALUES ('imwebImported', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
      )
      .run(JSON.stringify([...imported]));
};

console.log(`${dryRun ? "[dry run] " : ""}imweb → ${dbFile}`);
const summary: Record<string, string | number>[] = [];
let commentsSkipped = 0;
let failed = 0;

for (const slug of IMWEB_BOARDS) {
  const rows = await crawlBoard(slug);
  const stat = {
    imweb: slug,
    board: targetBoard(slug),
    listed: rows.length,
    new: 0,
    skipped: 0,
    images: 0,
    files: 0,
  };
  summary.push(stat);
  for (const row of rows) {
    const exists = db?.prepare("SELECT 1 FROM posts WHERE id = ?").get(row.idx);
    if (exists) remember(row.idx); // databases imported before the record was kept
    if (imported.has(row.idx)) {
      stat.skipped++;
      if (updateViews && !dryRun) {
        db!
          .prepare("UPDATE posts SET views = MAX(views, ?) WHERE id = ?")
          .run(row.views, row.idx);
      }
      console.log(`skip ${slug}/${row.idx} (${exists ? "exists" : "deleted"})`);
      continue;
    }
    try {
      const detail = parseDetail(
        await getText(`${BASE}/${slug}/?idx=${row.idx}&bmode=view`),
      );
      const post = postRecord(slug, row, detail);
      const files: [string, Buffer][] = [];

      // Images: download the originals once each, in document order, then write the markup.
      const images = new Map<string, string>();
      toMarkup(detail.bodyHtml, (src) => {
        images.set(src, "");
        return "";
      });
      for (const src of images.keys()) {
        const url = new URL(src, BASE);
        if (!/^https?:$/.test(url.protocol)) {
          console.warn(
            `  ${slug}/${row.idx}: dropped image ${src.slice(0, 60)}`,
          );
          images.delete(src);
          continue;
        }
        const name = `${randomUUID()}.webp`;
        if (!dryRun) {
          try {
            files.push([name, await toWebp((await get(url.href)).body)]);
          } catch (error) {
            // Gone from the CDN (404/410) will not come back, so import the post without it; anything
            // else (5xx, 403, 429) fails the post so the next run retries it.
            const status = (error as { status?: number }).status ?? 500;
            if (status !== 404 && status !== 410) throw error;
            console.warn(
              `  ${slug}/${row.idx}: dropped image ${(error as Error).message}`,
            );
            images.delete(src);
            continue;
          }
        }
        images.set(src, `/uploads/${name}`);
      }
      const body = toMarkup(detail.bodyHtml, (src, alt) =>
        images.has(src)
          ? `![${imageAlt(alt, post.board, post.title)}](${images.get(src)})`
          : "",
      );
      const srcs = [...images.values()];
      const cover =
        srcs[COVER_INDEX[`${slug}/${row.idx}`] ?? 0] ?? srcs[0] ?? null;

      // Attachments: the download link 302s to a short-lived S3 URL whose key is also on cdn.imweb.me.
      const attachments: { name: string; url: string; size: number }[] = [];
      for (const file of detail.attachments) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ATTACHMENT_EXTS.includes(ext)) {
          console.warn(
            `  ${slug}/${row.idx}: skipped attachment ${file.name} (type not allowed)`,
          );
          continue;
        }
        const name = `${randomUUID()}.${ext}`;
        let size = 0;
        if (!dryRun) {
          const { res } = await get(BASE + file.href, "manual");
          const key = /amazonaws\.com\/(upload\/[^?]+)/.exec(
            res.headers.get("location") ?? "",
          )?.[1];
          const data = (
            await get(key ? `https://cdn.imweb.me/${key}` : BASE + file.href)
          ).body;
          files.push([name, data]);
          size = data.length;
        }
        attachments.push({
          name: cleanFileName(file.name),
          url: `/uploads/${name}`,
          size,
        });
      }

      if (!dryRun) {
        mkdirSync(uploadsDir, { recursive: true });
        for (const [name, data] of files)
          writeFileSync(path.join(uploadsDir, name), data);
        db!
          .prepare(
            `INSERT INTO posts (id, board, category, title, body, cover, attachments, pinned, views, author, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            post.id,
            post.board,
            post.category,
            post.title,
            body,
            cover,
            JSON.stringify(attachments),
            post.pinned ? 1 : 0,
            post.views,
            post.author,
            post.createdAt,
            post.createdAt,
          );
        remember(post.id);
      }
      stat.new++;
      stat.images += images.size;
      stat.files += attachments.length;
      commentsSkipped += detail.comments;
      console.log(
        `${dryRun ? "would import" : "imported"} ${slug}/${row.idx} → /${post.board}/${post.id} ` +
          `"${post.title}"${post.category ? ` [${post.category}]` : ""} images ${images.size}, files ${attachments.length}`,
      );
    } catch (error) {
      failed++;
      console.error(`FAILED ${slug}/${row.idx}: ${(error as Error).message}`);
    }
  }
}

// Home popup (the contest poster), only when the admin has never set one.
if (!db?.prepare("SELECT 1 FROM settings WHERE key = 'popupImage'").get()) {
  if (dryRun) console.log(`would import home popup ${POPUP.image}`);
  else {
    const name = `${randomUUID()}.webp`;
    mkdirSync(uploadsDir, { recursive: true });
    writeFileSync(
      path.join(uploadsDir, name),
      await toWebp((await get(POPUP.image)).body),
    );
    const set = db!.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
    );
    const values = {
      popupEnabled: true,
      popupImage: `/uploads/${name}`,
      popupAlt: POPUP.alt,
      popupLink: POPUP.link,
      popupUntil: POPUP.until,
      contestLink: POPUP.link,
    };
    for (const [key, value] of Object.entries(values))
      set.run(key, JSON.stringify(value));
    console.log(`imported home popup → /uploads/${name}`);
  }
} else console.log("skip home popup (already set)");

console.table(summary);
console.log(
  `comments skipped (no member accounts on the new site): ${commentsSkipped}`,
);
if (failed) {
  console.error(`${failed} post(s) failed; re-run to retry them.`);
  process.exitCode = 1;
}
db?.close();
