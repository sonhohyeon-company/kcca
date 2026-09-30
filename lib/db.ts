import "server-only";
import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { connection } from "next/server";
import type { Provider } from "./profile";
import { openDb } from "./schema";

// Opened lazily: `next build` imports route modules where DATA_DIR may not exist.
let db: DatabaseSync | undefined;
const getDb = () => (db ??= openDb());

export type Attachment = { name: string; url: string; size: number };

export type Post = {
  id: number;
  board: string;
  category: string;
  title: string;
  body: string;
  cover: string | null;
  attachments: Attachment[];
  pinned: boolean;
  views: number;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type PostSummary = Omit<Post, "body" | "attachments">;

type PostInput = {
  board: string;
  category: string;
  title: string;
  body: string;
  cover: string | null;
  attachments: Attachment[];
  pinned: boolean;
  createdAt: string;
};

type Row = Record<string, string | number | null>;

const summaryColumns =
  "id, board, category, title, cover, pinned, views, author, created_at, updated_at";

function toSummary(row: Row): PostSummary {
  return {
    id: Number(row.id),
    board: String(row.board),
    category: String(row.category),
    title: String(row.title),
    cover: row.cover === null ? null : String(row.cover),
    pinned: row.pinned === 1,
    views: Number(row.views),
    author: String(row.author),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toPost(row: Row): Post {
  return {
    ...toSummary(row),
    body: String(row.body),
    attachments: JSON.parse(String(row.attachments)) as Attachment[],
  };
}

const order = "ORDER BY pinned DESC, created_at DESC, id DESC";

// Title or body contains the search words; LIKE wildcards in them match literally.
const search = "(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')";
const likeParam = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;

// Every read awaits connection() so pages are rendered per request, never at build.

export async function listPosts({
  board,
  category = "",
  q = "",
  page = 1,
  perPage = 12,
}: {
  board?: string;
  category?: string;
  q?: string;
  page?: number;
  perPage?: number;
}) {
  await connection();
  const where: string[] = [];
  const params: string[] = [];
  if (board) {
    where.push("board = ?");
    params.push(board);
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }
  if (q.trim()) {
    const like = likeParam(q.trim());
    where.push(search);
    params.push(like, like);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = Number(
    (
      getDb()
        .prepare(`SELECT COUNT(*) AS n FROM posts ${clause}`)
        .get(...params) as Row
    ).n,
  );
  const offset = (Math.max(1, page) - 1) * perPage;
  const posts = getDb()
    .prepare(
      `SELECT ${summaryColumns} FROM posts ${clause} ${order} LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, offset) as Row[];
  return { posts: posts.map(toSummary), total };
}

/** Newest posts of a board (pinned first), optionally only those with a cover image. */
export async function latestPosts(
  board: string,
  limit: number,
  withCover = false,
) {
  await connection();
  const rows = getDb()
    .prepare(
      `SELECT ${summaryColumns} FROM posts WHERE board = ? ${withCover ? "AND cover IS NOT NULL" : ""} ${order} LIMIT ?`,
    )
    .all(board, limit) as Row[];
  return rows.map(toSummary);
}

export async function getPost(id: number) {
  await connection();
  const row = getDb().prepare("SELECT * FROM posts WHERE id = ?").get(id) as
    Row | undefined;
  return row ? toPost(row) : null;
}

/** Older and newer neighbours in the same board (and category and search, when given), by created date. */
export async function adjacentPosts(
  post: Pick<Post, "id" | "board" | "createdAt">,
  category: string,
  q: string,
) {
  await connection();
  const like = likeParam(q.trim());
  const pick = (op: "<" | ">", dir: "DESC" | "ASC") =>
    getDb()
      .prepare(
        `SELECT ${summaryColumns} FROM posts WHERE board = ? AND (? = '' OR category = ?)
         AND (? = '' OR ${search})
         AND (created_at ${op} ? OR (created_at = ? AND id ${op} ?))
         ORDER BY created_at ${dir}, id ${dir} LIMIT 1`,
      )
      .get(
        post.board,
        category,
        category,
        q.trim(),
        like,
        like,
        post.createdAt,
        post.createdAt,
        post.id,
      ) as Row | undefined;
  const older = pick("<", "DESC");
  const newer = pick(">", "ASC");
  return {
    older: older ? toSummary(older) : null,
    newer: newer ? toSummary(newer) : null,
  };
}

/** Categories used in a board, most recently used first. */
export async function boardCategories(board: string) {
  await connection();
  const rows = getDb()
    .prepare(
      `SELECT category FROM posts WHERE board = ? AND category != ''
       GROUP BY category ORDER BY MAX(created_at) DESC`,
    )
    .all(board) as Row[];
  return rows.map((row) => String(row.category));
}

export async function countPostsByBoard() {
  await connection();
  const rows = getDb()
    .prepare("SELECT board, COUNT(*) AS n FROM posts GROUP BY board")
    .all() as Row[];
  return Object.fromEntries(
    rows.map((row) => [String(row.board), Number(row.n)]),
  );
}

export function incrementViews(id: number) {
  getDb().prepare("UPDATE posts SET views = views + 1 WHERE id = ?").run(id);
}

export function createPost(input: PostInput) {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO posts (board, category, title, body, cover, attachments, pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.board,
      input.category,
      input.title,
      input.body,
      input.cover,
      JSON.stringify(input.attachments),
      input.pinned ? 1 : 0,
      input.createdAt,
      now,
    );
  return Number(result.lastInsertRowid);
}

export function updatePost(id: number, input: PostInput) {
  getDb()
    .prepare(
      `UPDATE posts SET board = ?, category = ?, title = ?, body = ?, cover = ?, attachments = ?,
       pinned = ?, created_at = ?, updated_at = ? WHERE id = ?`,
    )
    .run(
      input.board,
      input.category,
      input.title,
      input.body,
      input.cover,
      JSON.stringify(input.attachments),
      input.pinned ? 1 : 0,
      input.createdAt,
      new Date().toISOString(),
      id,
    );
}

export function deletePost(id: number) {
  getDb().prepare("DELETE FROM posts WHERE id = ?").run(id);
}

/** Original file name of a public attachment (/uploads/<name>), or null when no post lists it. */
export function attachmentName(url: string) {
  const row = getDb()
    .prepare(
      "SELECT attachments FROM posts WHERE instr(attachments, ?) LIMIT 1",
    )
    .get(JSON.stringify(url)) as Row | undefined;
  const files = row
    ? (JSON.parse(String(row.attachments)) as Attachment[])
    : [];
  return files.find((file) => file.url === url)?.name ?? null;
}

/** Every /uploads/ URL still referenced by posts, pages or settings (to avoid deleting shared files). */
export function referencedUploads() {
  const text = [
    ...(
      getDb()
        .prepare("SELECT body, cover, attachments FROM posts")
        .all() as Row[]
    ).flatMap((row) => [row.body, row.cover, row.attachments]),
    ...(getDb().prepare("SELECT body FROM pages").all() as Row[]).map(
      (row) => row.body,
    ),
    ...(getDb().prepare("SELECT value FROM settings").all() as Row[]).map(
      (row) => row.value,
    ),
  ].join("\n");
  return new Set(text.match(/\/uploads\/[a-z0-9-]+\.[a-z0-9]+/g) ?? []);
}

// Pages: admin-editable text pages (조직도, 이용약관, 개인정보처리방침).

export const editablePages = {
  "about-organization": "조직도",
  policy: "이용약관",
  privacy: "개인정보처리방침",
} as const;
export type PageSlug = keyof typeof editablePages;

export async function getPage(slug: PageSlug) {
  await connection();
  const row = getDb()
    .prepare("SELECT * FROM pages WHERE slug = ?")
    .get(slug) as Row | undefined;
  return {
    slug,
    title: row ? String(row.title) : editablePages[slug],
    body: row ? String(row.body) : "",
    updatedAt: row ? String(row.updated_at) : null,
  };
}

export function savePage(slug: PageSlug, title: string, body: string) {
  getDb()
    .prepare(
      `INSERT INTO pages (slug, title, body, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (slug) DO UPDATE SET title = excluded.title, body = excluded.body, updated_at = excluded.updated_at`,
    )
    .run(slug, title, body, new Date().toISOString());
}

// Settings: one JSON value per key, merged over defaults.

const defaultSettings = {
  /** Short status badge on the home page, e.g. "작품 접수 중". */
  contestStatus: "작품 접수 예정",
  contestTitle: "2026 대한민국 청목캘리그라피 공모전",
  contestPeriod: "2026. 10. 1(목) ~ 11. 10(화)",
  contestNote:
    "방문접수 및 우편접수 가능 · 우편접수는 11. 10.(화) 소인분까지 유효합니다.",
  contestLink: "/notice-contest",
  popupEnabled: false,
  popupImage: "",
  popupAlt: "",
  popupLink: "",
  /** Last day (KST, YYYY-MM-DD) the popup shows; empty means no end date. */
  popupUntil: "",
};
export type Settings = typeof defaultSettings;

export async function getSettings(): Promise<Settings> {
  await connection();
  const rows = getDb()
    .prepare("SELECT key, value FROM settings")
    .all() as Row[];
  const saved = Object.fromEntries(
    rows
      .filter((row) => Object.hasOwn(defaultSettings, String(row.key)))
      .map((row) => [String(row.key), JSON.parse(String(row.value))]),
  );
  return { ...defaultSettings, ...saved };
}

export function saveSettings(values: Partial<Settings>) {
  const statement = getDb().prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
  );
  for (const [key, value] of Object.entries(values)) {
    if (Object.hasOwn(defaultSettings, key))
      statement.run(key, JSON.stringify(value));
  }
}

/** Random per-install secret stored under `key` in settings (kept out of the defaults above). */
function installSecret(key: string) {
  const read = () =>
    getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
      Row | undefined;
  if (!read())
    getDb()
      .prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
      .run(key, randomBytes(32).toString("hex"));
  return String(read()!.value);
}

/** Signs admin sessions. */
export const sessionSecret = () => installSecret("session_secret");
/** Signs member sessions and login cookies; separate so an admin logout keeps members logged in. */
export const memberSecret = () => installSecret("member_secret");

/** Drops the secret; the next sessionSecret() call makes a new one, which invalidates every session. */
export function resetSessionSecret() {
  getDb().prepare("DELETE FROM settings WHERE key = 'session_secret'").run();
}

// Deleted rows are zeroed (secure_delete in lib/schema.ts); this also empties the WAL copy.
const flushDeleted = () => getDb().exec("PRAGMA wal_checkpoint(TRUNCATE)");

// Members: people who logged in with Kakao, Naver or Google (/login, lib/oauth.ts).

export type Member = {
  id: number;
  provider: Provider;
  providerId: string;
  email: string;
  name: string;
  /** Digits only (lib/profile.ts normalizePhone). */
  phone: string;
  createdAt: string;
  lastLoginAt: string;
};

function toMember(row: Row): Member {
  return {
    id: Number(row.id),
    provider: String(row.provider) as Provider,
    providerId: String(row.provider_id),
    email: String(row.email),
    name: String(row.name),
    phone: String(row.phone),
    createdAt: String(row.created_at),
    lastLoginAt: String(row.last_login_at),
  };
}

export async function getMember(id: number) {
  await connection();
  const row = getDb().prepare("SELECT * FROM members WHERE id = ?").get(id) as
    Row | undefined;
  return row ? toMember(row) : null;
}

export async function findMember(provider: Provider, providerId: string) {
  await connection();
  const row = getDb()
    .prepare("SELECT * FROM members WHERE provider = ? AND provider_id = ?")
    .get(provider, providerId) as Row | undefined;
  return row ? toMember(row) : null;
}

export function createMember(
  input: Pick<Member, "provider" | "providerId" | "email" | "name" | "phone">,
) {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO members (provider, provider_id, email, name, phone, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.provider,
      input.providerId,
      input.email,
      input.name,
      input.phone,
      now,
      now,
    );
  return Number(result.lastInsertRowid);
}

export function updateMember(
  id: number,
  values: Pick<Member, "email" | "name" | "phone">,
) {
  getDb()
    .prepare("UPDATE members SET email = ?, name = ?, phone = ? WHERE id = ?")
    .run(values.email, values.name, values.phone, id);
}

export function touchMemberLogin(id: number) {
  getDb()
    .prepare("UPDATE members SET last_login_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
}

export function deleteMember(id: number) {
  getDb().prepare("DELETE FROM members WHERE id = ?").run(id);
  flushDeleted();
}

/** Newest first; `q` matches name, phone digits or email. */
export async function listMembers({
  q = "",
  page = 1,
  perPage = 30,
}: {
  q?: string;
  page?: number;
  perPage?: number;
}) {
  await connection();
  const like = likeParam(q.trim());
  const where =
    "WHERE (? = '' OR name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')";
  const params = [q.trim(), like, like, like];
  const total = Number(
    (
      getDb()
        .prepare(`SELECT COUNT(*) AS n FROM members ${where}`)
        .get(...params) as Row
    ).n,
  );
  const rows = getDb()
    .prepare(`SELECT * FROM members ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, perPage, (Math.max(1, page) - 1) * perPage) as Row[];
  return { members: rows.map(toMember), total };
}

export async function countMembers() {
  await connection();
  return Number(
    (getDb().prepare("SELECT COUNT(*) AS n FROM members").get() as Row).n,
  );
}

// Applications: 시험 접수 신청서 submitted from /application-form.

type Application = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  fileName: string | null;
  file: string | null;
  createdAt: string;
};

function toApplication(row: Row): Application {
  return {
    id: Number(row.id),
    name: String(row.name),
    phone: String(row.phone),
    email: String(row.email),
    message: String(row.message),
    fileName: row.file_name === null ? null : String(row.file_name),
    file: row.file === null ? null : String(row.file),
    createdAt: String(row.created_at),
  };
}

export function createApplication(
  input: Omit<Application, "id" | "createdAt">,
) {
  const result = getDb()
    .prepare(
      "INSERT INTO applications (name, phone, email, message, file_name, file, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      input.name,
      input.phone,
      input.email,
      input.message,
      input.fileName,
      input.file,
      new Date().toISOString(),
    );
  return Number(result.lastInsertRowid);
}

export async function listApplications() {
  await connection();
  const rows = getDb()
    .prepare("SELECT * FROM applications ORDER BY id DESC")
    .all() as Row[];
  return rows.map(toApplication);
}

export async function getApplication(id: number) {
  await connection();
  const row = getDb()
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as Row | undefined;
  return row ? toApplication(row) : null;
}

export function deleteApplication(id: number) {
  getDb().prepare("DELETE FROM applications WHERE id = ?").run(id);
  flushDeleted();
}

/** Deletes applications created before the cutoff (retention limit); returns their stored file names. */
export function purgeApplications(beforeIso: string): string[] {
  const rows = getDb()
    .prepare("DELETE FROM applications WHERE created_at < ? RETURNING file")
    .all(beforeIso) as Row[];
  if (rows.length) flushDeleted();
  return rows.flatMap((row) => (row.file === null ? [] : [String(row.file)]));
}
