import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMember, memberSecret } from "./db";
import type { Profile, Provider } from "./profile";
import { safeEqual, signToken, verifyToken } from "./session";

// Member cookies. All are signed with memberSecret() and carry their own expiry.
const SESSION = "kcca_member"; // logged-in member
const STATE = "kcca_oauth"; // one login attempt: random state + where to go afterwards
const PENDING = "kcca_signup"; // a provider profile waiting for the signup form

const SESSION_TTL = 30 * 24 * 60 * 60;
const STATE_TTL = 10 * 60;
const PENDING_TTL = 20 * 60;

async function set(
  name: string,
  payload: Record<string, unknown>,
  ttl: number,
) {
  (await cookies()).set(name, signToken(memberSecret(), payload, ttl), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
}

async function read<T extends object>(name: string) {
  return verifyToken<T>(memberSecret(), (await cookies()).get(name)?.value);
}

async function clear(name: string) {
  (await cookies()).delete(name);
}

/** The logged-in member, or null. A deleted member's cookie no longer counts. */
export async function currentMember() {
  const token = await read<{ m: number }>(SESSION);
  return token && Number.isSafeInteger(token.m) ? getMember(token.m) : null;
}

/** For member-only pages: sends visitors to the login page and back to `next` afterwards. */
export async function requireMember(next: string) {
  const member = await currentMember();
  if (!member)
    redirect(`/login?notice=required&next=${encodeURIComponent(next)}`);
  return member;
}

export const startSession = (id: number) =>
  set(SESSION, { m: id }, SESSION_TTL);
export const endSession = () => clear(SESSION);

/** Starts a login attempt; the returned state goes into the provider's authorize URL. */
export async function beginLogin(provider: Provider, next: string) {
  const state = randomBytes(16).toString("hex");
  await set(STATE, { state, provider, next }, STATE_TTL);
  return state;
}

/** Checks the provider's callback against the attempt cookie; null when they do not match. */
export async function finishLogin(provider: Provider, state: string | null) {
  const attempt = await read<{
    state: string;
    provider: Provider;
    next: string;
  }>(STATE);
  await clear(STATE);
  return attempt &&
    attempt.provider === provider &&
    state &&
    safeEqual(attempt.state, state)
    ? { next: attempt.next }
    : null;
}

export const beginSignup = (profile: Profile, next: string) =>
  set(PENDING, { ...profile, next }, PENDING_TTL);
export const pendingSignup = () => read<Profile & { next: string }>(PENDING);
export const endSignup = () => clear(PENDING);
