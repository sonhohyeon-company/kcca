// Pure rules for the 시험 접수 신청서, shared by the form, its Server Action, the admin and tests.

export const NAME_MAX = 50;
export const MESSAGE_MAX = 2000;

export type ApplicationValues = {
  name: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
};

export type ApplicationErrors = Partial<
  Record<keyof ApplicationValues | "file", string>
>;

export type ApplicationState = {
  status: "idle" | "error" | "success";
  /** Summary shown above the form. */
  message?: string;
  errors?: ApplicationErrors;
  /** Submitted values, so the form keeps them after an error. */
  values?: ApplicationValues;
};

/** Applications older than this (365 days, as stated in the consent text) are deleted. */
export const retentionCutoff = (now = Date.now()) =>
  new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

// The browser's type="email" rule (WHATWG), plus a dot in the domain.
export const emailPattern =
  /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i;

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export function readApplication(formData: FormData): ApplicationValues {
  return {
    name: text(formData, "name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    // Browsers submit textarea line breaks as CRLF but count them as one character for maxLength.
    message: text(formData, "message").replace(/\r\n/g, "\n"),
    consent: formData.get("consent") !== null,
  };
}

/** Field errors in form order; empty when the values can be stored. */
export function validateApplication(
  values: ApplicationValues,
): ApplicationErrors {
  const errors: ApplicationErrors = {};
  if (!values.name) errors.name = "이름을 입력해 주세요.";
  else if (values.name.length > NAME_MAX)
    errors.name = `이름은 ${NAME_MAX}자까지 입력할 수 있습니다.`;

  const digits = values.phone.replace(/[\s-]/g, "");
  if (!values.phone) errors.phone = "연락처를 입력해 주세요.";
  else if (
    !/^[\d\s-]+$/.test(values.phone) ||
    digits.length < 9 ||
    digits.length > 13
  )
    errors.phone = "연락처를 숫자로 정확히 입력해 주세요. 예: 010-1234-5678";

  if (
    values.email &&
    (values.email.length > 254 || !emailPattern.test(values.email))
  )
    errors.email = "이메일 주소를 확인해 주세요. 예: name@example.com";

  if (values.message.length > MESSAGE_MAX)
    errors.message = `신청 내용은 ${MESSAGE_MAX.toLocaleString("ko-KR")}자까지 입력할 수 있습니다. (지금 ${values.message.length.toLocaleString("ko-KR")}자)`;

  if (!values.consent)
    errors.consent =
      "개인정보 수집·이용에 동의해 주셔야 신청서를 보낼 수 있습니다.";
  return errors;
}
