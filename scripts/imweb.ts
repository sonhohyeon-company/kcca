// Pure parsing and conversion for scripts/import-imweb.ts (no I/O, so tests can run it on saved HTML).
// The imweb markup rules: list rows, gallery cards, detail pages, JSON-LD dates.
import { boards, legacyBoards, splitAwardTitle } from "../lib/boards.ts";
import type { BoardSlug } from "../lib/boards.ts";

// After the DNS cutover kcca-society.kr is the new server; set IMWEB_URL to imweb's own domain to crawl imweb then.
export const BASE = (
  process.env.IMWEB_URL ?? "https://kcca-society.kr"
).replace(/\/+$/, "");

export const IMWEB_BOARDS = [
  "notice-association",
  "association",
  "25",
  "notice-communication",
  "certificate-notice",
  "certificate-register",
  "notice-contest",
  "notice-gallery-2025",
  "notice-gallery-2024",
  "notice-judge",
  "notice-membership",
  "membership-gallery",
];

// Cover = first body image, except where the imweb admin picked another one (found by pixel matching).
export const COVER_INDEX: Record<string, number> = {
  "association/174003766": 1,
};

const named: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  bull: "•",
  times: "×",
};

const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
    const n =
      code[1] === "x" || code[1] === "X"
        ? parseInt(code.slice(2), 16)
        : Number(code.slice(1));
    return String.fromCodePoint(n > 0 && n <= 0x10ffff ? n : 0xfffd);
  });

/** Tag-free, entity-decoded, whitespace-collapsed text. */
const txt = (s: string) =>
  decode(s.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

function req(pattern: RegExp, s: string, what: string) {
  const m = pattern.exec(s);
  if (!m) throw new Error(`imweb markup changed: ${what} not found`);
  return m[1];
}

export type ListRow = {
  idx: number;
  title: string;
  category: string | null;
  author: string | null;
  time: string; // "YYYY-MM-DD HH:MM" KST
  views: number;
  pinned: boolean;
};

/** One imweb board list page: list rows or gallery cards, plus the highest page number linked. */
export function parseList(html: string) {
  const start = html.indexOf('data-widget-name="게시판"');
  if (start < 0)
    throw new Error("imweb markup changed: board widget not found");
  const end = html.indexOf("<footer", start);
  const w = html.slice(start, end < 0 ? undefined : end);
  const rows: ListRow[] = [];
  for (const m of w.matchAll(
    /<ul class="li_body\s+(notice_body\s+)?holder">([\s\S]*?)<\/ul>/g,
  )) {
    const row = m[2];
    rows.push({
      idx: Number(req(/bmode=view&(?:amp;)?idx=(\d+)/, row, "row idx")),
      title: txt(
        req(/class="list_text_title[^>]*>([\s\S]*?)<\/a>/, row, "row title"),
      ),
      // imweb hides some list categories on every screen size (display: none); those stay unset.
      category:
        txt(
          /href="\?category=[^"]*">\s*<em(?![^>]*display:\s*none)[^>]*>([\s\S]*?)<\/em>/.exec(
            row,
          )?.[1] ?? "",
        ) || null,
      author:
        txt(/<li class="name"[^>]*>([\s\S]*?)<\/li>/.exec(row)?.[1] ?? "") ||
        null,
      time: req(/<li class="time" title="([^"]+)"/, row, "row time"),
      views: Number(
        /<li class="read"[^>]*>[\s\S]*?<\/span>\s*(\d+)/.exec(row)?.[1] ?? 0,
      ),
      pinned: Boolean(m[1]),
    });
  }
  for (const m of w.matchAll(
    /<div class="ma-item _post_item_wrap">([\s\S]*?)<\/a>\s*<\/span>/g,
  )) {
    const card = m[1];
    const block = req(
      /<div class="title title-block">([\s\S]*?)<\/div>/,
      card,
      "card title",
    );
    rows.push({
      idx: Number(req(/bmode=view&(?:amp;)?idx=(\d+)/, card, "card idx")),
      title: txt(
        block.replace(
          /<em class="notice-block"[\s\S]*?<\/em>|<span>[\s\S]*?<\/span>/g,
          "",
        ),
      ),
      category:
        txt(
          /<span>\s*<em[^>]*>([\s\S]*?)<\/em>\s*<\/span>/.exec(block)?.[1] ??
            "",
        ) || null,
      author:
        txt(/<div class="writer">([\s\S]*?)<\/div>/.exec(card)?.[1] ?? "") ||
        null,
      time: req(/<small class="date" title="([^"]+)"/, card, "card time"),
      views: Number(/조회<\/i>\s*(\d+)/.exec(card)?.[1] ?? 0),
      pinned: /<em class="notice-block" style="display: (?!none)/.test(card),
    });
  }
  if (!rows.length && !w.includes("게시물이 없습니다")) {
    throw new Error("imweb markup changed: no posts and no empty-board notice");
  }
  const pagination = /<ul class="pagination">[\s\S]*?<\/ul>/.exec(w)?.[0] ?? "";
  const pages = [...pagination.matchAll(/[?&]page=(\d+)/g)].map((p) =>
    Number(p[1]),
  );
  return { rows, maxPage: Math.max(1, ...pages) };
}

type Detail = {
  title: string;
  category: string | null;
  author: string | null;
  created: string; // JSON-LD datePublished, e.g. 2026-09-29T17:28:59+09:00
  bodyHtml: string;
  attachments: { name: string; href: string }[]; // href = /post_file_download.cm?c=… (token expires)
  comments: number;
};

export function parseDetail(html: string): Detail {
  const start = html.indexOf("<div class='board_view");
  if (start < 0) throw new Error("imweb markup changed: board_view not found");
  let view = html.slice(start);
  const end = view.indexOf('<div class="comment_section"');
  if (end >= 0) view = view.slice(0, end);
  const h1 = req(/<h1 class="view_tit">([\s\S]*?)<\/h1>/, view, "title");
  // Malformed on imweb: the category </a> comes before </span>. Pinned posts show a 공지 sticker instead.
  const category =
    /category=[^"&]*"><span class="category"[^>]*>([\s\S]*?)<\/a>/.exec(h1);
  const body =
    /<div class="margin-top-xxl _comment_body_\w+">([\s\S]*)<\/div>\s*<div class="file_area">([\s\S]*?)<\/div>\s*<\/div>\s*$/.exec(
      view,
    );
  if (!body) throw new Error("imweb markup changed: body not found");
  return {
    title: txt(
      h1.replace(
        /<a [^>]*category=[\s\S]*?<\/a>\s*<\/span>|<span class="sticker[^>]*>[\s\S]*?<\/span>/g,
        "",
      ),
    ),
    category: category ? txt(category[1]) || null : null,
    author:
      txt(/<div class="write">([\s\S]*?)<\/div>/.exec(view)?.[1] ?? "") || null,
    // The .date element is relative ("3시간전"); JSON-LD has the full time. dateModified also bumps on comments.
    created: req(/"datePublished"\s*:\s*"([^"]+)"/, html, "datePublished"),
    bodyHtml: body[1].trim(),
    attachments: [
      ...body[2].matchAll(
        /<a [^>]*href="(\/post_file_download\.cm\?c=[^"]+)"[^>]*>\s*<p class="tit">([\s\S]*?)<\/p>/g,
      ),
    ].map((m) => ({ name: txt(m[2]), href: decode(m[1]) })),
    comments: (html.match(/<div class="comment" id="c\w+">/g) ?? []).length,
  };
}

/** New-site board for an imweb board path (25 → branches, gallery years → notice-gallery). */
export function targetBoard(slug: string) {
  const board = legacyBoards[slug]?.board ?? slug;
  if (!Object.hasOwn(boards, board)) throw new Error(`unknown board ${slug}`);
  return board as BoardSlug;
}

/** New board, category, author, dates and flags for an imweb post. */
export function postRecord(slug: string, row: ListRow, detail: Detail) {
  const board = targetBoard(slug);
  const category =
    legacyBoards[slug]?.category ?? detail.category ?? row.category ?? "";
  const createdAt = new Date(detail.created).toISOString(); // throws on a bad date
  return {
    id: row.idx,
    board,
    category: category === "새 카테고리" ? "" : category, // imweb's unnamed default category
    title: detail.title || row.title,
    author: detail.author ?? row.author ?? "관리자",
    createdAt,
    views: row.views,
    pinned: row.pinned,
  };
}

/** Image alt: artworks get "<작가>의 <상훈> 수상작"; imweb alts that are just file names or hashes become "". */
export function imageAlt(alt: string, board: BoardSlug, title: string) {
  const { award, name } = splitAwardTitle(title);
  if (boards[board].layout === "artwork" && award)
    return `${name}의 ${award} 수상작`;
  const clean = alt.replace(/[[\]\n]/g, "").trim();
  return /\.[a-z0-9]{2,5}$/i.test(clean) || /^[0-9a-f]{10,}$/i.test(clean)
    ? ""
    : clean;
}

// Same rules as safeHref in lib/markup.tsx (a .tsx file cannot be loaded by plain node; tests check they agree).
export function safeHref(href: string) {
  if (/^https?:\/\/[^\s]+$/i.test(href)) return href;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return href;
  if (/^tel:[0-9+\-() ]+$/i.test(href)) return href;
  if (/^\/(?![/\\])/.test(href)) return href;
  return null;
}

/** Site links become new-site paths (imweb detail links /<board>/?idx=N… → /<newBoard>/N); unsafe links → null. */
export function rewriteHref(raw: string) {
  const href = raw.trim();
  let url: URL;
  try {
    url = new URL(href, "https://kcca-society.kr/"); // the canonical domain, even when crawling IMWEB_URL
  } catch {
    return null;
  }
  if (
    /^https?:$/.test(url.protocol) &&
    url.hostname.replace(/^www\./, "") === "kcca-society.kr"
  ) {
    const slug = url.pathname.split("/")[1];
    const idx = url.searchParams.get("idx");
    if (slug && idx && /^\d+$/.test(idx))
      return `/${legacyBoards[slug]?.board ?? slug}/${idx}`;
    return url.pathname + url.search + url.hash;
  }
  return safeHref(href);
}

const IMAGE = /^!\[[^\]\n]*\]\([^)\s]+\)$/;
const TOKEN =
  /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;
const BLOCK = new Set([
  "p",
  "div",
  "blockquote",
  "pre",
  "table",
  "tr",
  "figure",
  "section",
  "article",
  "hr",
]);
const FRAMES = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "strong",
  "b",
  "a",
]);

function attr(attrs: string, name: string) {
  const m = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    "i",
  ).exec(attrs);
  return m ? decode(m[1] ?? m[2] ?? m[3]) : null;
}

const edges = (s: string) => /^(\s*)([\s\S]*?)(\s*)$/.exec(s)!;

// Headings and list items are one line each in lib/markup; images inside them stay on their own lines.
// ponytail: a nested list is folded into its parent item's line (imweb posts have none).
function flatten(text: string, prefix: string) {
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length) out.push(prefix + run.join(" "));
    run = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (IMAGE.test(line)) {
      flush();
      out.push(line);
    } else if (line) run.push(line);
  }
  flush();
  return out.join("\n\n");
}

// **bold** cannot span lines, so each line is wrapped on its own; whitespace stays outside the markers.
function bold(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const [, lead, core, trail] = edges(line);
      if (!core || IMAGE.test(core) || core.startsWith("#")) return line;
      const inner = core.replaceAll("**", "");
      return inner.startsWith("- ")
        ? `${lead}- **${inner.slice(2)}**${trail}`
        : `${lead}**${inner}**${trail}`;
    })
    .join("\n");
}

function link(label: string, raw: string | undefined) {
  const href = raw ? rewriteHref(raw) : null;
  const [, lead, core, trail] = edges(label.replace(/\s*\n\s*/g, " "));
  const text = core.replaceAll("**", "");
  // ponytail: a label with [ ] or an image keeps its text but loses the link (none on imweb today).
  if (!href || !text || /[[\]]/.test(text) || label.includes("!["))
    return label;
  // Bare URLs autolink, but lib/markup stops a bare URL at the first non-ASCII character.
  if (text === href && /^https?:\/\/[\x21-\x7e]+$/i.test(href))
    return lead + href + trail;
  const md = `[${text}](${href.replace(/\s/g, "%20").replace(/\)/g, "%29")})`;
  return lead + (core.includes("**") ? `**${md}**` : md) + trail;
}

/**
 * Froala body HTML → lib/markup.tsx syntax. `image(src, alt)` returns the markup line for each <img>
 * ("" drops it); it is also a handy way to list the image sources in document order.
 */
export function toMarkup(
  html: string,
  image: (src: string, alt: string) => string,
) {
  type Frame = { tag: string; out: string; href?: string };
  const stack: Frame[] = [{ tag: "", out: "" }];
  const lists: { ordered: boolean; n: number }[] = [];
  // The post's top non-empty heading level becomes ## (under the page's h1) and deeper ones ###, so no level is skipped.
  const top = [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)]
    .filter((m) => txt(m[2]))
    .map((m) => m[1].toLowerCase())
    .sort()[0];
  const emit = (s: string) => {
    stack[stack.length - 1].out += s;
  };
  const close = (frame: Frame) => {
    const { tag, out } = frame;
    if (tag[0] === "h")
      emit(`\n\n${flatten(out, tag <= top ? "## " : "### ")}\n\n`);
    else if (tag === "li") {
      const list = lists[lists.length - 1];
      const item = flatten(out, list?.ordered ? `${++list.n}. ` : "- ");
      // Items of one list sit on consecutive lines (a blank line would start a new list).
      const parent = stack[stack.length - 1];
      parent.out = parent.out.replace(/[ \t]*$/, "");
      if (item)
        emit(
          `${parent.out && !parent.out.endsWith("\n") ? "\n" : ""}${item}\n`,
        );
    } else if (tag === "a") emit(link(out, frame.href));
    else
      emit(
        stack.some((f) => /^h\d$/.test(f.tag)) || !out.trim() ? out : bold(out),
      );
  };
  for (const [token, skipped, slash, name, attrs = ""] of html.matchAll(
    TOKEN,
  )) {
    if (skipped || token.startsWith("<!--")) continue;
    if (!name) {
      emit(decode(token.replace(/[\r\n\t]+/g, " ")).replace(/ /g, " "));
      continue;
    }
    const tag = name.toLowerCase();
    if (slash) {
      const at = stack.findLastIndex((f) => f.tag === tag);
      if (at > 0) while (stack.length > at) close(stack.pop()!);
      else if (tag === "ul" || tag === "ol") {
        lists.pop();
        emit("\n\n");
      } else if (BLOCK.has(tag)) emit("\n\n");
    } else if (tag === "br") emit("\n");
    else if (tag === "img") {
      const line = image(attr(attrs, "src") ?? "", attr(attrs, "alt") ?? "");
      if (line) emit(`\n\n${line}\n\n`);
    } else if (tag === "iframe") {
      // No embeds on imweb today; keep a video as its URL (autolinked) rather than losing it.
      const src = (attr(attrs, "src") ?? "").replace(/^\/\//, "https://");
      if (/^https?:\/\/\S+$/.test(src)) emit(`\n\n${src}\n\n`);
    } else if (FRAMES.has(tag)) {
      if (!attrs.trim().endsWith("/"))
        stack.push({ tag, out: "", href: attr(attrs, "href") ?? undefined });
    } else if (tag === "ul" || tag === "ol") {
      lists.push({ ordered: tag === "ol", n: 0 });
      emit("\n\n");
    } else if (BLOCK.has(tag)) emit("\n\n");
  }
  while (stack.length > 1) close(stack.pop()!);
  return stack[0].out
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
