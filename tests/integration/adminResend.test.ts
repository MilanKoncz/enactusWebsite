// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const findApplicationById = vi.fn();
const findContactMessageById = vi.fn();
const findReminderSignupById = vi.fn();
const findReminderWindowMailById = vi.fn();
const markApplicationMailed = vi.fn();
const markApplicationMailFailed = vi.fn();
const markContactMessageMailed = vi.fn();
const markContactMessageMailFailed = vi.fn();
const markReminderMailed = vi.fn();
const markReminderMailFailed = vi.fn();
const markReminderWindowMailSent = vi.fn();
const markReminderWindowMailFailed = vi.fn();

const dispatchApplicationMails = vi.fn();
const dispatchContactNotification = vi.fn();
const dispatchReminderConfirmation = vi.fn();
const dispatchReminderWindowOpen = vi.fn();

vi.mock("@/lib/db", () => ({
  findApplicationById: (...a: unknown[]) => findApplicationById(...a),
  findContactMessageById: (...a: unknown[]) => findContactMessageById(...a),
  findReminderSignupById: (...a: unknown[]) => findReminderSignupById(...a),
  findReminderWindowMailById: (...a: unknown[]) => findReminderWindowMailById(...a),
  markApplicationMailed: (...a: unknown[]) => markApplicationMailed(...a),
  markApplicationMailFailed: (...a: unknown[]) => markApplicationMailFailed(...a),
  markContactMessageMailed: (...a: unknown[]) => markContactMessageMailed(...a),
  markContactMessageMailFailed: (...a: unknown[]) => markContactMessageMailFailed(...a),
  markReminderMailed: (...a: unknown[]) => markReminderMailed(...a),
  markReminderMailFailed: (...a: unknown[]) => markReminderMailFailed(...a),
  markReminderWindowMailSent: (...a: unknown[]) => markReminderWindowMailSent(...a),
  markReminderWindowMailFailed: (...a: unknown[]) => markReminderWindowMailFailed(...a),
}));

vi.mock("@/lib/mailDispatch", () => ({
  dispatchApplicationMails: (...a: unknown[]) => dispatchApplicationMails(...a),
  dispatchContactNotification: (...a: unknown[]) => dispatchContactNotification(...a),
  dispatchReminderConfirmation: (...a: unknown[]) => dispatchReminderConfirmation(...a),
  dispatchReminderWindowOpen: (...a: unknown[]) => dispatchReminderWindowOpen(...a),
}));

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-resend-tests";
});

afterEach(() => {
  vi.resetAllMocks();
  if (ORIGINAL_SESSION_SECRET === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION_SECRET;
});

async function resendRequest(body: unknown, withSession = true) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withSession) {
    const { createSessionCookieValue } = await import("@/lib/adminAuth");
    headers.cookie = `admin_session=${createSessionCookieValue()!}`;
  }
  return new NextRequest("http://localhost/api/admin/mails/resend", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/mails/resend", () => {
  it("rejects a request with no session cookie without reading or sending anything", async () => {
    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "applications", id: ID }, false));

    expect(response.status).toBe(401);
    expect(findApplicationById).not.toHaveBeenCalled();
    expect(dispatchApplicationMails).not.toHaveBeenCalled();
  });

  it("rejects an unknown source, so only the three real tables can be targeted", async () => {
    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "schema_migrations", id: ID }));

    expect(response.status).toBe(400);
    expect(dispatchApplicationMails).not.toHaveBeenCalled();
  });

  it("rejects an id that isn't a uuid", async () => {
    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "applications", id: "not-a-uuid" }));

    expect(response.status).toBe(400);
    expect(findApplicationById).not.toHaveBeenCalled();
  });

  it("resends an application's mails and marks the row sent", async () => {
    const application = { id: ID, email: "jane@example.com", firstName: "Jane", locale: "de" };
    findApplicationById.mockResolvedValue(application);
    dispatchApplicationMails.mockResolvedValue(undefined);
    markApplicationMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "applications", id: ID }));

    expect(response.status).toBe(200);
    expect(dispatchApplicationMails).toHaveBeenCalledWith(application);
    expect(markApplicationMailed).toHaveBeenCalledWith(ID);
    expect(markApplicationMailFailed).not.toHaveBeenCalled();
  });

  it("resends a contact notification and marks the row sent", async () => {
    const message = { id: ID, name: "Jane", email: "jane@example.com", message: "Hallo", locale: "de" };
    findContactMessageById.mockResolvedValue(message);
    dispatchContactNotification.mockResolvedValue(undefined);
    markContactMessageMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "contact_messages", id: ID }));

    expect(response.status).toBe(200);
    expect(dispatchContactNotification).toHaveBeenCalledWith(message);
    expect(markContactMessageMailed).toHaveBeenCalledWith(ID);
  });

  it("resends an unconfirmed reminder's confirmation mail and marks the row sent", async () => {
    const signup = {
      id: ID,
      email: "jane@example.com",
      locale: "de",
      confirmed: false,
      confirmToken: "confirm-token",
      unsubscribeToken: "unsub-token",
    };
    findReminderSignupById.mockResolvedValue(signup);
    dispatchReminderConfirmation.mockResolvedValue(undefined);
    markReminderMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "reminder_signups", id: ID }));

    expect(response.status).toBe(200);
    expect(dispatchReminderConfirmation).toHaveBeenCalledWith(signup);
    expect(markReminderMailed).toHaveBeenCalledWith(ID);
  });

  it("never re-sends a double opt-in request to an address that already confirmed", async () => {
    findReminderSignupById.mockResolvedValue({
      id: ID,
      email: "jane@example.com",
      locale: "de",
      confirmed: true,
      confirmToken: "confirm-token",
      unsubscribeToken: "unsub-token",
    });

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "reminder_signups", id: ID }));

    expect(response.status).toBe(404);
    expect(dispatchReminderConfirmation).not.toHaveBeenCalled();
  });

  it("resends a reminder-window mail and marks the row sent", async () => {
    const windowMail = {
      id: ID,
      email: "jane@example.com",
      locale: "de",
      semester: "HWS26",
      windowEndsAt: "2026-09-13T23:59:00+02:00",
      unsubscribeToken: "unsub-token",
    };
    findReminderWindowMailById.mockResolvedValue(windowMail);
    dispatchReminderWindowOpen.mockResolvedValue(undefined);
    markReminderWindowMailSent.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "reminder_window_mails", id: ID }));

    expect(response.status).toBe(200);
    expect(dispatchReminderWindowOpen).toHaveBeenCalledWith(windowMail);
    expect(markReminderWindowMailSent).toHaveBeenCalledWith(ID);
    expect(markReminderWindowMailFailed).not.toHaveBeenCalled();
  });

  it("records a second reminder-window failure plainly", async () => {
    findReminderWindowMailById.mockResolvedValue({
      id: ID,
      email: "jane@example.com",
      locale: "de",
      semester: "HWS26",
      windowEndsAt: "2026-09-13T23:59:00+02:00",
      unsubscribeToken: "unsub-token",
    });
    dispatchReminderWindowOpen.mockRejectedValue(new Error("Resend is still down"));
    markReminderWindowMailFailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "reminder_window_mails", id: ID }));

    expect(response.status).toBe(502);
    expect(markReminderWindowMailFailed).toHaveBeenCalledWith(ID, "Resend is still down");
  });

  it("answers 404 without sending when the row was deleted since the page rendered", async () => {
    findApplicationById.mockResolvedValue(null);

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "applications", id: ID }));

    expect(response.status).toBe(404);
    expect(dispatchApplicationMails).not.toHaveBeenCalled();
    expect(markApplicationMailFailed).not.toHaveBeenCalled();
  });

  // The case the whole section exists for: a retry that fails again has to
  // say so, and leave the row marked failed with the newest reason — not
  // quietly report success or lose the original error.
  it("reports a second failure plainly and records the new reason on the row", async () => {
    findApplicationById.mockResolvedValue({ id: ID, email: "jane@example.com", firstName: "Jane", locale: "de" });
    dispatchApplicationMails.mockRejectedValue(new Error("Resend is still down"));
    markApplicationMailFailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "applications", id: ID }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      error: "send_failed",
      message: "Resend is still down",
    });
    expect(markApplicationMailFailed).toHaveBeenCalledWith(ID, "Resend is still down");
    expect(markApplicationMailed).not.toHaveBeenCalled();
  });

  it("still answers when recording the second failure itself fails", async () => {
    findApplicationById.mockResolvedValue({ id: ID, email: "jane@example.com", firstName: "Jane", locale: "de" });
    dispatchApplicationMails.mockRejectedValue(new Error("Resend is still down"));
    markApplicationMailFailed.mockRejectedValue(new Error("db unreachable"));

    const { POST } = await import("@/app/api/admin/mails/resend/route");
    const response = await POST(await resendRequest({ source: "applications", id: ID }));

    expect(response.status).toBe(502);
  });
});
