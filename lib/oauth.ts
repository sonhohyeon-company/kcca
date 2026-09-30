import "server-only";
import { PROVIDERS, profileFromProvider, type Provider } from "./profile";
import { siteUrl } from "./site";

// OAuth 2.0 authorization-code flow, written by hand: three providers, one shape.
const endpoints = {
  kakao: {
    authorize: "https://kauth.kakao.com/oauth/authorize",
    token: "https://kauth.kakao.com/oauth/token",
    profile: "https://kapi.kakao.com/v2/user/me",
    scope: "", // consent items are chosen in the Kakao developer console
  },
  naver: {
    authorize: "https://nid.naver.com/oauth2.0/authorize",
    token: "https://nid.naver.com/oauth2.0/token",
    profile: "https://openapi.naver.com/v1/nid/me",
    scope: "",
  },
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    profile: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
  },
} as const;

// KAKAO_CLIENT_ID, NAVER_CLIENT_SECRET, … read per request like the other env vars.
const env = (provider: Provider, key: "ID" | "SECRET") =>
  process.env[`${provider.toUpperCase()}_CLIENT_${key}`] ?? "";

/** Providers whose app keys are set; the login page shows only these. Kakao's secret is optional. */
export const enabledProviders = () =>
  (Object.keys(PROVIDERS) as Provider[]).filter(
    (provider) =>
      env(provider, "ID") && (provider === "kakao" || env(provider, "SECRET")),
  );

/** Must match the redirect URI registered in each developer console. */
export const redirectUri = (provider: Provider) =>
  `${siteUrl().replace(/\/+$/, "")}/auth/${provider}/callback`;

export function authorizeUrl(provider: Provider, state: string) {
  const url = new URL(endpoints[provider].authorize);
  url.search = new URLSearchParams({
    client_id: env(provider, "ID"),
    redirect_uri: redirectUri(provider),
    response_type: "code",
    state,
    ...(endpoints[provider].scope ? { scope: endpoints[provider].scope } : {}),
  }).toString();
  return url.toString();
}

async function call(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok)
    throw new Error(
      `${url} → ${response.status} ${String(data.error ?? data.message ?? "")}`,
    );
  return data;
}

/** Trades the callback's code for the member's profile; throws on any provider error. */
export async function fetchProfile(
  provider: Provider,
  code: string,
  state: string,
) {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env(provider, "ID"),
    redirect_uri: redirectUri(provider),
    code,
  });
  if (env(provider, "SECRET"))
    form.set("client_secret", env(provider, "SECRET"));
  if (provider === "naver") form.set("state", state); // Naver checks it again here
  const token = await call(endpoints[provider].token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: form,
  });
  if (typeof token.access_token !== "string")
    throw new Error(`${provider}: no access token`);
  const profile = profileFromProvider(
    provider,
    await call(endpoints[provider].profile, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }),
  );
  if (!profile.providerId) throw new Error(`${provider}: profile without id`);
  return profile;
}
