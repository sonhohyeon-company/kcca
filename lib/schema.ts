// Shared by the app (lib/db.ts) and scripts/import-imweb.ts, so only node: imports here.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// server.js chdirs into .next/standalone, so production must pass an absolute DATA_DIR.
// turbopackIgnore (here and in lib/uploads.ts) keeps ./data out of the standalone build trace.
export const dataDir = () =>
  path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? "data");

export function openDb(
  file = path.join(/*turbopackIgnore: true*/ dataDir(), "kcca.db"),
) {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA secure_delete = ON;            -- deleted applicant data is overwritten, not left in free pages
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- never reused (shared links); imported posts keep their imweb idx
      board TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',        -- lib/markup.tsx syntax
      cover TEXT,                           -- /uploads/<name>
      attachments TEXT NOT NULL DEFAULT '[]', -- JSON Attachment[]
      pinned INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      author TEXT NOT NULL DEFAULT '관리자',
      created_at TEXT NOT NULL,             -- UTC ISO string
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS posts_board ON posts (board, pinned DESC, created_at DESC);
    CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,               -- kakao | naver | google (lib/profile.ts)
      provider_id TEXT NOT NULL,            -- the member's id at that provider
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,                  -- digits only, e.g. 01012345678
      created_at TEXT NOT NULL,
      last_login_at TEXT NOT NULL,
      UNIQUE (provider, provider_id)
    );
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      file_name TEXT,                       -- original file name
      file TEXT,                            -- stored name under DATA_DIR/private
      created_at TEXT NOT NULL
    );
  `);
  return db;
}
