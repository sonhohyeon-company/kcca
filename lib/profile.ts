// Pure member-profile rules shared by the login routes, the signup/mypage forms, the admin and tests.
import { emailPattern } from "@/app/(site)/application-form/validate";

export const PROVIDERS = {
  kakao: "카카오",
  naver: "네이버",
  google: "Google",
} as const;
export type Provider = keyof typeof PROVIDERS;
export const isProvider = (value: unknown): value is Provider =>
  typeof value === "string" && Object.hasOwn(PROVIDERS, value);

/** What a provider tells us about the person who just logged in. */
export type Profile = {
  provider: Provider;
  providerId: string;
  email: string;
  name: string;
  /** Digits only, or "" when the provider gave none. */
  phone: string;
};

export type ProfileValues = {
  name: string;
  phone: string;
  email: string;
  /** Signup only: the two required consents. */
  terms?: boolean;
  privacy?: boolean;
};
export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

export type ProfileState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: ProfileErrors;
  values?: ProfileValues;
  /** The login or signup cookie ran out: the form shows a login link instead of retrying. */
  expired?: boolean;
};

export const NAME_MAX = 50;

/** A Korean mobile number as digits ("+82 10-1234-5678" → "01012345678"), or "" when it is not one. */
export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("82")) digits = `0${digits.slice(2)}`;
  return /^01[016789]\d{7,8}$/.test(digits) ? digits : "";
}

/** "01012345678" → "010-1234-5678" (other lengths are left as they are). */
export const formatPhone = (digits: string) =>
  digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");

/** Same-site path to return to after login; anything else falls back to "/". */
export function safeNext(value: unknown) {
  return typeof value === "string" &&
    value.length <= 500 &&
    /^\/(?![/\\])[^\s]*$/.test(value)
    ? value
    : "/";
}

const str = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";
const obj = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

/** Normalizes a provider's profile response (kapi /v2/user/me, nid/me, OpenID userinfo). */
export function profileFromProvider(
  provider: Provider,
  data: Record<string, unknown>,
): Profile {
  if (provider === "kakao") {
    const account = obj(data.kakao_account);
    return {
      provider,
      providerId: str(data.id),
      email: str(account.email),
      // name needs a Kakao business app; the nickname is a fallback the member can correct.
      name: str(account.name) || str(obj(account.profile).nickname),
      phone: normalizePhone(str(account.phone_number)),
    };
  }
  if (provider === "naver") {
    const response = obj(data.response);
    return {
      provider,
      providerId: str(response.id),
      email: str(response.email),
      name: str(response.name) || str(response.nickname),
      phone: normalizePhone(str(response.mobile)),
    };
  }
  return {
    provider,
    providerId: str(data.sub),
    email: str(data.email),
    name: str(data.name),
    phone: "",
  };
}

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export function readProfile(formData: FormData): ProfileValues {
  return {
    name: text(formData, "name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    terms: formData.get("terms") !== null,
    privacy: formData.get("privacy") !== null,
  };
}

/** Field errors in form order; `signup` also requires both consents. */
export function validateProfile(values: ProfileValues, signup = false) {
  const errors: ProfileErrors = {};
  if (!values.name) errors.name = "이름을 입력해 주세요.";
  else if (values.name.length > NAME_MAX)
    errors.name = `이름은 ${NAME_MAX}자까지 입력할 수 있습니다.`;

  if (!values.phone) errors.phone = "휴대폰 번호를 입력해 주세요.";
  else if (!normalizePhone(values.phone))
    errors.phone = "휴대폰 번호를 확인해 주세요. 예: 010-1234-5678";

  if (!values.email) errors.email = "이메일 주소를 입력해 주세요.";
  else if (values.email.length > 254 || !emailPattern.test(values.email))
    errors.email = "이메일 주소를 확인해 주세요. 예: name@example.com";

  if (signup) {
    if (!values.terms) errors.terms = "이용약관에 동의해 주세요.";
    if (!values.privacy)
      errors.privacy = "개인정보 수집·이용에 동의해 주셔야 가입할 수 있습니다.";
  }
  return errors;
}
