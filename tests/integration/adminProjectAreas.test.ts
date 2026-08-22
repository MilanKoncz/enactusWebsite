// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertProjectArea = vi.fn();
const updateProjectArea = vi.fn();
const deleteProjectArea = vi.fn();
const revalidateTag = vi.fn();

vi.mock("@/lib/db", () => ({
  insertProjectArea: (...args: unknown[]) => insertProjectArea(...args),
  updateProjectArea: (...args: unknown[]) => updateProjectArea(...args),
  deleteProjectArea: (...args: unknown[]) => deleteProjectArea(...args),
}));

// Partial, not a replacement: lib/projectAreas.ts is imported transitively
// for its tag constants and calls unstable_cache at module scope, so
// stubbing the whole module breaks the import rather than the call under
// test — same reasoning as adminCalendarEvents.test.ts.
vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return { ...actual, revalidateTag: (...a: unknown[]) => revalidateTag(...a) };
});

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

const VALID = { labelDe: "SmileGreen", labelEn: "SmileGreen", sortOrder: 1, active: true };

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-project-area-tests";
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

describe("POST /api/admin/wunschbereiche", () => {
  it("rejects a request with no session without writing anything", async () => {
    const { POST } = await import("@/app/api/admin/wunschbereiche/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/wunschbereiche", VALID, false));

    expect(response.status).toBe(401);
    expect(insertProjectArea).not.toHaveBeenCalled();
  });

  it("rejects a blank German label", async () => {
    const { POST } = await import("@/app/api/admin/wunschbereiche/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/wunschbereiche", { ...VALID, labelDe: "  " }),
    );

    expect(response.status).toBe(400);
    expect(insertProjectArea).not.toHaveBeenCalled();
  });

  it("rejects a non-integer sort order", async () => {
    const { POST } = await import("@/app/api/admin/wunschbereiche/route");
    const response = await POST(
      await request("POST", "http://localhost/api/admin/wunschbereiche", { ...VALID, sortOrder: 1.5 }),
    );

    expect(response.status).toBe(400);
    expect(insertProjectArea).not.toHaveBeenCalled();
  });

  it("creates the area and invalidates the application form's cache", async () => {
    insertProjectArea.mockResolvedValue({ id: ID, ...VALID });
    const { POST } = await import("@/app/api/admin/wunschbereiche/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/wunschbereiche", VALID));

    expect(response.status).toBe(201);
    expect(revalidateTag).toHaveBeenCalledWith("project-areas", { expire: 0 });
  });

  it("answers 500 without invalidating the cache when the database write fails", async () => {
    insertProjectArea.mockRejectedValue(new Error("connection refused"));
    const { POST } = await import("@/app/api/admin/wunschbereiche/route");
    const response = await POST(await request("POST", "http://localhost/api/admin/wunschbereiche", VALID));

    expect(response.status).toBe(500);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/wunschbereiche/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session", async () => {
    const { PATCH } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/wunschbereiche/${ID}`, VALID, false),
      { params: params() },
    );

    expect(response.status).toBe(401);
    expect(updateProjectArea).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before validating the body", async () => {
    const { PATCH } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await PATCH(
      await request("PATCH", "http://localhost/api/admin/wunschbereiche/nope", VALID),
      { params: Promise.resolve({ id: "nope" }) },
    );

    expect(response.status).toBe(400);
    expect(updateProjectArea).not.toHaveBeenCalled();
  });

  it("answers 404 when the area is already gone, without invalidating the cache", async () => {
    updateProjectArea.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/wunschbereiche/${ID}`, VALID),
      { params: params() },
    );

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("updates the area and invalidates the application form's cache", async () => {
    updateProjectArea.mockResolvedValue({ id: ID, ...VALID });
    const { PATCH } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/wunschbereiche/${ID}`, VALID),
      { params: params() },
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("project-areas", { expire: 0 });
  });

  // The everyday action this table exists for: a board member switching an
  // area off (or back on) is just a PATCH with active flipped, not a
  // dedicated endpoint — updateProjectArea is called with the full record,
  // exactly like any other edit.
  it("deactivating an area is a normal update, not a delete", async () => {
    updateProjectArea.mockResolvedValue({ id: ID, ...VALID, active: false });
    const { PATCH } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await PATCH(
      await request("PATCH", `http://localhost/api/admin/wunschbereiche/${ID}`, { ...VALID, active: false }),
      { params: params() },
    );

    expect(response.status).toBe(200);
    expect(updateProjectArea).toHaveBeenCalledWith(ID, { ...VALID, active: false });
    expect(deleteProjectArea).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/wunschbereiche/[id]", () => {
  const params = () => Promise.resolve({ id: ID });

  it("rejects a request with no session without deleting anything", async () => {
    const { DELETE } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/wunschbereiche/${ID}`, undefined, false),
      { params: params() },
    );

    expect(response.status).toBe(401);
    expect(deleteProjectArea).not.toHaveBeenCalled();
  });

  it("deletes the area and invalidates the application form's cache", async () => {
    deleteProjectArea.mockResolvedValue(true);
    const { DELETE } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/wunschbereiche/${ID}`, undefined),
      { params: params() },
    );

    expect(response.status).toBe(200);
    expect(deleteProjectArea).toHaveBeenCalledWith(ID);
    expect(revalidateTag).toHaveBeenCalledWith("project-areas", { expire: 0 });
  });

  it("answers 404 without invalidating when there was nothing to delete", async () => {
    deleteProjectArea.mockResolvedValue(false);
    const { DELETE } = await import("@/app/api/admin/wunschbereiche/[id]/route");
    const response = await DELETE(
      await request("DELETE", `http://localhost/api/admin/wunschbereiche/${ID}`, undefined),
      { params: params() },
    );

    expect(response.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
