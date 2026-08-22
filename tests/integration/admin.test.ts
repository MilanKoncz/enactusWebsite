// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkRateLimit = vi.fn();
const listApplicationsBySemester = vi.fn();

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("@/lib/db", () => ({
  listApplicationsBySemester: (...args: unknown[]) => listApplicationsBySemester(...args),
}));

const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

beforeEach(() => {
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
  process.env.ADMIN_SESSION_SECRET = "a-completely-different-signing-secret";
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_PASSWORD === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD;
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

function loginRequest(password: unknown) {
  return new NextRequest("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/admin/login", () => {
  it("sets a session cookie and succeeds with the correct password", async () => {
    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(loginRequest("correct horse battery staple"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.cookies.get("admin_session")?.value).toBeTruthy();
  });

  it("rejects a wrong password with 401 and sets no cookie", async () => {
    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(loginRequest("wrong"));

    expect(response.status).toBe(401);
    expect(response.cookies.get("admin_session")).toBeUndefined();
  });

  it("rejects every attempt once the rate limit is hit", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(loginRequest("correct horse battery staple"));

    expect(response.status).toBe(429);
  });

  it("rejects every attempt when ADMIN_PASSWORD is unset, even a correct guess", async () => {
    delete process.env.ADMIN_PASSWORD;
    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(loginRequest("correct horse battery staple"));

    expect(response.status).toBe(401);
  });
});

describe("POST /api/admin/logout", () => {
  it("clears the session cookie", async () => {
    const { POST } = await import("@/app/api/admin/logout/route");
    const response = await POST();

    expect(response.status).toBe(200);
    expect(response.cookies.get("admin_session")?.value).toBe("");
  });
});

describe("GET /api/admin/bewerbungen/csv", () => {
  function csvRequest(url: string, cookie?: string) {
    return new NextRequest(url, { headers: cookie ? { cookie } : {} });
  }

  it("rejects a request with no session cookie", async () => {
    const { GET } = await import("@/app/api/admin/bewerbungen/csv/route");
    const response = await GET(csvRequest("http://localhost/api/admin/bewerbungen/csv?semester=HWS26"));

    expect(response.status).toBe(401);
    expect(listApplicationsBySemester).not.toHaveBeenCalled();
  });

  it("rejects a request missing the semester parameter, even with a valid session", async () => {
    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    const cookie = createSessionCookieValue()!;
    const { GET } = await import("@/app/api/admin/bewerbungen/csv/route");
    const response = await GET(csvRequest("http://localhost/api/admin/bewerbungen/csv", `admin_session=${cookie}`));

    expect(response.status).toBe(400);
  });

  it("returns a UTF-8-BOM CSV with the semester's applications, given a valid session", async () => {
    listApplicationsBySemester.mockResolvedValue([
      {
        id: "1",
        createdAt: new Date("2026-09-05T10:00:00Z"),
        firstName: "Jäne",
        lastName: "Döe",
        email: "jane@example.com",
        studyProgram: "BWL",
        desiredAreas: ["SmileGreen", "Finance-Lead"],
        mailStatus: "sent",
        recruitingSemester: "HWS26",
      },
    ]);

    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    const cookie = createSessionCookieValue()!;
    const { GET } = await import("@/app/api/admin/bewerbungen/csv/route");
    const response = await GET(
      csvRequest("http://localhost/api/admin/bewerbungen/csv?semester=HWS26", `admin_session=${cookie}`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("bewerbungen-HWS26.csv");

    // response.text() decodes via TextDecoder, which strips a leading BOM
    // by spec — reading the raw bytes is the only way to confirm the BOM
    // Excel needs is actually on the wire.
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const body = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    expect(body).toContain("Jäne Döe");
    expect(body).toContain("SmileGreen; Finance-Lead");
    expect(listApplicationsBySemester).toHaveBeenCalledWith("HWS26");
  });
});
