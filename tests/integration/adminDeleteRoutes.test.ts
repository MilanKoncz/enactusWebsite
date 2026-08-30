// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const deleteApplication = vi.fn();
const deleteReminderSignup = vi.fn();
const deleteIdeathonSignup = vi.fn();

vi.mock("@/lib/db", () => ({
  deleteApplication: (...args: unknown[]) => deleteApplication(...args),
  deleteReminderSignup: (...args: unknown[]) => deleteReminderSignup(...args),
  deleteIdeathonSignup: (...args: unknown[]) => deleteIdeathonSignup(...args),
}));

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-delete-route-tests";
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

async function deleteRequest(url: string, withSession = true) {
  const headers: Record<string, string> = {};
  if (withSession) headers.cookie = await sessionCookie();
  return new NextRequest(url, { method: "DELETE", headers });
}

// Same shape as adminProjectAreas.test.ts's DELETE describe block — the
// wunschbereiche/[id] route is this feature's own template — repeated for
// each of the three resources /admin/bewerbungen, /admin/erinnerungen, and
// /admin/ideathon-anmeldungen gained a delete action for the first time
// (recruiting-release pass, 2026-08-30). No revalidateTag call in any of
// these: unlike wunschbereiche/calendar-events/job-postings, these three
// pages read uncached (lib/db.ts calls, not the unstable_cache wrappers in
// lib/calendarEvents.ts and friends), so there is no public-facing cache to
// invalidate.
describe.each([
  {
    resource: "bewerbungen",
    routeModule: "@/app/api/admin/bewerbungen/[id]/route",
    mock: deleteApplication,
  },
  {
    resource: "erinnerungen",
    routeModule: "@/app/api/admin/erinnerungen/[id]/route",
    mock: deleteReminderSignup,
  },
  {
    resource: "ideathon-anmeldungen",
    routeModule: "@/app/api/admin/ideathon-anmeldungen/[id]/route",
    mock: deleteIdeathonSignup,
  },
])("DELETE /api/admin/$resource/[id]", ({ resource, routeModule, mock }) => {
  const params = () => Promise.resolve({ id: ID });
  const url = `http://localhost/api/admin/${resource}/${ID}`;

  it("rejects a request with no session without deleting anything", async () => {
    const { DELETE } = await import(routeModule);
    const response = await DELETE(await deleteRequest(url, false), { params: params() });

    expect(response.status).toBe(401);
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects a malformed id without deleting anything", async () => {
    const { DELETE } = await import(routeModule);
    const response = await DELETE(await deleteRequest(`http://localhost/api/admin/${resource}/nope`), {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(response.status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });

  it("deletes the row and answers 200", async () => {
    mock.mockResolvedValue(true);
    const { DELETE } = await import(routeModule);
    const response = await DELETE(await deleteRequest(url), { params: params() });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledWith(ID);
  });

  it("answers 404 when there was nothing to delete", async () => {
    mock.mockResolvedValue(false);
    const { DELETE } = await import(routeModule);
    const response = await DELETE(await deleteRequest(url), { params: params() });

    expect(response.status).toBe(404);
  });

  it("answers 500, not an unhandled error, when the database write fails", async () => {
    mock.mockRejectedValue(new Error("connection refused"));
    const { DELETE } = await import(routeModule);
    const response = await DELETE(await deleteRequest(url), { params: params() });

    expect(response.status).toBe(500);
  });
});
