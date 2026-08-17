import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Session handling for /admin/bewerbungen. No user-account system and no
 * registration path, per the brief — a single shared password
 * (ADMIN_PASSWORD) gates the page, and a signed, httpOnly cookie remembers
 * that the check already passed.
 *
 * The cookie is intentionally not encrypted, only signed: it carries no
 * data worth hiding (just an expiry timestamp), so the only property that
 * matters is that it can't be forged or extended.
 *
 * The signing key is a dedicated ADMIN_SESSION_SECRET, not ADMIN_PASSWORD
 * itself. Signing with the password would mean every issued cookie is a
 * plaintext/HMAC pair for that exact password — anyone holding a valid
 * cookie (a shared board laptop, a browser profile backup, malware) could
 * brute-force ADMIN_PASSWORD offline, at GPU speed, since HMAC-SHA256 is
 * fast by design and offers no resistance to that on its own. A separate
 * secret means a leaked cookie reveals nothing about the password at all.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// Constant-time regardless of input length: a length mismatch returns early
// (leaking only "wrong length", never useful against a fixed-length secret),
// everything else runs through timingSafeEqual — same pattern as
// api/cron/cleanup's isAuthorized.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyPassword(candidate: string): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  return safeEqual(candidate, secret);
}

export function createSessionCookieValue(now: Date = new Date()): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const expiresAt = now.getTime() + ADMIN_SESSION_TTL_MS;
  return `${expiresAt}.${sign(String(expiresAt), secret)}`;
}

export function verifySessionCookieValue(value: string | undefined | null, now: Date = new Date()): boolean {
  if (!value) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const separatorIndex = value.indexOf(".");
  if (separatorIndex < 0) return false;
  const expiresAtRaw = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < now.getTime()) return false;

  return safeEqual(signature, sign(expiresAtRaw, secret));
}
