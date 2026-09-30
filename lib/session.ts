// Pure token helpers (no Next imports) so tests can exercise them directly.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const MIN_PASSWORD_LENGTH = 12;

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time string comparison. */
export const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

// The password is part of the signed message, so changing ADMIN_PASSWORD logs everyone out.
const signature = (secret: string, password: string, expires: number) =>
  createHmac("sha256", secret).update(`${expires}:${password}`).digest("base64url");

export function signSession(secret: string, password: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  return `${expires}.${signature(secret, password, expires)}`;
}

export function verifySession(
  secret: string,
  password: string,
  token: string,
  now = Date.now(),
) {
  const [expiresText, sig, extra] = token.split(".");
  if (extra !== undefined || !/^\d{1,12}$/.test(expiresText ?? "") || !sig) return false;
  const expires = Number(expiresText);
  // Never longer than a fresh login (+1 min clock skew), even for a validly signed token.
  if (expires * 1000 <= now || expires * 1000 > now + (SESSION_TTL_SECONDS + 60) * 1000) return false;
  return safeEqual(sig, signature(secret, password, expires));
}

/**
 * Client address as seen by the reverse proxy in front of the app: the right-most
 * X-Forwarded-For entry (appended by nginx), not the left-most one a client can forge.
 * IPv6 addresses become their /64 prefix, since one client usually owns the whole /64.
 */
export function clientIp(forwardedFor: string | null, realIp: string | null) {
  const ip = forwardedFor?.split(",").at(-1)?.trim() || realIp?.trim() || "unknown";
  if (!ip.includes(":") || ip.includes(".")) return ip; // IPv4, also as ::ffff:1.2.3.4
  const [head, tail] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const zeros = tail === undefined ? [] : Array(Math.max(0, 8 - left.length - right.length)).fill("0");
  return `${[...left, ...zeros, ...right].slice(0, 4).join(":")}::/64`;
}

/** Fixed-window failure counter per key. */
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    blocked(key: string, now = Date.now()) {
      const hit = hits.get(key);
      return !!hit && hit.resetAt > now && hit.count >= max;
    },
    fail(key: string, now = Date.now()) {
      const hit = hits.get(key);
      if (!hit || hit.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
      else hit.count += 1;
      // ponytail: in-memory and single-process; move to SQLite if the app ever runs as several instances.
      // Over 10,000 keys: drop expired entries, then the oldest ones, so memory stays bounded.
      if (hits.size > 10_000)
        for (const [k, v] of hits) if (v.resetAt <= now || hits.size > 10_000) hits.delete(k);
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
