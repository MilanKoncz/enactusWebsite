// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertCalendarEvent = vi.fn();
const updateCalendarEvent = vi.fn();
const deleteCalendarEvent = vi.fn();
const revalidateTag = vi.fn();

vi.mock("@/lib/db", () => ({
  insertCalendarEvent: (...args: unknown[]) => insertCalendarEvent(...args),
  updateCalendarEvent: (...args: unknown[]) => updateCalendarEvent(...args),
  deleteCalendarEvent: (...args: unknown[]) => deleteCalendarEvent(...args),
}));

// Partial, not a replacement: lib/calendarEvents.ts is imported transitively
// for its tag constants and calls unstable_cache at module scope, so
// stubbing the whole module breaks the import rather than the call under
// test — same reasoning as adminRecruitingWindows.test.ts.
vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return { ...actual, revalidateTag: (...a: unknown[]) => revalidateTag(...a) };
});

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

const VALID = {
  title: "Ideathon",
  category: "innolab",
  startDate: "2026-09-24",
  endDate: "2026-09-27",
  tentative: false,
};

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-calendar-event-tests";
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

describe("POST /api/admin/termine", () => {
  it("rejects a request with no session without writing anything", async () => {
    const { POST } = await import("@/app/api/admin/termine/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/termine", VALID, false));

    expect(response.status).toBe(401);
    expect(insertCalendarEvent).not.toHaveBeenCalled();
  });

  it("rejects a blank title", async () => {
    const { POST } = await import("@/app/api/admin/termine/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/termine", { ...VALID, title: "  " }),
    );

    expect(response.status).toBe(400);
    expect(insertCalendarEvent).not.toHaveBeenCalled();
  });

  it("rejects an unknown category", async () => {
    const { POST } = await import("@/app/api/admin/termine/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/termine", { ...VALID, category: "sponsoring" }),
    );

    expect(response.status).toBe(400);
    expect(insertCalendarEvent).not.toHaveBeenCalled();
  });

  it("rejects an end date before the start date", async () => {
    const { POST } = await import("@/app/api/admin/termine/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/termine", {
        ...VALID,
        startDate: "2026-09-27",
        endDate: "2026-09-24",
      }),
    );

    expect(response.status).toBe(400);
    expect(insertCalendarEvent).not.toHaveBeenCalled();
  });

  it("creates the event and invalidates the homepage's cache", async () => {
    insertCalendarEvent.mockResolvedValue({ id: ID, ...VALID });
    const { POST } = await import("@/app/api/admin/termine/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/termine", VALID));

    expect(response.status).toBe(201);
    expect(revalidateTag).toHaveBeenCalledWith("calendar-events", { expire: 0 });
  });

  it("answers 500 without invalidating the cache when the database write fails", async () => {
    insertCalendarEvent.mockRejectedValue(new Error("connection refused"));
    const { POST } = await import("@/app/api/admin/termine/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/termine", VALID));

    expect(response.status).toBe(500);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/termine/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session", async () => {
    const { PATCH } = await import("@/app/api/admin/termine/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/termine/${ID}`, VALID, false),
      { params: params() },
    );

    expect(response.status).toBe(401);
    expect(updateCalendarEvent).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before validating the body", async () => {
    const { PATCH } = await import("@/app/api/admin/termine/[id]/route");
    const response = await PATCH(
      await request("PATCH", "http://localhost/api/admin/termine/nope", VALID),
      { params: Promise.resolve({ id: "nope" }) },
    );

    expect(response.status).toBe(400);
    expect(updateCalendarEvent).not.toHaveBeenCalled();
  });

  it("answers 404 when the event is already gone, without invalidating the cache", async () => {
    updateCalendarEvent.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/termine/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/termine/${ID}`, VALID),
      { params: params() },
    );

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("updates the event and invalidates the homepage's cache", async () => {
    updateCalendarEvent.mockResolvedValue({ id: ID, ...VALID });
    const { PATCH } = await import("@/app/api/admin/termine/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/termine/${ID}`, VALID),
      { params: params() },
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("calendar-events", { expire: 0 });
  });
});

describe("DELETE /api/admin/termine/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session without deleting anything", async () => {
    const { DELETE } = await import("@/app/api/admin/termine/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/termine/${ID}`, undefined, false),
      { params: params() },
    );

    expect(response.status).toBe(401);
    expect(deleteCalendarEvent).not.toHaveBeenCalled();
  });

  it("deletes the event and invalidates the homepage's cache", async () => {
    deleteCalendarEvent.mockResolvedValue(true);
    const { DELETE } = await import("@/app/api/admin/termine/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/termine/${ID}`, undefined),
      { params: params() },
    );

    expect(response.status).toBe(200);
    expect(deleteCalendarEvent).toHaveBeenCalledWith(ID);
    expect(revalidateTag).toHaveBeenCalledWith("calendar-events", { expire: 0 });
  });

  it("answers 404 without invalidating when there was nothing to delete", async () => {
    deleteCalendarEvent.mockResolvedValue(false);
    const { DELETE } = await import("@/app/api/admin/termine/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/termine/${ID}`, undefined),
      { params: params() },
    );

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
