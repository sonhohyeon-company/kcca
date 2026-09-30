import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pageRange, splitAwardTitle } from "../lib/boards";
import { legacyRedirect } from "../app/(site)/[board]/legacy";

test("artwork titles split into award and artist", () => {
  assert.deepEqual(splitAwardTitle("은상_김현희"), {
    award: "은상",
    name: "김현희",
  });
  assert.deepEqual(splitAwardTitle("금싱_정미라"), {
    award: "금싱",
    name: "정미라",
  });
  assert.deepEqual(splitAwardTitle("대상_홍_길동"), {
    award: "대상",
    name: "홍_길동",
  });
  for (const title of ["김현희", "_김현희", "은상_", "은상_ "]) {
    assert.deepEqual(
      splitAwardTitle(title),
      { award: null, name: title },
      title,
    );
  }
});

test("pagination shows at most 5 pages around the current one", () => {
  assert.deepEqual(pageRange(1, 1), [1]);
  assert.deepEqual(pageRange(2, 3), [1, 2, 3]);
  assert.deepEqual(pageRange(1, 10), [1, 2, 3, 4, 5]);
  assert.deepEqual(pageRange(5, 10), [3, 4, 5, 6, 7]);
  assert.deepEqual(pageRange(9, 10), [6, 7, 8, 9, 10]);
  assert.deepEqual(pageRange(10, 10), [6, 7, 8, 9, 10]);
  assert.deepEqual(pageRange(1, 0), []);
});

test("old imweb board URLs redirect to their new address", () => {
  const gallery2025 = `/notice-gallery?category=${encodeURIComponent("2025 대한민국 청목캘리그라피 공모전")}`;
  const cases: [string, Record<string, string | string[]>, string | null][] = [
    ["25", {}, "/branches"],
    ["25", { idx: "173353821", bmode: "view" }, "/branches/173353821"],
    ["notice-gallery-2025", {}, gallery2025],
    ["notice-gallery-2024", { idx: "173460414" }, "/notice-gallery/173460414"],
    [
      "notice-association",
      { idx: "173353821", bmode: "view" },
      "/notice-association/173353821",
    ],
    ["notice-association", { idx: "abc" }, null],
    ["notice-association", { idx: ["1", "2"] }, null],
    ["notice-association", {}, null],
    ["no-such-board", { idx: "173353821" }, null],
    ["constructor", {}, null],
  ];
  for (const [slug, query, to] of cases) {
    assert.equal(
      legacyRedirect(slug, query),
      to,
      `${slug} ${JSON.stringify(query)}`,
    );
  }
});

test("이전/다음 글 stay inside the search the post was opened from", async () => {
  process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), "kcca-boards-"));
  // lib/db runs outside a Next request here.
  const stubs: Record<string, string> = {
    "server-only": "",
    "next/server": "exports.connection = async () => {};",
  };
  registerHooks({
    resolve: (specifier, context, next) =>
      Object.hasOwn(stubs, specifier)
        ? { url: `stub:${specifier}`, shortCircuit: true }
        : next(specifier, context),
    load: (url, context, next) =>
      url.startsWith("stub:")
        ? {
            format: "commonjs",
            source: stubs[url.slice(5)],
            shortCircuit: true,
          }
        : next(url, context),
  });
  const { adjacentPosts, createPost } = await import("../lib/db");
  const add = (title: string, day: number) => {
    const createdAt = `2026-01-0${day}T00:00:00.000Z`;
    const id = createPost({
      board: "notice-association",
      category: "",
      title,
      body: "",
      cover: null,
      attachments: [],
      pinned: false,
      createdAt,
    });
    return { id, board: "notice-association", createdAt };
  };
  add("QA 공지", 1);
  add("50% 할인", 2);
  const post = add("QA 안내", 3);
  add("기타", 4);
  const title = async (q: string) => {
    const { older, newer } = await adjacentPosts(post, "", q);
    return [older?.title ?? null, newer?.title ?? null];
  };
  assert.deepEqual(await title(""), ["50% 할인", "기타"]);
  assert.deepEqual(await title("QA"), ["QA 공지", null]);
  // "%" is matched literally, as in the list's search.
  assert.deepEqual(await title("%"), ["50% 할인", null]);
});
