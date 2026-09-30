"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  NAME_MAX,
  readProfile,
  type ProfileErrors,
  type ProfileState,
  type ProfileValues,
} from "@/lib/profile";
import { site } from "@/lib/site";

type Key = keyof ProfileErrors;
const order: Key[] = ["name", "phone", "email", "terms", "privacy"];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "잠시만 기다려 주세요…" : label}
    </button>
  );
}

/** The signup form (with consents; the action redirects) and the mypage form (saves in place). */
export function ProfileForm({
  action,
  values: initial,
  signup = false,
}: {
  action: (prev: ProfileState, formData: FormData) => Promise<ProfileState>;
  values: ProfileValues;
  signup?: boolean;
}) {
  const [state, formAction] = useActionState(
    async (prev: ProfileState, formData: FormData): Promise<ProfileState> => {
      try {
        return await action(prev, formData);
      } catch {
        // A tab opened before a site update or a dropped connection.
        return {
          status: "error",
          values: readProfile(formData),
          message: `저장하지 못했습니다. 페이지를 새로 고친 뒤 다시 시도해 주시거나 협회(${site.phone})로 전화해 주세요.`,
        };
      }
    },
    { status: "idle" },
  );
  const noteRef = useRef<HTMLDivElement>(null);

  // The result box is above the fields; move focus there so it is read out and seen.
  useEffect(() => {
    if (state.status !== "idle") noteRef.current?.focus();
  }, [state]);

  const values = state.values ?? initial;
  const errors = state.errors ?? {};
  const listed = order.filter((key) => errors[key]);
  const a11y = (key: Key, hint = false) => ({
    id: `profile-${key}`,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby":
      [hint && `profile-${key}-hint`, errors[key] && `profile-${key}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
  });
  const error = (key: Key) =>
    errors[key] && (
      <p className="error" id={`profile-${key}-error`}>
        {errors[key]}
      </p>
    );

  return (
    <form action={formAction} noValidate className="member-form">
      {state.status !== "idle" && (
        <div
          className="member-summary"
          role={state.status === "error" ? "alert" : "status"}
          tabIndex={-1}
          ref={noteRef}
        >
          <p>
            <strong>{state.message}</strong>
          </p>
          {listed.length > 0 && (
            <ul>
              {listed.map((key) => (
                <li key={key}>
                  <a href={`#profile-${key}`}>{errors[key]}</a>
                </li>
              ))}
            </ul>
          )}
          {state.expired && (
            <p>
              <Link href="/login">다시 로그인하기</Link>
            </p>
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor="profile-name">이름 (필수)</label>
        <input
          {...a11y("name")}
          name="name"
          required
          maxLength={NAME_MAX}
          autoComplete="name"
          defaultValue={values.name}
        />
        {error("name")}
      </div>

      <div className="field">
        <label htmlFor="profile-phone">휴대폰 번호 (필수)</label>
        <p className="hint" id="profile-phone-hint">
          협회에서 연락드릴 때 씁니다. 예: 010-1234-5678
        </p>
        <input
          {...a11y("phone", true)}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          maxLength={20}
          defaultValue={values.phone}
        />
        {error("phone")}
      </div>

      <div className="field">
        <label htmlFor="profile-email">이메일 (필수)</label>
        <input
          {...a11y("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={values.email}
        />
        {error("email")}
      </div>

      {signup && (
        <fieldset className="field member-consent">
          <legend>약관 동의 (필수)</legend>
          <dl className="member-terms">
            <div>
              <dt>수집 항목</dt>
              <dd>
                이름, 휴대폰 번호, 이메일, 로그인에 쓴
                서비스(카카오·네이버·Google)와 그 서비스의 회원 번호
              </dd>
            </div>
            <div>
              <dt>목적</dt>
              <dd>회원 확인, 시험 접수와 협회 행사 안내 연락</dd>
            </div>
            <div>
              <dt>보유 기간</dt>
              <dd>회원 탈퇴 시까지 (탈퇴하면 바로 삭제)</dd>
            </div>
          </dl>
          <p className="hint">
            수집한 개인정보는 제3자에게 제공하지 않습니다. 자세한 내용은{" "}
            <Link href="/policy" target="_blank">
              이용약관<span className="sr-only"> (새 창)</span>
            </Link>
            과{" "}
            <Link href="/privacy" target="_blank">
              개인정보처리방침<span className="sr-only"> (새 창)</span>
            </Link>
            에서 보실 수 있습니다.
          </p>
          <label className="check">
            <input
              {...a11y("terms")}
              name="terms"
              type="checkbox"
              required
              defaultChecked={values.terms}
            />
            이용약관에 동의합니다.
          </label>
          {error("terms")}
          <label className="check">
            <input
              {...a11y("privacy")}
              name="privacy"
              type="checkbox"
              required
              defaultChecked={values.privacy}
            />
            개인정보 수집·이용에 동의합니다.
          </label>
          {error("privacy")}
        </fieldset>
      )}

      <div className="form-actions">
        <SubmitButton label={signup ? "가입 완료" : "저장"} />
      </div>
    </form>
  );
}
