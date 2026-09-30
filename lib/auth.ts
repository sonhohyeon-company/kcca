import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { resetSessionSecret, sessionSecret } from "./db";
import {
  MIN_PASSWORD_LENGTH,
  clientIp,
  createLimiter,
  safeEqual,
  signSession,
  verifySession,
} from "./session";

const COOKIE = "kcca_admin";
const loginFailures = createLimiter(5, 15 * 60 * 1000);

/** The admin password, or null when it is missing or too short (admin login is then disabled). */
export function adminPassword() {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return password.length >= MIN_PASSWORD_LENGTH ? password : null;
}

export async function isAdmin() {
  const password = adminPassword();
  const token = (await cookies()).get(COOKIE)?.value;
  return (
    !!password && !!token && verifySession(sessionSecret(), password, token)
  );
}

/** Logout deletes the cookie, so one that isAdmin() rejects means the session ran out or was revoked. */
export async function hasSessionCookie() {
  return (await cookies()).has(COOKIE);
}

/** Call at the top of every admin page, Server Action and Route Handler. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function requestIp() {
  const h = await headers();
  return clientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}

type LoginResult = "ok" | "wrong" | "locked" | "disabled";

export async function login(input: string): Promise<LoginResult> {
  const password = adminPassword();
  if (!password) return "disabled";
  const ip = await requestIp();
  if (loginFailures.blocked(ip)) return "locked";
  if (!safeEqual(input, password)) {
    loginFailures.fail(ip);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return loginFailures.blocked(ip) ? "locked" : "wrong";
  }
  loginFailures.reset(ip);
  (await cookies()).set(COOKIE, signSession(sessionSecret(), password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Outlives the token (verifySession rejects it after SESSION_TTL_SECONDS), so the login
    // page can tell an expired session from a first visit.
    maxAge: 7 * 24 * 60 * 60,
  });
  return "ok";
}

/** Ends every admin session: tokens are stateless, so only a new secret revokes copies of the cookie. */
export async function logout() {
  if (await isAdmin()) resetSessionSecret(); // checked, so anonymous calls cannot log the admin out
  (await cookies()).delete(COOKIE);
}
