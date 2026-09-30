"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { site } from "@/lib/site";
import { submitApplication } from "./actions";
import {
  MESSAGE_MAX,
  NAME_MAX,
  readApplication,
  type ApplicationErrors,
  type ApplicationState,
  type ApplicationValues,
} from "./validate";

type Key = keyof ApplicationErrors;
const order: Key[] = ["name", "phone", "email", "message", "file", "consent"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "보내는 중…" : "신청서 보내기"}
    </button>
  );
}

/** `accept` and `maxBytes` come from lib/uploads (server-only) via the page; `defaults` from the member. */
export function ApplicationForm({
  accept,
  maxBytes,
  defaults,
}: {
  accept: string;
  maxBytes: number;
  defaults: Pick<ApplicationValues, "name" | "phone" | "email"> | null;
}) {
  const [state, formAction] = useActionState(
    async (
      prev: ApplicationState,
      formData: FormData,
    ): Promise<ApplicationState> => {
      try {
        return await submitApplication(prev, formData);
      } catch {
        // A tab opened before a site update, a dropped connection or an oversized request.
        return {
          status: "error",
          values: readApplication(formData),
          message: `신청서를 보내지 못했습니다. 페이지를 새로 고친 뒤 다시 보내 주시거나 협회(${site.phone})로 전화해 주세요.`,
        };
      }
    },
    { status: "idle" },
  );
  const [fileError, setFileError] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Move focus to the result: the form disappears on success, and the submit button was disabled.
  useEffect(() => {
    if (state.status === "success") doneRef.current?.focus();
    if (state.status === "error") summaryRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="apply-done" role="status" tabIndex={-1} ref={doneRef}>
        <p>
          <strong>신청서가 접수되었습니다. 협회에서 연락드리겠습니다.</strong>
        </p>
        <p>
          문의 전화: <a href={site.tel}>{site.phone}</a>
        </p>
      </div>
    );
  }

  const errors: ApplicationErrors = {
    ...state.errors,
    ...(fileError ? { file: fileError } : {}),
  };
  const listed = order.filter((key) => errors[key]);
  const values: Partial<ApplicationValues> | null = state.values ?? defaults;
  const a11y = (key: Key, hint = false) => ({
    id: `apply-${key}`,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby":
      [hint && `apply-${key}-hint`, errors[key] && `apply-${key}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
  });
  const error = (key: Key) =>
    errors[key] && (
      <p
        className="error"
        id={`apply-${key}-error`}
        // The oversized-file check runs in the browser, outside the summary.
        role={key === "file" && fileError ? "alert" : undefined}
      >
        {errors[key]}
      </p>
    );

  return (
    <form action={formAction} noValidate className="apply-form">
      {state.status === "error" && (
        <div
          className="apply-summary"
          role="alert"
          tabIndex={-1}
          ref={summaryRef}
        >
          <p>
            <strong>{state.message}</strong>
          </p>
          {listed.length > 0 && (
            <ul>
              {listed.map((key) => (
                <li key={key}>
                  <a href={`#apply-${key}`}>{errors[key]}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor="apply-name">이름 (필수)</label>
        <input
          {...a11y("name")}
          name="name"
          required
          maxLength={NAME_MAX}
          autoComplete="name"
          defaultValue={values?.name}
        />
        {error("name")}
      </div>

      <div className="field">
        <label htmlFor="apply-phone">연락처 (필수)</label>
        <p className="hint" id="apply-phone-hint">
          연락받으실 전화번호를 적어 주세요. 예: 010-1234-5678
        </p>
        <input
          {...a11y("phone", true)}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          maxLength={20}
          defaultValue={values?.phone}
        />
        {error("phone")}
      </div>

      <div className="field">
        <label htmlFor="apply-email">이메일 (선택)</label>
        <input
          {...a11y("email")}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          defaultValue={values?.email}
        />
        {error("email")}
      </div>

      <div className="field">
        <label htmlFor="apply-message">신청 내용 (선택)</label>
        <p className="hint" id="apply-message-hint">
          응시하실 자격증 종류와 급수, 희망하시는 시험 일정, 교육받으신
          기관(지부) 등을 적어 주세요.
          {` ${MESSAGE_MAX.toLocaleString("ko-KR")}자까지 쓸 수 있습니다.`}
        </p>
        <textarea
          {...a11y("message", true)}
          name="message"
          rows={8}
          maxLength={MESSAGE_MAX}
          defaultValue={values?.message}
        />
        {error("message")}
      </div>

      <div className="field">
        <label htmlFor="apply-file">첨부파일 (선택)</label>
        <p className="hint" id="apply-file-hint">
          응시원서 등 파일 1개를 20MB까지 올릴 수 있습니다. (PDF, 한글,
          워드·엑셀·파워포인트, ZIP, 사진)
          {state.status === "error" &&
            " 파일을 첨부하셨다면 다시 선택해 주세요."}
        </p>
        <input
          {...a11y("file", true)}
          name="file"
          type="file"
          accept={accept}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file && file.size > maxBytes) {
              event.currentTarget.value = "";
              setFileError(
                "파일이 20MB보다 큽니다. 더 작은 파일을 선택해 주세요.",
              );
            } else setFileError("");
          }}
        />
        {error("file")}
      </div>

      <fieldset className="field apply-consent">
        <legend>개인정보 수집·이용 동의 (필수)</legend>
        <dl className="apply-terms">
          <div>
            <dt>수집 항목</dt>
            <dd>이름, 연락처(필수), 이메일, 신청 내용, 첨부파일(선택)</dd>
          </div>
          <div>
            <dt>목적</dt>
            <dd>자격검정 시험 접수 확인과 안내 연락</dd>
          </div>
          <div>
            <dt>보유 기간</dt>
            <dd>신청일로부터 1년 후 파기</dd>
          </div>
        </dl>
        <p className="hint">
          수집한 개인정보는 제3자에게 제공하지 않습니다. 동의하지 않으실 수
          있지만, 동의하지 않으시면 신청서를 보낼 수 없으니 협회({site.phone})로
          전화해 주세요. 자세한 내용은{" "}
          <Link href="/privacy" target="_blank">
            개인정보처리방침<span className="sr-only"> (새 창)</span>
          </Link>
          에서 보실 수 있습니다.
        </p>
        <label className="check">
          <input
            {...a11y("consent")}
            name="consent"
            type="checkbox"
            required
            defaultChecked={values?.consent}
          />
          개인정보 수집·이용에 동의합니다.
        </label>
        {error("consent")}
      </fieldset>

      {/* Honeypot for spam bots; hidden from people and assistive technology. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="apply-homepage">비워 두세요</label>
        <input
          id="apply-homepage"
          name="homepage"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
