import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBody, safeHref as markupSafeHref } from "../lib/markup";
import {
  imageAlt,
  parseDetail,
  parseList,
  postRecord,
  rewriteHref,
  safeHref,
  toMarkup,
} from "../scripts/imweb";
import type { ListRow } from "../scripts/imweb";

// Excerpts of pages saved from kcca-society.kr on 2026-09-29.
const fixture = (name: string) =>
  readFileSync(path.join("tests/fixtures/imweb", `${name}.html`), "utf8");
const html = (body: string) => renderToStaticMarkup(renderBody(body));
const noImages = () => "";
const row = (over: Partial<ListRow>): ListRow => ({
  idx: 1,
  title: "",
  category: null,
  author: null,
  time: "",
  views: 0,
  pinned: false,
  ...over,
});

test("list page: rows, pinned, hidden categories, hidden views", () => {
  const { rows, maxPage } = parseList(fixture("list-notice-association"));
  assert.equal(maxPage, 1);
  assert.deepEqual(
    rows.map((r) => [r.idx, r.pinned, r.category, r.views, r.author]),
    [
      [174353034, true, null, 59, "관리자"],
      [173353821, true, null, 108, "관리자"],
      [174889177, false, null, 5, "관리자"],
      [173568854, false, null, 288, "관리자"],
      [173461003, false, null, 106, "관리자"],
    ],
  );
  assert.equal(rows[0].title, "2026 대한민국 청목캘리그라피 공모전");
  assert.equal(rows[0].time, "2026-09-18 00:23");
  assert.equal(
    rows[3].title,
    "📖NEW BOOK 청목 긴책 신간 출간_청목정체 · 청목아름체 · 청목바름체🖌️",
  );
});

test("gallery page: cards, hidden writer, pagination", () => {
  const { rows, maxPage } = parseList(fixture("list-notice-gallery-2024"));
  assert.equal(maxPage, 3);
  assert.deepEqual(
    rows.map((r) => [r.idx, r.title, r.views, r.author, r.pinned, r.time]),
    [
      [173460288, "동상_김순숙", 8, null, false, "2026-08-26 23:15"],
      [173460277, "동상_김재희", 4, null, false, "2026-08-26 23:14"],
      [173460266, "동상_김향순", 4, null, false, "2026-08-26 23:14"],
    ],
  );
});

test("detail page: title, JSON-LD date, attachment, category placeholder", () => {
  const detail = parseDetail(fixture("notice-contest-173353860"));
  assert.equal(detail.title, "2026대한민국 청목캘리그라피 공모전");
  assert.equal(detail.created, "2026-08-23T23:18:41+09:00");
  assert.equal(detail.author, "관리자");
  assert.equal(detail.comments, 0);
  assert.deepEqual(
    detail.attachments.map((a) => a.name),
    ["2026대한민국 캘리그라피 공모전.jpg"],
  );
  assert.match(detail.attachments[0].href, /^\/post_file_download\.cm\?c=/);
  const post = postRecord(
    "notice-contest",
    row({ idx: 173353860, category: "새 카테고리", views: 116 }),
    detail,
  );
  assert.deepEqual(post, {
    id: 173353860,
    board: "notice-contest",
    category: "",
    title: "2026대한민국 청목캘리그라피 공모전",
    author: "관리자",
    createdAt: "2026-08-23T14:18:41.000Z",
    views: 116,
    pinned: false,
  });
});

test("pinned detail: sticker dropped from the title, category from the list, comments counted", () => {
  const detail = parseDetail(fixture("notice-association-173353821"));
  assert.equal(detail.title, "한국청목캘리그라피협회 공식 홈페이지 오픈 안내");
  assert.equal(detail.category, null);
  assert.equal(detail.comments, 1);
  const post = postRecord(
    "notice-association",
    row({ category: "전시회", pinned: true }),
    detail,
  );
  assert.equal(post.category, "전시회");
  assert.equal(post.pinned, true);
  assert.equal(post.createdAt, "2026-08-23T14:16:15.000Z");
  assert.equal(
    toMarkup(detail.bodyHtml, noImages).split("\n\n")[0],
    "**한국청목캘리그라피협회 공식 홈페이지 오픈 안내**",
  );
});

test("2026 공모전 body: h4, strong + br, links, list", () => {
  const body = toMarkup(
    parseDetail(fixture("notice-contest-173353860")).bodyHtml,
    noImages,
  );
  assert.match(
    body,
    /^## 공모주제\n\n윤동주·이해인 시 중 1편을 선택하여 작품으로 표현\n\n/,
  );
  assert.match(
    body,
    /\n\n\*\*접수기간\*\*\n2026\. 10\. 1\(목\) ~ 11\. 10\(화\)\n\n\*\*접수방법\*\*\n\n/,
  );
  assert.match(
    body,
    /전화: \[031-878-0503\]\(tel:031-878-0503\)\n홈페이지: \[https:\/\/kcca-society\.kr\/\]\(\/\)/,
  );
  assert.match(body, /\n-성명\n\n-연락처\n/); // imweb's "-성명" lines stay plain text
  assert.doesNotMatch(body, /<|\n{3}|#+ \n|style=|^###/m);
  const out = html(body);
  // imweb's h4s are the top level here, so they become h2 under the page's h1; the empty <h4><br></h4> is dropped.
  assert.equal(out.match(/<h2>/g)?.length, 8);
  assert.match(
    out,
    /<p><strong>접수기간<\/strong><br\/>2026\. 10\. 1\(목\) ~ 11\. 10\(화\)<\/p>/,
  );
  assert.match(out, /<a href="tel:031-878-0503">031-878-0503<\/a>/);
  assert.match(out, /<a href="\/">https:\/\/kcca-society\.kr\/<\/a>/);
  assert.equal(out.match(/<ul>/g)?.length, 1);
  assert.equal(out.match(/<li>/g)?.length, 6);
});

test("YouTube notice: line breaks kept, channel link autolinked", () => {
  const detail = parseDetail(fixture("notice-association-173461003"));
  assert.equal(detail.title, "📢 한국청목캘리그라피협회 공식 유튜브 채널 안내");
  assert.equal(detail.category, null); // list boards show the category only in the list row
  assert.equal(
    postRecord("notice-association", row({ category: "외부협약" }), detail)
      .category,
    "외부협약",
  );
  const body = toMarkup(detail.bodyHtml, noImages);
  assert.match(body, /^안녕하세요\.\n한국청목캘리그라피협회입니다\.\n\n/);
  assert.match(
    body,
    /\n\n\[유튜브 채널 바로가기\]\n\n구독 🔔 · 좋아요 👍 · 공유 💌\n많은 관심과 참여 부탁드립니다\.\n\n/,
  );
  assert.match(
    body,
    /\n\nhttps:\/\/www\.youtube\.com\/channel\/UCDd-RgrF8juUjx51niKJxuA$/,
  );
  assert.match(
    html(body),
    /<a href="https:\/\/www\.youtube\.com\/channel\/UCDd-RgrF8juUjx51niKJxuA" target="_blank"/,
  );
});

test("gallery body: image re-hosted with artwork alt, stray text kept", () => {
  const detail = parseDetail(fixture("notice-gallery-2024-173460250"));
  const post = postRecord(
    "notice-gallery-2024",
    row({ idx: 173460250 }),
    detail,
  );
  assert.equal(post.board, "notice-gallery");
  assert.equal(post.category, "2024 韓•中국제 청목캘리그라피 공모전");
  assert.equal(post.author, "관리자");
  assert.equal(post.title, "동상_정재천");
  const srcs: string[] = [];
  const body = toMarkup(detail.bodyHtml, (src, alt) => {
    srcs.push(src);
    return `![${imageAlt(alt, post.board, post.title)}](/uploads/a.webp)`;
  });
  assert.deepEqual(srcs, [
    "https://cdn.imweb.me/upload/S20260629dc9b4a986a297/2311c06d26e24.jpg",
  ]);
  assert.equal(body, "![정재천의 동상 수상작](/uploads/a.webp)\n\n동ㅇ상");
});

test("images inside headings, lists and bold lines convert cleanly", () => {
  const img = (src: string) => `![](/uploads/${src.slice(-5)}.webp)`;
  assert.equal(
    toMarkup(
      '<h3>2.활동 사진</h3><h3><img src="https://cdn.imweb.me/upload/x/aaaaa" alt="paste.png" style="width:621px;" /><br /></h3><h3> </h3><h4><br /></h4>',
      img,
    ),
    "## 2.활동 사진\n\n![](/uploads/aaaaa.webp)",
  );
  assert.equal(
    toMarkup("<h2>가</h2><h3>나</h3><h4>다</h4><h2> </h2>", img),
    "## 가\n\n### 나\n\n### 다",
  );
  assert.equal(
    toMarkup(
      "<p><strong>· 청목정체<br />· 청목아름체</strong></p><ul>\n<li>하나</li>\n<li>둘<br>셋</li>\n</ul><ol><li>가</li><li>나</li></ol>",
      img,
    ),
    "**· 청목정체**\n**· 청목아름체**\n\n- 하나\n- 둘 셋\n\n1. 가\n2. 나",
  );
  assert.equal(
    toMarkup("<p>&lt;이미지 첨부 &gt;&nbsp;<script>x()</script></p>", img),
    "<이미지 첨부 >",
  );
});

test("links: site URLs rewritten, unsafe ones dropped, same rules as lib/markup", () => {
  const cases: [string, string | null][] = [
    ["https://kcca-society.kr/", "/"],
    ["http://www.kcca-society.kr/about-map", "/about-map"],
    ["/application-form", "/application-form"],
    [
      "/notice-gallery-2025/?q=YTox&bmode=view&idx=173460414&t=board",
      "/notice-gallery/173460414",
    ],
    [
      "https://kcca-society.kr/association/?idx=174003766&bmode=view",
      "/association/174003766",
    ],
    ["tel:031-878-0503", "tel:031-878-0503"],
    ["https://www.youtube.com/channel/x", "https://www.youtube.com/channel/x"],
    ["javascript:alert(1)", null],
    ["//evil.example/x", null],
  ];
  for (const [href, expected] of cases)
    assert.equal(rewriteHref(href), expected, href);
  assert.equal(
    toMarkup(
      '<p>a <a href="javascript:alert(1)">b</a> <a href="/notice-gallery-2024/?idx=5&amp;bmode=view">c</a></p>',
      noImages,
    ),
    "a b [c](/notice-gallery/5)",
  );
  for (const href of [
    "https://a.kr/x",
    "mailto:a@b.kr",
    "tel:02-1",
    "/x",
    "//x",
    "/\\x",
    "javascript:x",
    "data:x",
    "ftp://x",
  ]) {
    assert.equal(safeHref(href), markupSafeHref(href), href);
  }
});

test("image alt: file names and hashes dropped", () => {
  for (const alt of [
    "KakaoTalk_20260911_191932348.png",
    "paste.png",
    "89b2f864ec8c0.jpg",
    "1219e0016d3bc.jpeg",
    "",
  ]) {
    assert.equal(imageAlt(alt, "association", "협회활동"), "", alt);
  }
  assert.equal(imageAlt("단체 사진", "association", "협회활동"), "단체 사진");
  assert.equal(
    imageAlt("금상 정미라.jpg", "notice-gallery", "금싱_정미라"),
    "정미라의 금싱 수상작",
  );
});
