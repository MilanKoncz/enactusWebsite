// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const findPersonalDataByEmail = vi.fn();
const deletePersonalDataByEmail = vi.fn();

vi.mock("@/lib/db", () => ({
  findPersonalDataByEmail: (...a: unknown[]) => findPersonalDataByEmail(...a),
  deletePersonalDataByEmail: (...a: unknown[]) => deletePersonalDataByEmail(...a),
}));

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const EMAIL = "jane@example.com";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-deletion-tests";
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function req(method: string, body: unknown, withSession = true) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withSession) {
    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    headers.cookie = `admin_session=${createSessionCookieValue()!}`;
  }
  return new NextRequest("http://localhost/api/admin/loeschanfragen", {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/loeschanfragen (search)", () => {
  it("rejects a request with no session without querying anything", async () => {
    const { POST } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await POST(await req("POST", { email: EMAIL }, false));

    expect(response.status).toBe(401);
    expect(findPersonalDataByEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed address", async () => {
    const { POST } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await POST(await req("POST", { email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(findPersonalDataByEmail).not.toHaveBeenCalled();
  });

  it("returns matches across all four tables", async () => {
    findPersonalDataByEmail.mockResolvedValue({
      applications: [{ id: "a1" }],
      contactMessages: [{ id: "c1" }, { id: "c2" }],
      reminderSignups: [],
      ideathonSignups: [{ id: "i1" }],
    });

    const { POST } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await POST(await req("POST", { email: EMAIL }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.matches.applications).toHaveLength(1);
    expect(body.matches.contactMessages).toHaveLength(2);
    expect(body.matches.reminderSignups).toHaveLength(0);
    expect(body.matches.ideathonSignups).toHaveLength(1);
  });

  it("reports a database failure rather than crashing", async () => {
    findPersonalDataByEmail.mockRejectedValue(new Error("db unreachable"));

    const { POST } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await POST(await req("POST", { email: EMAIL }));

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/admin/loeschanfragen", () => {
  it("rejects a request with no session without deleting anything", async () => {
    const { DELETE } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await DELETE(await req("DELETE", { email: EMAIL, confirmEmail: EMAIL }, false));

    expect(response.status).toBe(401);
    expect(deletePersonalDataByEmail).not.toHaveBeenCalled();
  });

  // The guard that matters: this is the only irreversible action in the
  // admin area, on data no backup restores.
  it("deletes nothing when the confirmation address doesn't match", async () => {
    const { DELETE } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await DELETE(
      await req("DELETE", { email: EMAIL, confirmEmail: "someone.else@example.com" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "confirmation_mismatch" });
    expect(deletePersonalDataByEmail).not.toHaveBeenCalled();
  });

  it("deletes nothing when the confirmation is missing entirely", async () => {
    const { DELETE } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await DELETE(await req("DELETE", { email: EMAIL }));

    expect(response.status).toBe(400);
    expect(deletePersonalDataByEmail).not.toHaveBeenCalled();
  });

  it("accepts a confirmation that differs only in capitalisation", async () => {
    deletePersonalDataByEmail.mockResolvedValue({ applications: 1, contactMessages: 0, reminderSignups: 0 });

    const { DELETE } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await DELETE(
      await req("DELETE", { email: "jane@example.com", confirmEmail: "Jane@Example.com" }),
    );

    expect(response.status).toBe(200);
    expect(deletePersonalDataByEmail).toHaveBeenCalledWith("jane@example.com");
  });

  it("reports how much was deleted per table", async () => {
    deletePersonalDataByEmail.mockResolvedValue({
      applications: 2,
      contactMessages: 1,
      reminderSignups: 1,
      ideathonSignups: 3,
    });

    const { DELETE } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await DELETE(await req("DELETE", { email: EMAIL, confirmEmail: EMAIL }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      deleted: { applications: 2, contactMessages: 1, reminderSignups: 1, ideathonSignups: 3 },
    });
  });

  it("reports a database failure rather than claiming success", async () => {
    deletePersonalDataByEmail.mockRejectedValue(new Error("db unreachable"));

    const { DELETE } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await DELETE(await req("DELETE", { email: EMAIL, confirmEmail: EMAIL }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "server_error" });
  });

  it("rejects a malformed address before deleting", async () => {
    const { DELETE } = await import("@/app/api/admin/loeschanfragen/route");
    const response = await DELETE(await req("DELETE", { email: "nope", confirmEmail: "nope" }));

    expect(response.status).toBe(400);
    expect(deletePersonalDataByEmail).not.toHaveBeenCalled();
  });
});
