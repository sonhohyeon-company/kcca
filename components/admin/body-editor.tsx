"use client";

import { unstable_isUnrecognizedActionError } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { MAX_FILE_MB, expiredMessage } from "@/app/admin/validate";
import { renderBody, safeHref } from "@/lib/markup";

// Text edits return the new value and the range to select afterwards.
type Edit = { value: string; start: number; end: number };

/** Wraps the selection (or a placeholder) in markers such as **…**; the inner text stays selected. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string,
): Edit {
  const inner = value.slice(start, end) || placeholder;
  const at = start + before.length;
  return {
    value: value.slice(0, start) + before + inner + after + value.slice(end),
    start: at,
    end: at + inner.length,
  };
}

const lineMarker = /^(#{2,3}|[-*])\s+/;

/**
 * Puts a line marker ("## " or "- ") on every non-empty line the selection touches, replacing
 * another marker. If every line already has it, it is removed instead (toggle). On a blank
 * line it just inserts the marker so the admin can type after it.
 */
export function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
): Edit {
  const from = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  let to = value.indexOf("\n", Math.max(from, end > start ? end - 1 : end));
  if (to < 0) to = value.length;
  const lines = value.slice(from, to).split("\n");
  const filled = lines.filter((line) => line.trim());
  if (!filled.length) {
    const at = from + prefix.length;
    return {
      value: value.slice(0, from) + prefix + value.slice(from),
      start: at,
      end: at,
    };
  }
  const remove =
    filled.length > 0 && filled.every((line) => line.startsWith(prefix));
  const block = lines
    .map((line) =>
      !line.trim()
        ? line
        : remove
          ? line.slice(prefix.length)
          : prefix + line.replace(lineMarker, ""),
    )
    .join("\n");
  return {
    value: value.slice(0, from) + block + value.slice(to),
    start: from,
    end: from + block.length,
  };
}

/** Replaces the selection with a block on its own line (e.g. an image), cursor after it. */
export function insertBlock(
  value: string,
  start: number,
  end: number,
  block: string,
): Edit {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const text =
    (before && !before.endsWith("\n") ? "\n" : "") +
    block +
    (after.startsWith("\n") ? "" : "\n");
  const at = start + text.length;
  return { value: before + text + after, start: at, end: at };
}

export type UploadImage = (
  form: FormData,
) => Promise<{ url: string } | { error: string }>;

export const staleMessage =
  "사이트가 새 버전으로 바뀌었습니다. 쓰던 내용을 복사해 두고 페이지를 새로고침한 뒤 다시 시도해 주세요.";

/** Shown after expiredMessage: logging in in another tab keeps what was typed here. */
export function LoginLink() {
  return (
    <a href="/admin/login" target="_blank" rel="noopener noreferrer">
      새 탭에서 로그인하기<span className="sr-only"> (새 창)</span>
    </a>
  );
}

/** Short guide to the body syntax (lib/markup.tsx), shown on the dashboard and under the editor. */
export function BodySyntaxHelp() {
  return (
    <dl className="syntax-help">
      <dt>
        <code>## 소제목</code>
      </dt>
      <dd>
        줄 맨 앞에 ##과 빈칸을 쓰면 소제목이 됩니다. [소제목] 버튼을 눌러도
        됩니다.
      </dd>
      <dt>
        <code>- 항목</code>
      </dt>
      <dd>
        줄 맨 앞에 -와 빈칸을 쓰면 목록이 됩니다. 여러 줄을 고르고 [목록] 버튼을
        눌러도 됩니다.
      </dd>
      <dt>
        <code>**굵게**</code>
      </dt>
      <dd>글자를 별표 두 개로 감싸면 굵은 글씨가 됩니다.</dd>
      <dt>
        <code>[링크 글자](https://주소)</code>
      </dt>
      <dd>
        누르면 그 주소로 이동합니다. https://로 시작하는 주소만 써도 링크가
        됩니다.
      </dd>
      <dt>
        <code>![설명](/uploads/…)</code>
      </dt>
      <dd>
        [사진 넣기] 버튼으로 사진을 올리면 ![](/uploads/…) 한 줄이 들어갑니다.
        ![ ] 괄호 안에 사진 내용을 적어 두면 눈이 불편한 분께 읽어 드립니다.
      </dd>
      <dt>빈 줄</dt>
      <dd>문단을 나눕니다. 그냥 줄을 바꾸면 문단 안에서 줄만 바뀝니다.</dd>
    </dl>
  );
}

export function BodyEditor({
  value,
  onChange,
  uploadImage,
  hint,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  uploadImage: UploadImage;
  hint?: string;
  error?: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const selection = useRef<[number, number] | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState("");
  const [uploaded, setUploaded] = useState<string[]>([]);

  // Restore focus and selection after a toolbar edit re-renders the textarea.
  useLayoutEffect(() => {
    const range = selection.current;
    if (!range || !textarea.current) return;
    selection.current = null;
    textarea.current.focus();
    textarea.current.setSelectionRange(range[0], range[1]);
  }, [value]);

  const apply = (edit: (value: string, start: number, end: number) => Edit) => {
    const el = textarea.current;
    if (!el) return;
    const next = edit(el.value, el.selectionStart, el.selectionEnd);
    selection.current = [next.start, next.end];
    setProblem("");
    onChange(next.value);
  };

  const addLink = () => {
    const url = window.prompt(
      "연결할 주소를 입력해 주세요.\n예: https://www.youtube.com/… 또는 /notice-contest",
      "https://",
    );
    if (url === null) return;
    const href = url.trim();
    if (!safeHref(href) || href === "https://") {
      setProblem(
        "주소는 https:// 또는 /로 시작해야 합니다. 다시 눌러 입력해 주세요.",
      );
      return;
    }
    apply((v, s, e) => wrapSelection(v, s, e, "[", `](${href})`, "링크 글자"));
  };

  const upload = async (files: File[]) => {
    setBusy(true);
    setProblem("");
    const added: string[] = [];
    // Error message → file names, so one expired session is reported once, not per photo.
    const failed = new Map<string, string[]>();
    for (const [index, file] of files.entries()) {
      setStatus(
        files.length > 1
          ? `사진 ${files.length}장 중 ${index + 1}번째를 올리는 중입니다…`
          : "사진을 올리는 중입니다…",
      );
      const data = new FormData();
      data.append("file", file);
      // Checked before sending: a photo over the server's 45MB request limit would otherwise
      // be sent in full and then fail as if the connection had dropped.
      const result: { url: string } | { error: string } =
        file.size > MAX_FILE_MB * 1024 * 1024
          ? { error: `파일은 ${MAX_FILE_MB}MB까지 올릴 수 있습니다.` }
          : await uploadImage(data).catch((e: unknown) => ({
              error: unstable_isUnrecognizedActionError(e)
                ? staleMessage
                : "사진을 올리지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
            }));
      if ("error" in result) {
        failed.set(result.error, [
          ...(failed.get(result.error) ?? []),
          `‘${file.name}’`,
        ]);
        continue;
      }
      added.push(result.url);
      const url = result.url;
      apply((v, s, e) => insertBlock(v, s, e, `![](${url})`));
    }
    setUploaded((list) => [...list, ...added]);
    setProblem(
      [...failed]
        .map(([message, names]) => `${names.join(", ")}: ${message}`)
        .join(" "),
    );
    setStatus(
      added.length
        ? `사진 ${added.length}장을 넣었습니다. 사진 줄 맨 앞 ![ ] 괄호 안에 사진 내용을 적어 두면 좋습니다.`
        : "",
    );
    setBusy(false);
  };

  const describedBy =
    [hint && "body-hint", error && "body-error"].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="field editor">
      <label htmlFor="body">본문</label>
      {hint && (
        <p className="hint" id="body-hint">
          {hint}
        </p>
      )}
      <div className="editor-toolbar" role="group" aria-label="본문 꾸미기">
        <button
          type="button"
          disabled={preview}
          onClick={() => apply((v, s, e) => prefixLines(v, s, e, "## "))}
        >
          소제목
        </button>
        <button
          type="button"
          disabled={preview}
          onClick={() =>
            apply((v, s, e) =>
              wrapSelection(v, s, e, "**", "**", "굵게 쓸 글자"),
            )
          }
        >
          굵게
        </button>
        <button
          type="button"
          disabled={preview}
          onClick={() => apply((v, s, e) => prefixLines(v, s, e, "- "))}
        >
          목록
        </button>
        <button type="button" disabled={preview} onClick={addLink}>
          링크
        </button>
        <button
          type="button"
          disabled={preview || busy}
          onClick={() => fileInput.current?.click()}
        >
          {busy ? "올리는 중…" : "사진 넣기"}
        </button>
        <button
          type="button"
          aria-pressed={preview}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "미리보기 끄기" : "미리보기"}
        </button>
      </div>
      {/* Right under the toolbar, where the admin just pressed 사진 넣기 or 링크. */}
      <p role="status" className="hint">
        {status}
      </p>
      <div role="alert">
        {problem && (
          <p className="error">
            {problem}
            {problem.includes(expiredMessage) && (
              <>
                {" "}
                <LoginLink />
              </>
            )}
          </p>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.currentTarget.files ?? [])];
          event.currentTarget.value = "";
          if (files.length) void upload(files);
        }}
      />
      <textarea
        ref={textarea}
        id="body"
        name="body"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        hidden={preview}
        rows={18}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {preview && (
        <div className="editor-preview" aria-label="미리보기" role="region">
          {value.trim() ? (
            <div className="prose">{renderBody(value)}</div>
          ) : (
            <p className="hint">아직 쓴 내용이 없습니다.</p>
          )}
        </div>
      )}
      {uploaded.map((url) => (
        <input key={url} type="hidden" name="uploaded" value={url} />
      ))}
      {error && (
        <p className="error" id="body-error">
          {error}
        </p>
      )}
      <details className="syntax-details">
        <summary>본문 쓰는 법 보기</summary>
        <BodySyntaxHelp />
      </details>
    </div>
  );
}
