import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_TTL_MS,
  createSessionCookieValue,
  verifyPassword,
  verifySessionCookieValue,
} from "@/lib/adminAuth";

const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

beforeEach(() => {
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
  process.env.ADMIN_SESSION_SECRET = "a-completely-different-signing-secret";
});

afterEach(() => {
  process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD;
  process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

describe("verifyPassword", () => {
  it("accepts the configured password", () => {
    expect(verifyPassword("correct horse battery staple")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyPassword("wrong")).toBe(false);
  });

  it("rejects everything when ADMIN_PASSWORD is unset", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(verifyPassword("correct horse battery staple")).toBe(false);
  });
});

describe("createSessionCookieValue / verifySessionCookieValue", () => {
  it("round-trips a freshly created session as valid", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const cookie = createSessionCookieValue(now);
    expect(cookie).not.toBeNull();
    expect(verifySessionCookieValue(cookie, now)).toBe(true);
  });

  it("is still valid just before the session expires", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const cookie = createSessionCookieValue(now);
    const almostExpired = new Date(now.getTime() + ADMIN_SESSION_TTL_MS - 1);
    expect(verifySessionCookieValue(cookie, almostExpired)).toBe(true);
  });

  it("is invalid once the session has expired", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const cookie = createSessionCookieValue(now);
    const afterExpiry = new Date(now.getTime() + ADMIN_SESSION_TTL_MS + 1);
    expect(verifySessionCookieValue(cookie, afterExpiry)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const cookie = createSessionCookieValue(now)!;
    const [expiresAt] = cookie.split(".");
    expect(verifySessionCookieValue(`${expiresAt}.deadbeef`, now)).toBe(false);
  });

  it("rejects an extended expiry that doesn't match its own signature", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const cookie = createSessionCookieValue(now)!;
    const [, signature] = cookie.split(".");
    const forgedExpiry = now.getTime() + ADMIN_SESSION_TTL_MS * 100;
    expect(verifySessionCookieValue(`${forgedExpiry}.${signature}`, now)).toBe(false);
  });

  it("rejects malformed cookie values", () => {
    expect(verifySessionCookieValue("not-a-valid-cookie")).toBe(false);
    expect(verifySessionCookieValue(null)).toBe(false);
    expect(verifySessionCookieValue(undefined)).toBe(false);
    expect(verifySessionCookieValue("")).toBe(false);
  });

  it("stays valid when ADMIN_PASSWORD changes — the cookie isn't signed with it", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const cookie = createSessionCookieValue(now);
    process.env.ADMIN_PASSWORD = "a completely different password";
    expect(verifySessionCookieValue(cookie, now)).toBe(true);
  });

  it("rejects an otherwise-valid session once ADMIN_SESSION_SECRET is removed", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const cookie = createSessionCookieValue(now);
    delete process.env.ADMIN_SESSION_SECRET;
    expect(verifySessionCookieValue(cookie, now)).toBe(false);
  });

  it("returns null when ADMIN_SESSION_SECRET is unset", () => {
    delete process.env.ADMIN_SESSION_SECRET;
    expect(createSessionCookieValue(new Date("2026-09-01T10:00:00Z"))).toBeNull();
  });
});
