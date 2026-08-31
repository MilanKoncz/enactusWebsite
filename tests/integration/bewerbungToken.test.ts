// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkRateLimit = vi.fn();
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

const ORIGINAL_SECRET = process.env.FORM_TOKEN_SECRET;

function request() {
  return new NextRequest("http://localhost/api/bewerbung/token");
}

beforeEach(() => {
  process.env.FORM_TOKEN_SECRET = "a-form-token-signing-secret";
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 59 });
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SECRET === undefined) delete process.env.FORM_TOKEN_SECRET;
  else process.env.FORM_TOKEN_SECRET = ORIGINAL_SECRET;
});

describe("GET /api/bewerbung/token", () => {
  it("issues a token", async () => {
    const { GET } = await import("@/app/api/bewerbung/token/route");
    const response = await GET(request());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.token).toBe("string");
    expect(body.token).toMatch(/^\d+\.[0-9a-f]+$/);
  });

  it("returns a server error when FORM_TOKEN_SECRET is unset", async () => {
    delete process.env.FORM_TOKEN_SECRET;
    const { GET } = await import("@/app/api/bewerbung/token/route");
    const response = await GET(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server_error" });
  });

  // The upload route's own onBeforeGenerateToken depends on a genuine
  // applicant being able to get a token at all — a 429 here is now a real,
  // visible problem (ApplicationForm.tsx's submitRateLimited), not a spam
  // signal, so it must actually be reachable and distinguishable.
  it("rejects a request over the rate limit before checking FORM_TOKEN_SECRET at all", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const { GET } = await import("@/app/api/bewerbung/token/route");
    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limited" });
  });

  it("checks the bewerbung-token bucket, not a generic one", async () => {
    const { GET } = await import("@/app/api/bewerbung/token/route");
    await GET(request());

    expect(checkRateLimit).toHaveBeenCalledWith("bewerbung-token", expect.any(String));
  });
});
