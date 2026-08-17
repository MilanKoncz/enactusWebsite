import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MIN_FILL_MS } from "@/lib/antiSpam";
import { checkFormToken, createFormToken } from "@/lib/formToken";

const ORIGINAL_SECRET = process.env.FORM_TOKEN_SECRET;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

beforeEach(() => {
  process.env.FORM_TOKEN_SECRET = "a-form-token-signing-secret";
});

afterEach(() => {
  process.env.FORM_TOKEN_SECRET = ORIGINAL_SECRET;
});

describe("createFormToken", () => {
  it("returns null when FORM_TOKEN_SECRET is unset", () => {
    delete process.env.FORM_TOKEN_SECRET;
    expect(createFormToken(new Date("2026-09-01T10:00:00Z"))).toBeNull();
  });

  it("embeds the issue time in plaintext, ahead of the signature", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now)!;
    expect(token.startsWith(`${now.getTime()}.`)).toBe(true);
  });
});

describe("checkFormToken", () => {
  it("is 'too_fast' immediately after issuing", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now);
    expect(checkFormToken(token, now)).toBe("too_fast");
  });

  it("is 'too_fast' just before the minimum fill time elapses", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now);
    const almostFilled = new Date(now.getTime() + MIN_FILL_MS - 1);
    expect(checkFormToken(token, almostFilled)).toBe("too_fast");
  });

  it("is 'valid' once the minimum fill time has elapsed", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now);
    const filled = new Date(now.getTime() + MIN_FILL_MS);
    expect(checkFormToken(token, filled)).toBe("valid");
  });

  it("is still 'valid' just before the token expires", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now);
    const almostExpired = new Date(now.getTime() + MAX_AGE_MS - 1);
    expect(checkFormToken(token, almostExpired)).toBe("valid");
  });

  it("is 'expired' once the maximum age has elapsed", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now);
    const wayLater = new Date(now.getTime() + MAX_AGE_MS + 1);
    expect(checkFormToken(token, wayLater)).toBe("expired");
  });

  it("is 'invalid' for a tampered signature", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now)!;
    const [issuedAt] = token.split(".");
    const filled = new Date(now.getTime() + MIN_FILL_MS);
    expect(checkFormToken(`${issuedAt}.deadbeef`, filled)).toBe("invalid");
  });

  it("is 'invalid' for a forged, more-recent issue time that doesn't match its own signature", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now)!;
    const [, signature] = token.split(".");
    const forgedIssuedAt = now.getTime() + MIN_FILL_MS;
    expect(checkFormToken(`${forgedIssuedAt}.${signature}`, new Date(forgedIssuedAt))).toBe("invalid");
  });

  it("is 'invalid' for malformed or missing tokens", () => {
    expect(checkFormToken("not-a-valid-token")).toBe("invalid");
    expect(checkFormToken(null)).toBe("invalid");
    expect(checkFormToken(undefined)).toBe("invalid");
    expect(checkFormToken("")).toBe("invalid");
  });

  it("is 'invalid' for an otherwise-valid token once FORM_TOKEN_SECRET is removed", () => {
    const now = new Date("2026-09-01T10:00:00Z");
    const token = createFormToken(now);
    delete process.env.FORM_TOKEN_SECRET;
    const filled = new Date(now.getTime() + MIN_FILL_MS);
    expect(checkFormToken(token, filled)).toBe("invalid");
  });
});
