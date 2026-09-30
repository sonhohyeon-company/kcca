"use client";

import {
  unstable_isUnrecognizedActionError,
  unstable_rethrow,
} from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  checkFileSizes,
  expiredMessage,
  type FormState,
} from "@/app/admin/validate";
import type { Settings } from "@/lib/db";
import { kstToday } from "@/lib/format";
import {
  BodyEditor,
  LoginLink,
  staleMessage,
  type UploadImage,
} from "./body-editor";

export type FormAction = (
  state: FormState,
  form: FormData,
) => Promise<FormState>;

const leaveMessage = "저장하지 않은 내용이 있습니다. 이 화면을 떠날까요?";

/** The form's values as text, to tell whether anything changed since it was loaded or saved. */
const snapshot = (form: HTMLFormElement | null) =>
  form
    ? JSON.stringify(
        [...new FormData(form)].map(([name, value]) =>
          typeof value === "string"
            ? [name, value]
            : [name, value.name, value.size],
        ),
      )
    : "";

/**
 * useActionState without React's automatic form reset, so a failed save keeps everything the
 * admin typed. Also checks file sizes first, turns failures (including a stale-deploy "Failed to
 * find Server Action") into a message, focuses the first invalid field (or else the form message,
 * which may be off screen above a long form) and, with warnOnLeave, asks before a link or
 * closing the tab throws away unsaved changes.
 */
export function useFormAction(action: FormAction, warnOnLeave = true) {
  const form = useRef<HTMLFormElement>(null);
  const saved = useRef("");
  const [state, dispatch, pending] = useActionState<FormState, FormData>(
    async (previous, data) => {
      // savedAt keys the settings/page forms: only a new save may remount them.
      const keep = { savedAt: previous.savedAt };
      const sizeError = checkFileSizes(data);
      if (sizeError) return { ...keep, error: sizeError };
      try {
        return { ...keep, ...(await action(previous, data)) };
      } catch (error) {
        unstable_rethrow(error); // redirects are Next's to handle
        // Anything else (network, server error) keeps the form and what was typed.
        return {
          ...keep,
          error: unstable_isUnrecognizedActionError(error)
            ? staleMessage
            : "보내지 못했습니다. 인터넷 연결을 확인한 뒤 다시 눌러 주세요. 계속 안 되면 쓰던 내용을 복사해 두고 새로고침해 주세요.",
        };
      }
    },
    {},
  );

  useEffect(() => {
    (
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      document.getElementById("form-message")
    )?.focus();
  }, [state]);

  useEffect(() => {
    saved.current = snapshot(form.current);
  }, [state.savedAt]);

  useEffect(() => {
    if (!warnOnLeave) return;
    const changed = () => snapshot(form.current) !== saved.current;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (changed()) event.preventDefault();
    };
    // Capture phase, so a cancel stops next/link's client-side navigation too.
    // ponytail: the browser back button (client-side history) is not asked about.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (
        !link ||
        link.getAttribute("target") === "_blank" ||
        link.getAttribute("href")?.startsWith("#") ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      if (changed() && !window.confirm(leaveMessage)) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [warnOnLeave]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, pending, onSubmit, form };
}

/** Form-level result: errors in an alert region, success in a status region. */
export function FormMessage({ state }: { state: FormState }) {
  return (
    <>
      <div role="alert">
        {state.error && (
          <p className="flash error" id="form-message" tabIndex={-1}>
            {state.error}
            {state.error === expiredMessage && (
              <>
                {" "}
                <LoginLink />
              </>
            )}
          </p>
        )}
      </div>
      <div role="status">
        {state.message && (
          <p className="flash" id="form-message" tabIndex={-1}>
            {state.message}
          </p>
        )}
      </div>
    </>
  );
}

/** aria props for an input plus its error paragraph. */
export function fieldError(state: FormState, name: string, hint = false) {
  const error = state.errors?.[name];
  const ids = [hint && `${name}-hint`, error && `${name}-error`]
    .filter(Boolean)
    .join(" ");
  return {
    input: {
      "aria-invalid": error ? true : undefined,
      "aria-describedby": ids || undefined,
    },
    message: error ? (
      <p className="error" id={`${name}-error`}>
        {error}
      </p>
    ) : null,
  };
}

export function LoginForm({
  action,
  disabled,
  expired,
}: {
  action: FormAction;
  disabled: boolean;
  /** A session cookie was still there, so the admin was logged out rather than never logged in. */
  expired: boolean;
}) {
  const { state, pending, onSubmit, form } = useFormAction(action, false);
  return (
    // method="post": a tap before the page's script loads must not put the password in the URL.
    <form ref={form} method="post" className="login" onSubmit={onSubmit}>
      <h1>관리자 로그인</h1>
      <p className="hint">한국청목캘리그라피예술협회 누리집 관리 화면입니다.</p>
      {disabled && !state.error && (
        <p className="flash error">
          ADMIN_PASSWORD 환경 변수를 12자 이상으로 설정해야 관리자 로그인을 쓸
          수 있습니다.
        </p>
      )}
      {expired && !state.error && (
        <p className="flash">
          로그인 시간이 지나 로그아웃되었습니다. 다시 로그인해 주세요.
        </p>
      )}
      {/* Lets the browser's password manager remember the password. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        defaultValue="관리자"
        hidden
        readOnly
      />
      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      <div role="alert" id="login-error">
        {state.error && <p className="flash error">{state.error}</p>}
      </div>
      <button className="btn" disabled={pending}>
        {pending ? "확인하는 중…" : "로그인"}
      </button>
    </form>
  );
}

export function PageForm({
  action,
  uploadImage,
  page,
  hint,
}: {
  action: FormAction;
  uploadImage: UploadImage;
  page: { title: string; body: string };
  hint?: string;
}) {
  const { state, pending, onSubmit, form } = useFormAction(action);
  const [body, setBody] = useState(page.body);
  const title = fieldError(state, "title");
  return (
    <>
      <FormMessage state={state} />
      {/* Remounts after a save so the editor starts a fresh upload list. */}
      <form
        ref={form}
        key={state.savedAt}
        method="post"
        className="form-grid"
        onSubmit={onSubmit}
      >
        <div className="field">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            name="title"
            defaultValue={page.title}
            required
            maxLength={100}
            {...title.input}
          />
          {title.message}
        </div>
        <BodyEditor
          value={body}
          onChange={setBody}
          uploadImage={uploadImage}
          hint={hint}
          error={state.errors?.body}
        />
        <div className="form-actions">
          <button className="btn" disabled={pending}>
            {pending ? "저장하는 중…" : "저장"}
          </button>
        </div>
      </form>
    </>
  );
}

export function SettingsForm({
  action,
  settings,
}: {
  action: FormAction;
  settings: Settings;
}) {
  const { state, pending, onSubmit, form } = useFormAction(action);
  const f = (name: string, hint = false) => fieldError(state, name, hint);
  const text = (
    name: keyof Settings,
    label: string,
    hint?: string,
    maxLength = 100,
  ) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {hint && (
        <p className="hint" id={`${name}-hint`}>
          {hint}
        </p>
      )}
      <input
        id={name}
        name={name}
        defaultValue={String(settings[name])}
        maxLength={maxLength}
        {...f(name, !!hint).input}
      />
      {f(name).message}
    </div>
  );

  return (
    <>
      <FormMessage state={state} />
      {/* Remounts after a save so every field (and the file input) shows the saved values. */}
      <form
        ref={form}
        key={state.savedAt}
        method="post"
        className="form-grid"
        onSubmit={onSubmit}
      >
        <fieldset>
          <legend>공모전 안내 (첫 화면)</legend>
          {text(
            "contestStatus",
            "상태 표시",
            "짧게 적어 주세요. 예: 작품 접수 중, 작품 접수 예정, 접수 마감",
            30,
          )}
          {text("contestTitle", "공모전 이름")}
          {text(
            "contestPeriod",
            "접수 기간",
            "예: 2026. 10. 1(목) ~ 11. 10(화)",
          )}
          <div className="field">
            <label htmlFor="contestNote">안내 문구</label>
            <textarea
              id="contestNote"
              name="contestNote"
              rows={3}
              maxLength={300}
              defaultValue={settings.contestNote}
              {...f("contestNote").input}
            />
            {f("contestNote").message}
          </div>
          {text(
            "contestLink",
            "자세히 보기 링크",
            "사이트에서 공모요강 글을 열고 주소창의 주소를 복사해 붙여 넣어 주세요. 예: https://kcca-society.kr/notice-contest/173353860",
            500,
          )}
        </fieldset>

        <fieldset>
          <legend>메인 팝업</legend>
          <label className="check">
            <input
              type="checkbox"
              name="popupEnabled"
              defaultChecked={settings.popupEnabled}
            />
            <span>첫 화면에 팝업을 보입니다</span>
          </label>
          {settings.popupImage ? (
            <div className="popup-current">
              <p className="hint">지금 팝업 사진</p>
              <img
                src={settings.popupImage}
                alt={settings.popupAlt}
                className="popup-preview"
              />
              <label className="check">
                <input type="checkbox" name="popupRemove" />
                <span>이 사진 지우기</span>
              </label>
            </div>
          ) : (
            <p className="hint">아직 팝업 사진이 없습니다.</p>
          )}
          <div className="field">
            <label htmlFor="popupFile">
              {settings.popupImage
                ? "다른 사진으로 바꾸기"
                : "팝업 사진 올리기"}
            </label>
            <input
              id="popupFile"
              name="popupFile"
              type="file"
              accept="image/*"
              onChange={(event) => {
                // A new picture needs its own description: clear the old one unless already edited.
                const alt =
                  event.currentTarget.form?.elements.namedItem("popupAlt");
                if (
                  event.currentTarget.files?.length &&
                  alt instanceof HTMLTextAreaElement &&
                  alt.value === alt.defaultValue
                )
                  alt.value = "";
              }}
              {...f("popupFile").input}
            />
            {f("popupFile").message}
          </div>
          <div className="field">
            <label htmlFor="popupAlt">사진 설명</label>
            <p className="hint" id="popupAlt-hint">
              사진에 적힌 글자와 내용을 그대로 적어 주세요. 눈이 불편한 분께 이
              설명을 읽어 드립니다.
            </p>
            <textarea
              id="popupAlt"
              name="popupAlt"
              rows={3}
              maxLength={500}
              defaultValue={settings.popupAlt}
              {...f("popupAlt", true).input}
            />
            {f("popupAlt").message}
          </div>
          {text(
            "popupLink",
            "누르면 이동할 주소 (선택)",
            "비워 두면 사진만 보입니다. 이동할 글을 사이트에서 열고 주소창의 주소를 복사해 붙여 넣어 주세요.",
            500,
          )}
          <div className="field">
            <label htmlFor="popupUntil">마지막으로 보일 날 (선택)</label>
            <p className="hint" id="popupUntil-hint">
              이 날까지 보이고 다음 날부터 자동으로 사라집니다. 비워 두면 끌
              때까지 계속 보입니다.
              {settings.popupEnabled &&
                settings.popupUntil &&
                settings.popupUntil < kstToday() && (
                  <strong>
                    {" "}
                    마지막으로 보일 날이 지나 지금은 첫 화면에 팝업이 보이지
                    않습니다.
                  </strong>
                )}
            </p>
            <input
              id="popupUntil"
              name="popupUntil"
              type="date"
              defaultValue={settings.popupUntil}
              {...f("popupUntil", true).input}
            />
            {f("popupUntil").message}
          </div>
        </fieldset>

        <div className="form-actions">
          <button className="btn" disabled={pending}>
            {pending ? "저장하는 중…" : "저장"}
          </button>
        </div>
      </form>
    </>
  );
}
