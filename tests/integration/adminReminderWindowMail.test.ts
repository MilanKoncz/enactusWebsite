// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const findRecruitingWindowById = vi.fn();
const sendReminderWindowMailsForWindow = vi.fn();

vi.mock("@/lib/db", () => ({
  findRecruitingWindowById: (...a: unknown[]) => findRecruitingWindowById(...a),
}));

vi.mock("@/lib/reminderWindowMail", () => ({
  sendReminderWindowMailsForWindow: (...a: unknown[]) => sendReminderWindowMailsForWindow(...a),
}));

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const WINDOW_ID = "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-window-mail-tests";
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function triggerRequest(body: unknown, withSession = true) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withSession) {
    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    headers.cookie = `admin_session=${createSessionCookieValue()!}`;
  }
  return new NextRequest("http://localhost/api/admin/erinnerungen/fenster", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// The board's manual override for launch day — this route is a thin
// wrapper around the exact function the cron uses
// (lib/reminderWindowMail.ts), so its own idempotency is covered by
// tests/unit/lib/reminderWindowMail.test.ts. This file only needs to prove
// the route is gated, validated, and wired to the right window.
describe("POST /api/admin/erinnerungen/fenster", () => {
  it("rejects a request with no session cookie without reading or sending anything", async () => {
    const { POST } = await import("@/app/api/admin/erinnerungen/fenster/route");
    const response = await POST(await triggerRequest({ windowId: WINDOW_ID }, false));

    expect(response.status).toBe(401);
    expect(findRecruitingWindowById).not.toHaveBeenCalled();
    expect(sendReminderWindowMailsForWindow).not.toHaveBeenCalled();
  });

  it("rejects a windowId that isn't a uuid", async () => {
    const { POST } = await import("@/app/api/admin/erinnerungen/fenster/route");
    const response = await POST(await triggerRequest({ windowId: "not-a-uuid" }));

    expect(response.status).toBe(400);
    expect(findRecruitingWindowById).not.toHaveBeenCalled();
  });

  it("answers 404 for a window that no longer exists", async () => {
    findRecruitingWindowById.mockResolvedValue(null);

    const { POST } = await import("@/app/api/admin/erinnerungen/fenster/route");
    const response = await POST(await triggerRequest({ windowId: WINDOW_ID }));

    expect(response.status).toBe(404);
    expect(sendReminderWindowMailsForWindow).not.toHaveBeenCalled();
  });

  it("sends for the requested window and reports the counts", async () => {
    const window = { id: WINDOW_ID, semester: "HWS26", start: "2026-09-01T00:00:00+02:00", end: "2026-09-13T23:59:00+02:00" };
    findRecruitingWindowById.mockResolvedValue(window);
    sendReminderWindowMailsForWindow.mockResolvedValue({ sent: 12, failed: 1 });

    const { POST } = await import("@/app/api/admin/erinnerungen/fenster/route");
    const response = await POST(await triggerRequest({ windowId: WINDOW_ID }));

    expect(response.status).toBe(200);
    expect(sendReminderWindowMailsForWindow).toHaveBeenCalledWith(window);
    expect(await response.json()).toEqual({ ok: true, sent: 12, failed: 1 });
  });
});
