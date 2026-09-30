import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  bodyImages,
  renderBody,
  safeHref,
  safeImageSrc,
  toPlainText,
} from "../lib/markup";
import {
  clientIp,
  createLimiter,
  signSession,
  verifySession,
} from "../lib/session";
import {
  formatDate,
  formatDateTime,
  fromKstInput,
  isoDate,
  toKstInput,
} from "../lib/format";
import { findMenu, getBoard, legacyBoards } from "../lib/boards";

const html = (body: string) => renderToStaticMarkup(<>{renderBody(body)}</>);

test("post bodies never render raw HTML", () => {
  const out = html('<script>alert(1)</script>\n<img src=x onerror="alert(1)">');
  assert.doesNotMatch(out, /<script|<img src="x"/);
  assert.match(out, /&lt;script&gt;/);
});

test("post body syntax renders paragraphs, headings, lists, images and links", () => {
  const out = html(
    "## 공모부문\n\n① 붓\n② 펜\n\n- 성명\n- 연락처\n\n![작품](/uploads/abc.webp)\n\n**접수기간** [요강](/notice-contest/1) https://kcca-society.kr/.",
  );
  assert.match(out, /<h2>공모부문<\/h2>/);
  assert.match(out, /<p>① 붓<br\/>② 펜<\/p>/);
  assert.match(out, /<ul><li>성명<\/li><li>연락처<\/li><\/ul>/);
  assert.match(
    out,
    /<figure><img src="\/_next\/image\?url=%2Fuploads%2Fabc.webp&amp;w=1080&amp;q=75" alt="작품" loading="eager" fetchPriority="high"/,
  );
  assert.match(out, /<strong>접수기간<\/strong>/);
  assert.match(out, /<a href="\/notice-contest\/1">요강<\/a>/);
  // Trailing punctuation stays outside a bare URL.
  assert.match(out, /href="https:\/\/kcca-society.kr\/" target="_blank"/);
  // A Korean particle right after a bare URL is not part of it.
  assert.match(
    html("주소는 https://kcca-society.kr/notice입니다."),
    /href="https:\/\/kcca-society.kr\/notice" target="_blank".*<\/a>입니다\.<\/p>/,
  );
  // Files stay plain links (next/link would prefetch them).
  assert.match(
    html("[안내문](/uploads/a.pdf)"),
    /<a href="\/uploads\/a.pdf">안내문<\/a>/,
  );
  // Lines such as "-성명" (no space) and "2026. 10. 1" stay plain text.
  assert.equal(
    html("-성명\n2026. 10. 1(목)"),
    "<p>-성명<br/>2026. 10. 1(목)</p>",
  );
});

test("only the first body picture loads eagerly; bundled assets are not optimized", () => {
  const out = html("![](/uploads/a.webp)\n![](/assets/b.webp)");
  assert.match(
    out,
    /<img src="\/_next\/image[^"]*" alt="" loading="eager" fetchPriority="high"/,
  );
  assert.match(out, /<img src="\/assets\/b.webp" alt="" loading="lazy"/);
  // Below a cover, no body picture is the first on the page.
  assert.doesNotMatch(
    renderToStaticMarkup(<>{renderBody("![](/uploads/a.webp)", false)}</>),
    /eager/,
  );
});

test("unclosed link brackets are parsed in linear time", () => {
  const body = "[".repeat(100_000);
  const start = performance.now();
  html(body);
  toPlainText(body);
  assert.ok(performance.now() - start < 1000);
});

test("unsafe URLs are dropped", () => {
  for (const href of [
    "javascript:alert(1)",
    "//evil.test",
    "data:text/html,x",
    "/\\evil",
  ]) {
    assert.equal(safeHref(href), null, href);
  }
  assert.equal(safeImageSrc("https://evil.test/a.png"), null);
  assert.equal(safeImageSrc("/uploads/../kcca.db"), null);
  const out = html("[x](javascript:alert(1))\n\n![a](https://evil.test/a.png)");
  assert.doesNotMatch(out, /javascript:|evil/);
});

test("plain text and image helpers", () => {
  const body =
    "## 제목\n\n**굵게** [링크](/a)\n\n![](/uploads/a.webp)\n![](/uploads/b.webp)";
  assert.equal(toPlainText(body), "제목 굵게 링크");
  assert.equal(toPlainText("가나다라마", 3), "가나…");
  assert.deepEqual(bodyImages(body), ["/uploads/a.webp", "/uploads/b.webp"]);
});

test("admin session tokens expire and depend on secret and password", () => {
  const now = Date.UTC(2026, 8, 29);
  const token = signSession("secret", "password-1234", now);
  assert.ok(verifySession("secret", "password-1234", token, now + 1000));
  assert.ok(!verifySession("other", "password-1234", token, now + 1000));
  assert.ok(!verifySession("secret", "changed-password", token, now + 1000));
  assert.ok(
    !verifySession("secret", "password-1234", token, now + 13 * 3600 * 1000),
  );
  assert.ok(!verifySession("secret", "password-1234", `${token}.x`, now));
  assert.ok(
    !verifySession("secret", "password-1234", "9999999999.forged", now),
  );
  // Validly signed but longer-lived than a login: rejected.
  const forever = signSession(
    "secret",
    "password-1234",
    now + 10 * 365 * 86400 * 1000,
  );
  assert.ok(!verifySession("secret", "password-1234", forever, now));
});

test("client IP uses the proxy-appended address and login limiter locks after 5 failures", () => {
  assert.equal(clientIp("1.1.1.1, 2.2.2.2", null), "2.2.2.2");
  assert.equal(clientIp(null, "3.3.3.3"), "3.3.3.3");
  // IPv6 clients are keyed by /64, so rotating addresses inside it does not reset the limit.
  assert.equal(clientIp("2001:db8:1:2:aaaa::1", null), "2001:db8:1:2::/64");
  assert.equal(clientIp(null, "2001:db8:1:2:5:6:7:8"), "2001:db8:1:2::/64");
  assert.equal(clientIp("2001:db8::1", null), "2001:db8:0:0::/64");
  assert.equal(clientIp("::ffff:1.2.3.4", null), "::ffff:1.2.3.4");
  const limiter = createLimiter(5, 1000);
  for (let i = 0; i < 5; i++) limiter.fail("ip", 0);
  assert.ok(limiter.blocked("ip", 10));
  assert.ok(!limiter.blocked("ip", 1001));
  // The map stays bounded: past 10,000 keys the oldest are dropped.
  const many = createLimiter(1, 1000);
  for (let i = 0; i <= 10_000; i++) many.fail(`k${i}`, 0);
  assert.ok(!many.blocked("k0", 0));
  assert.ok(many.blocked("k10000", 0));
});

test("dates are shown and edited in Korea time", () => {
  assert.equal(formatDate("2026-08-30T15:30:00.000Z"), "2026.08.31");
  assert.equal(isoDate("2026-08-30T14:59:00.000Z"), "2026-08-30");
  assert.equal(toKstInput("2026-08-30T15:30:00.000Z"), "2026-08-31T00:30");
  assert.equal(fromKstInput("2026-08-31T00:30"), "2026-08-30T15:30:00.000Z");
  assert.equal(fromKstInput("2026-13-01T00:00"), null);
  assert.equal(fromKstInput("2026-02-31T10:00"), null);
  assert.equal(fromKstInput("2026-08-31T24:00"), null);
  assert.equal(formatDateTime("2026-08-30T15:30:00.000Z"), "2026.08.31 00:30");
});

test("menu and legacy board lookups", () => {
  assert.equal(findMenu("/certificate-guide-3")?.item.title, "자격증 안내");
  assert.equal(
    findMenu("/notice-association/173353821")?.group.title,
    "협회활동",
  );
  assert.equal(getBoard("toString"), null);
  assert.equal(getBoard("notice-gallery")?.layout, "artwork");
  assert.equal(legacyBoards["notice-gallery-2025"].board, "notice-gallery");
});
