// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { instantToWallClock } from "@/lib/recruitingTime";

const findOverlappingRecruitingWindows = vi.fn();
const insertRecruitingWindow = vi.fn();
const updateRecruitingWindow = vi.fn();
const deleteRecruitingWindow = vi.fn();
const revalidateTag = vi.fn();

vi.mock("@/lib/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db")>();
  return {
    // isUniqueViolation is a pure predicate over an error object, so the
    // real one is used — mocking it would only test the mock.
    isUniqueViolation: actual.isUniqueViolation,
    findOverlappingRecruitingWindows: (...a: unknown[]) => findOverlappingRecruitingWindows(...a),
    insertRecruitingWindow: (...a: unknown[]) => insertRecruitingWindow(...a),
    updateRecruitingWindow: (...a: unknown[]) => updateRecruitingWindow(...a),
    deleteRecruitingWindow: (...a: unknown[]) => deleteRecruitingWindow(...a),
  };
});

// Partial, not a replacement: lib/recruitingWindows.ts is imported
// transitively for its tag constants and calls unstable_cache at module
// scope, so stubbing the whole module breaks the import rather than the
// call under test.
vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return { ...actual, revalidateTag: (...a: unknown[]) => revalidateTag(...a) };
});

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

const VALID = { semester: "FSS27", start: "2027-03-01T00:00", end: "2027-03-14T23:59" };

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-window-tests";
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function sessionCookie() {
  const { createSessionCookieValue } = await import("@/lib/adminAuth");
  return `admin_session=${createSessionCookieValue()!}`;
}

async function request(method: string, url: string, body?: unknown, withSession = true) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withSession) headers.cookie = await sessionCookie();
  return new NextRequest(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

describe("POST /api/admin/bewerbungsfenster", () => {
  it("rejects a request with no session without reading or writing anything", async () => {
    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/bewerbungsfenster", VALID, false),
    );

    expect(response.status).toBe(401);
    expect(findOverlappingRecruitingWindows).not.toHaveBeenCalled();
    expect(insertRecruitingWindow).not.toHaveBeenCalled();
  });

  it("rejects a semester label that isn't HWS/FSS plus two digits", async () => {
    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/bewerbungsfenster", { ...VALID, semester: "WS2027" }),
    );

    expect(response.status).toBe(400);
    expect(insertRecruitingWindow).not.toHaveBeenCalled();
  });

  it("rejects a window whose end is before its start", async () => {
    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/bewerbungsfenster", {
        ...VALID,
        start: "2027-03-14T23:59",
        end: "2027-03-01T00:00",
      }),
    );

    expect(response.status).toBe(400);
    expect(insertRecruitingWindow).not.toHaveBeenCalled();
  });

  it("converts the wall clock to an instant in Europe/Berlin, not in UTC", async () => {
    findOverlappingRecruitingWindows.mockResolvedValue([]);
    insertRecruitingWindow.mockResolvedValue({ id: ID, semester: "FSS27", start: "x", end: "y" });

    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    await POST(
      await request("POST", "http://localhost/api/admin/bewerbungsfenster", {
        semester: "HWS26",
        start: "2026-09-01T00:00",
        end: "2026-09-13T23:59",
      }),
    );

    const [, startsAt] = insertRecruitingWindow.mock.calls[0] as [string, Date, Date];
    // CEST is +02:00, so midnight Berlin is 22:00 UTC the previous day.
    expect(startsAt.toISOString()).toBe("2026-08-31T22:00:00.000Z");
  });

  it("refuses a window that overlaps an existing one, naming it", async () => {
    findOverlappingRecruitingWindows.mockResolvedValue([{ id: "other", semester: "HWS26" }]);

    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/bewerbungsfenster", VALID),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: "overlaps", semester: "HWS26" });
    expect(insertRecruitingWindow).not.toHaveBeenCalled();
  });

  it("reports a duplicate semester as a conflict, not a server error", async () => {
    findOverlappingRecruitingWindows.mockResolvedValue([]);
    insertRecruitingWindow.mockRejectedValue(Object.assign(new Error("duplicate key"), { code: "23505" }));

    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/bewerbungsfenster", VALID),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: "duplicate_semester" });
  });

  it("invalidates the public page's cache after a successful create", async () => {
    findOverlappingRecruitingWindows.mockResolvedValue([]);
    insertRecruitingWindow.mockResolvedValue({ id: ID, semester: "FSS27", start: "x", end: "y" });

    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/bewerbungsfenster", VALID),
    );

    expect(response.status).toBe(201);
    expect(revalidateTag).toHaveBeenCalledWith("recruiting-windows", { expire: 0 });
  });

  it("does not invalidate the cache when nothing was written", async () => {
    findOverlappingRecruitingWindows.mockResolvedValue([{ id: "other", semester: "HWS26" }]);

    const { POST } = await import("@/app/api/admin/bewerbungsfenster/route");
    await POST(await request("POST", "http://localhost/api/admin/bewerbungsfenster", VALID));

    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/bewerbungsfenster/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session", async () => {
    const { PATCH } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/bewerbungsfenster/${ID}`, VALID, false),
      { params: params() },
    );

    expect(response.status).toBe(401);
    expect(updateRecruitingWindow).not.toHaveBeenCalled();
  });

  it("excludes the window being edited from its own overlap check", async () => {
    findOverlappingRecruitingWindows.mockResolvedValue([]);
    updateRecruitingWindow.mockResolvedValue({ id: ID, semester: "FSS27", start: "x", end: "y" });

    const { PATCH } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
    await PATCH(
      await request("PATCH", `http://localhost/api/admin/bewerbungsfenster/${ID}`, VALID),
      { params: params() },
    );

    const [, , excludeId] = findOverlappingRecruitingWindows.mock.calls[0] as [Date, Date, string];
    expect(excludeId).toBe(ID);
  });

  it("keeps the instant unchanged when saved without modification (the round trip admin/bewerbungsfenster/page.tsx relies on)", async () => {
    // The admin page pre-fills the edit form from instantToWallClock(stored
    // instant) — this reproduces that exact step, then feeds the result
    // back through the same PATCH route a click on "save" would hit, for
    // both a summer and a winter stored instant. Opening a window and
    // saving with no changes must not shift it by the DST offset in either
    // direction, which is exactly the bug an earlier, live-recomputed
    // version of a related value hit (see retentionCutoff.ts's own
    // history).
    findOverlappingRecruitingWindows.mockResolvedValue([]);
    updateRecruitingWindow.mockResolvedValue({ id: ID, semester: "FSS27", start: "x", end: "y" });

    for (const storedIso of ["2026-08-31T22:00:00.000Z", "2027-01-15T11:00:00.000Z"]) {
      updateRecruitingWindow.mockClear();
      const storedInstant = new Date(storedIso);
      const wallClock = instantToWallClock(storedInstant);

      const { PATCH } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
      await PATCH(
        await request("PATCH", `http://localhost/api/admin/bewerbungsfenster/${ID}`, {
          semester: "FSS27",
          start: wallClock,
          end: instantToWallClock(new Date(storedInstant.getTime() + 60_000)),
        }),
        { params: params() },
      );

      const [, , savedStart] = updateRecruitingWindow.mock.calls[0] as [string, string, Date, Date];
      expect(savedStart.toISOString()).toBe(storedInstant.toISOString());
    }
  });

  it("answers 404 when the window is already gone", async () => {
    findOverlappingRecruitingWindows.mockResolvedValue([]);
    updateRecruitingWindow.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/bewerbungsfenster/${ID}`, VALID),
      { params: params() },
    );

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before querying", async () => {
    const { PATCH } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
    const response = await PATCH(
      await request("PATCH", "http://localhost/api/admin/bewerbungsfenster/nope", VALID),
      { params: Promise.resolve({ id: "nope" }) },
    );

    expect(response.status).toBe(400);
    expect(findOverlappingRecruitingWindows).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/bewerbungsfenster/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session without deleting anything", async () => {
    const { DELETE } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/bewerbungsfenster/${ID}`, undefined, false),
      { params: params() },
    );

    expect(response.status).toBe(401);
    expect(deleteRecruitingWindow).not.toHaveBeenCalled();
  });

  it("deletes the window and invalidates the public page's cache", async () => {
    deleteRecruitingWindow.mockResolvedValue(true);

    const { DELETE } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/bewerbungsfenster/${ID}`, undefined),
      { params: params() },
    );

    expect(response.status).toBe(200);
    expect(deleteRecruitingWindow).toHaveBeenCalledWith(ID);
    expect(revalidateTag).toHaveBeenCalledWith("recruiting-windows", { expire: 0 });
  });

  it("answers 404 without invalidating when there was nothing to delete", async () => {
    deleteRecruitingWindow.mockResolvedValue(false);

    const { DELETE } = await import("@/app/api/admin/bewerbungsfenster/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/bewerbungsfenster/${ID}`, undefined),
      { params: params() },
    );

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
