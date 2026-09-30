import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  checkFileSizes,
  isUploadUrl,
  parsePostForm,
  parseSettingsForm,
} from "../app/admin/validate";
import {
  insertBlock,
  prefixLines,
  wrapSelection,
} from "../components/admin/body-editor";
import { LoginForm, PageForm } from "../components/admin/forms";
import { PostForm, type PostFormValues } from "../components/admin/post-form";

const a = "/uploads/0f8fad5b-d9cb-469f-a165-70867728950e.webp";
const b = "/uploads/7c9e6679-7425-40de-944b-e07fc1f90ae7.webp";
const pdf = "/uploads/16fd2706-8baf-433b-82eb-8c7fada847da.pdf";

function form(values: Record<string, string | File | (string | File)[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value])
      data.append(key, item);
  }
  return data;
}

const post = (extra: Record<string, string | File | (string | File)[]> = {}) =>
  form({
    board: "notice-gallery",
    category: " 2025 공모전 ",
    title: " 은상_김현희 ",
    body: `소개\r\n\r\n![작품](${a})\n![작품](${b})`,
    createdAt: "2026-08-31T09:30",
    ...extra,
  });

test("editor helpers wrap, prefix and insert at the cursor", () => {
  assert.deepEqual(wrapSelection("가나다", 1, 2, "**", "**", "굵게"), {
    value: "가**나**다",
    start: 3,
    end: 4,
  });
  assert.equal(
    wrapSelection("가", 1, 1, "[", "](/a)", "링크 글자").value,
    "가[링크 글자](/a)",
  );

  // Every touched non-empty line gets the marker; another marker is replaced.
  assert.equal(
    prefixLines("하나\n- 둘\n\n셋", 0, 9, "## ").value,
    "## 하나\n## 둘\n\n## 셋",
  );
  assert.equal(prefixLines("하나\n둘", 4, 4, "- ").value, "하나\n- 둘");
  // A selection ending right after a newline does not touch the next line.
  assert.equal(prefixLines("하나\n둘", 0, 3, "- ").value, "- 하나\n둘");
  // Toggle off when all lines already have it.
  assert.equal(prefixLines("- 하나\n- 둘", 0, 7, "- ").value, "하나\n둘");
  // On a blank line (or an empty editor) the marker is inserted, cursor after it.
  assert.equal(prefixLines("\n둘", 0, 0, "- ").value, "- \n둘");
  assert.deepEqual(prefixLines("", 0, 0, "## "), {
    value: "## ",
    start: 3,
    end: 3,
  });

  const image = `![설명](${a})`;
  assert.deepEqual(insertBlock("앞뒤", 1, 1, image), {
    value: `앞\n${image}\n뒤`,
    start: 2 + image.length + 1,
    end: 2 + image.length + 1,
  });
  assert.equal(insertBlock("앞\n", 2, 2, image).value, `앞\n${image}\n`);
  assert.equal(insertBlock("", 0, 0, image).value, `${image}\n`);
});

test("only generated upload URLs are accepted", () => {
  assert.ok(isUploadUrl(a) && isUploadUrl(pdf));
  for (const bad of [
    "/uploads/../kcca.db",
    "/uploads/x.webp",
    `https://evil.test${a}`,
    `${a}?x`,
    "/private/0f8fad5b-d9cb-469f-a165-70867728950e.pdf",
  ]) {
    assert.ok(!isUploadUrl(bad), bad);
  }
});

test("post form: fields are trimmed and validated server-side", () => {
  const ok = parsePostForm(post({ pinned: "on" }), null);
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.title, "은상_김현희");
  assert.equal(ok.category, "2025 공모전");
  assert.equal(ok.body, `소개\n\n![작품](${a})\n![작품](${b})`);
  assert.equal(ok.createdAt, "2026-08-31T00:30:00.000Z");
  assert.equal(ok.pinned, true);
  assert.equal(ok.cover, a); // "auto" = first body image

  const bad = parsePostForm(
    post({ board: "toString", title: "  ", createdAt: "2026-13-01T00:00" }),
    null,
  );
  assert.deepEqual(Object.keys(bad.errors).sort(), [
    "board",
    "createdAt",
    "title",
  ]);
  assert.ok(
    parsePostForm(post({ title: "가".repeat(201) }), null).errors.title,
  );
});

test("post form: cover must be a body image or the stored cover", () => {
  const current = {
    cover: pdf,
    attachments: [],
    createdAt: "2026-08-31T00:30:15.123Z",
  };
  assert.equal(parsePostForm(post({ cover: b }), null).cover, b);
  // "auto" skips bundled /assets images: covers are always our uploads.
  assert.equal(
    parsePostForm(post({ body: `![](/assets/x.webp)\n![](${b})` }), null).cover,
    b,
  );
  assert.equal(parsePostForm(post({ cover: pdf }), current).cover, pdf);
  assert.equal(parsePostForm(post({ cover: "none" }), current).cover, null);
  for (const cover of [
    pdf,
    "/uploads/../../etc/passwd",
    "https://evil.test/a.webp",
  ]) {
    assert.ok(parsePostForm(post({ cover }), null).errors.cover, cover);
  }
  // "upload" needs a chosen file (an empty file input sends a 0-byte File).
  const empty = new File([], "");
  assert.ok(
    parsePostForm(post({ cover: "upload", coverFile: empty }), null).errors
      .cover,
  );
  const photo = new File(["x"], "a.jpg", { type: "image/jpeg" });
  assert.equal(
    parsePostForm(post({ cover: "upload", coverFile: photo }), null).coverFile,
    photo,
  );
  // An unchanged date keeps the stored seconds.
  assert.equal(parsePostForm(post(), current).createdAt, current.createdAt);
});

test("post form: attachments come from the stored post, never from the client", () => {
  const current = {
    cover: null,
    createdAt: "2026-08-31T00:30:00.000Z",
    attachments: [
      { name: "요강.pdf", url: pdf, size: 10 },
      { name: "b.webp", url: b, size: 20 },
    ],
  };
  const parsed = parsePostForm(
    post({
      removeAttachment: [b, "/uploads/forged.pdf"],
      attachments: [new File([], ""), new File(["x"], "신청서.hwp")],
    }),
    current,
  );
  assert.deepEqual(parsed.attachments, [current.attachments[0]]);
  assert.deepEqual(
    parsed.newAttachments.map((file) => file.name),
    ["신청서.hwp"],
  );
});

test("settings form: links, popup image and alt text", () => {
  const base = {
    contestStatus: "작품 접수 중",
    contestTitle: "2026 공모전",
    contestPeriod: "10. 1 ~ 11. 10",
    contestNote: "",
    contestLink: "/notice-contest/1",
    popupAlt: "",
    popupLink: "",
    popupUntil: "",
  };
  const ok = parseSettingsForm(form(base), "");
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.values.popupEnabled, false);

  const bad = parseSettingsForm(
    form({
      ...base,
      contestLink: "javascript:alert(1)",
      popupLink: "//evil.test",
      popupUntil: "2026-02-31",
      popupEnabled: "on",
    }),
    "",
  );
  assert.deepEqual(Object.keys(bad.errors).sort(), [
    "contestLink",
    "popupFile",
    "popupLink",
    "popupUntil",
  ]);

  // A kept or new image needs a description; removing it drops the requirement.
  assert.ok(parseSettingsForm(form(base), a).errors.popupAlt);
  assert.deepEqual(
    parseSettingsForm(form({ ...base, popupRemove: "on" }), a).errors,
    {},
  );
  const photo = new File(["x"], "p.png");
  const withFile = parseSettingsForm(form({ ...base, popupFile: photo }), "");
  assert.ok(withFile.errors.popupAlt);
  assert.equal(withFile.popupFile, photo);
  assert.deepEqual(
    parseSettingsForm(form({ ...base, popupUntil: "2026-12-31" }), "").errors,
    {},
  );

  // A pasted address of this site becomes a site path; other sites stay as typed.
  const siteUrl = process.env.SITE_URL;
  process.env.SITE_URL = "https://kcca-society.kr";
  const pasted = parseSettingsForm(
    form({
      ...base,
      contestLink: "https://www.kcca-society.kr/notice-contest/1?x=1",
      popupLink: "https://example.com/kcca-society.kr",
    }),
    "",
  );
  if (siteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = siteUrl;
  assert.equal(pasted.values.contestLink, "/notice-contest/1?x=1");
  assert.equal(pasted.values.popupLink, "https://example.com/kcca-society.kr");
});

test("oversized uploads are stopped before sending", () => {
  const big = new File([new Uint8Array(21 * 1024 * 1024)], "큰파일.pdf");
  assert.match(checkFileSizes(form({ attachments: big })) ?? "", /큰파일\.pdf/);
  const part = () => new File([new Uint8Array(15 * 1024 * 1024)], "a.pdf");
  assert.match(
    checkFileSizes(form({ attachments: [part(), part(), part()] })) ?? "",
    /40MB/,
  );
  assert.equal(checkFileSizes(form({ title: "x", attachments: part() })), null);
});

test("post form shows the cover picker only for gallery boards", () => {
  const noop = async () => ({});
  const upload = async () => ({ error: "" });
  const initial: PostFormValues = {
    board: "notice-gallery",
    category: "",
    title: "은상_김현희",
    body: `![작품](${a})\n![작품](${a})`,
    cover: b,
    attachments: [{ name: "요강.pdf", url: pdf, size: 2048 }],
    pinned: false,
    createdAt: "2026-08-31T09:30",
  };
  const render = (values: PostFormValues) =>
    renderToStaticMarkup(
      <PostForm
        action={noop}
        uploadImage={upload}
        initial={values}
        categories={{ "notice-gallery": ["2025 공모전"] }}
      />,
    );
  const gallery = render(initial);
  // Stored cover that is not in the body stays selectable and selected.
  const radio = (url: string) =>
    gallery.match(
      new RegExp(`<input type="radio"[^>]*value="${url}"[^>]*>`, "g"),
    ) ?? [];
  assert.match(radio(b)[0] ?? "", /checked=""/);
  // The first body image is the "auto" choice (shown with it), not a second radio.
  assert.equal(radio(a).length, 0);
  assert.equal(gallery.split(`<img src="${a}"`).length - 1, 1);
  assert.match(gallery, /name="removeAttachment" value="\/uploads\/16fd2706/);
  assert.match(gallery, /aria-pressed="false"[^>]*>2025 공모전</);
  const list = render({
    ...initial,
    board: "notice-association",
    cover: null,
    body: "",
  });
  assert.match(list, /type="hidden" name="cover" value="auto"/);
  assert.doesNotMatch(list, /coverFile/);
});

test("login form lets the browser fill the saved password", () => {
  const html = renderToStaticMarkup(
    <LoginForm action={async () => ({})} disabled expired />,
  );
  assert.match(
    html,
    /autoComplete="current-password"|autocomplete="current-password"/,
  );
  assert.match(html, /ADMIN_PASSWORD/);
  assert.match(html, /로그아웃되었습니다/);
  // A submit before hydration must not put the password in the URL.
  assert.match(html, /<form [^>]*method="post"/);
});

// Last tests: the first installs JSDOM globals for the rest of this file's process.
test("editing forms ask before a link throws away unsaved changes", async () => {
  // @ts-expect-error jsdom ships no type declarations
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "https://example.test/admin/pages/policy",
  });
  Object.assign(globalThis, {
    window: dom.window,
    self: dom.window, // next/link's prefetching
    document: dom.window.document,
    FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const { act } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const asked: string[] = [];
  dom.window.confirm = (message?: string) => (asked.push(message ?? ""), false);
  const container = document.createElement("div");
  const link = document.createElement("a");
  link.href = "/admin/posts";
  document.body.append(container, link);
  const root = createRoot(container);
  await act(() =>
    root.render(
      <PageForm
        action={async () => ({})}
        uploadImage={async () => ({ error: "" })}
        page={{ title: "이용약관", body: "본문" }}
      />,
    ),
  );
  const leave = () => {
    const event = new dom.window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    return event.defaultPrevented;
  };
  assert.equal(leave(), false); // nothing changed: no question
  (document.getElementById("title") as HTMLInputElement).value = "약관";
  assert.equal(leave(), true); // changed and the admin chose to stay
  assert.equal(asked.length, 1);
  await act(() => root.unmount());
});

test("after saving, focus moves to the invalid field or else the form message", async () => {
  const { act } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const submit = () =>
    act(async () => container.querySelector("form")!.requestSubmit());

  // Success (and expired-session) messages sit above a long form, often off screen.
  await act(() =>
    root.render(
      <PageForm
        action={async () => ({ message: "저장했습니다.", savedAt: 1 })}
        uploadImage={async () => ({ error: "" })}
        page={{ title: "이용약관", body: "본문" }}
      />,
    ),
  );
  await submit();
  assert.equal(document.activeElement?.textContent, "저장했습니다.");

  // A cover error focuses the cover file input, not the message.
  await act(() =>
    root.render(
      <PostForm
        action={async () => ({
          errors: { cover: "올릴 대표 사진을 골라 주세요." },
          error: "입력한 내용을 확인해 주세요.",
        })}
        uploadImage={async () => ({ error: "" })}
        initial={{
          board: "notice-gallery",
          category: "",
          title: "은상_김현희",
          body: "",
          cover: null,
          attachments: [],
          pinned: false,
          createdAt: "2026-08-31T09:30",
        }}
        categories={{}}
      />,
    ),
  );
  await submit();
  assert.equal(document.activeElement?.getAttribute("name"), "coverFile");
  await act(() => root.unmount());
});
