// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ORIGINAL_SECRET = process.env.FORM_TOKEN_SECRET;

beforeEach(() => {
  process.env.FORM_TOKEN_SECRET = "a-form-token-signing-secret";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.FORM_TOKEN_SECRET;
  else process.env.FORM_TOKEN_SECRET = ORIGINAL_SECRET;
});

describe("GET /api/bewerbung/token", () => {
  it("issues a token", async () => {
    const { GET } = await import("@/app/api/bewerbung/token/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.token).toBe("string");
    expect(body.token).toMatch(/^\d+\.[0-9a-f]+$/);
  });

  it("returns a server error when FORM_TOKEN_SECRET is unset", async () => {
    delete process.env.FORM_TOKEN_SECRET;
    const { GET } = await import("@/app/api/bewerbung/token/route");
    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server_error" });
  });
});
