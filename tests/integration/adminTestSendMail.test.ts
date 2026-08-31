// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dispatchApplicationMails = vi.fn();
const dispatchContactNotification = vi.fn();
const dispatchIdeathonSignupMails = vi.fn();
const dispatchReminderAlreadyRegistered = vi.fn();
const dispatchReminderConfirmation = vi.fn();
const dispatchReminderWindowOpen = vi.fn();
const sendInsertFailureAlert = vi.fn();
const putTestCvBlob = vi.fn();
const deleteCvBlobs = vi.fn();
const renderToBuffer = vi.fn();

vi.mock("@/lib/mailDispatch", () => ({
  dispatchApplicationMails: (...args: unknown[]) => dispatchApplicationMails(...args),
  dispatchContactNotification: (...args: unknown[]) => dispatchContactNotification(...args),
  dispatchIdeathonSignupMails: (...args: unknown[]) => dispatchIdeathonSignupMails(...args),
  dispatchReminderAlreadyRegistered: (...args: unknown[]) => dispatchReminderAlreadyRegistered(...args),
  dispatchReminderConfirmation: (...args: unknown[]) => dispatchReminderConfirmation(...args),
  dispatchReminderWindowOpen: (...args: unknown[]) => dispatchReminderWindowOpen(...args),
}));

vi.mock("@/lib/mail", () => ({
  sendInsertFailureAlert: (...args: unknown[]) => sendInsertFailureAlert(...args),
}));

vi.mock("@/lib/cvBlob", () => ({
  putTestCvBlob: (...args: unknown[]) => putTestCvBlob(...args),
  deleteCvBlobs: (...args: unknown[]) => deleteCvBlobs(...args),
}));

vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
  return { ...actual, renderToBuffer: (...args: unknown[]) => renderToBuffer(...args) };
});

const ORIGINAL_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const TO = "vorstand@example.invalid";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "a-signing-secret-for-testversand-tests";
  renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
  putTestCvBlob.mockResolvedValue(undefined);
  deleteCvBlobs.mockResolvedValue(undefined);
  dispatchApplicationMails.mockResolvedValue(undefined);
  dispatchContactNotification.mockResolvedValue(undefined);
  dispatchIdeathonSignupMails.mockResolvedValue(undefined);
  dispatchReminderAlreadyRegistered.mockResolvedValue(undefined);
  dispatchReminderConfirmation.mockResolvedValue(undefined);
  dispatchReminderWindowOpen.mockResolvedValue(undefined);
  sendInsertFailureAlert.mockResolvedValue("mail-id");
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

async function postRequest(body: unknown, withSession = true) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (withSession) headers.cookie = await sessionCookie();
  return new NextRequest("http://localhost/api/admin/mails/testversand", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// This route never imports @/lib/db (verified statically, not just by
// omitting it from the mocks below) — the entire point of the "board can
// self-serve after a copy change" design is that nothing here can leave a
// row in a real table. See the route's own comment.
describe("POST /api/admin/mails/testversand", () => {
  it("rejects a request with no session without sending anything", async () => {
    const { POST } = await import("@/app/api/admin/mails/testversand/route");
    const response = await POST(await postRequest({ to: TO }, false));

    expect(response.status).toBe(401);
    expect(dispatchApplicationMails).not.toHaveBeenCalled();
    expect(sendInsertFailureAlert).not.toHaveBeenCalled();
  });

  it("rejects a non-email address without sending anything", async () => {
    const { POST } = await import("@/app/api/admin/mails/testversand/route");
    const response = await POST(await postRequest({ to: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(dispatchApplicationMails).not.toHaveBeenCalled();
  });

  it("sends all ten templates, each redirected to the given address with the [TESTVERSAND] subject prefix", async () => {
    const { POST } = await import("@/app/api/admin/mails/testversand/route");
    const response = await POST(await postRequest({ to: TO }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.results).toHaveLength(10);
    expect(body.results.every((r: { ok: boolean }) => r.ok)).toBe(true);

    const testOverride = { to: TO, subjectPrefix: "[TESTVERSAND]" };

    // Notification-only calls (parts.confirmation: false) for the two
    // application variants and the Ideathon notification.
    expect(dispatchApplicationMails).toHaveBeenCalledTimes(3);
    expect(dispatchApplicationMails).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ email: TO, cvPathname: expect.any(String) }),
      { parts: { notification: true, confirmation: false }, testOverride },
    );
    const secondCallApplication = dispatchApplicationMails.mock.calls[1][0];
    expect(secondCallApplication).toMatchObject({ email: TO });
    expect(secondCallApplication).not.toHaveProperty("cvPathname");
    expect(dispatchApplicationMails).toHaveBeenNthCalledWith(
      2,
      secondCallApplication,
      { parts: { notification: true, confirmation: false }, testOverride },
    );
    expect(dispatchApplicationMails).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ email: TO }),
      { parts: { notification: false, confirmation: true }, testOverride },
    );

    expect(dispatchIdeathonSignupMails).toHaveBeenCalledTimes(2);
    expect(dispatchIdeathonSignupMails).toHaveBeenNthCalledWith(1, expect.objectContaining({ email: TO }), {
      parts: { notification: true, confirmation: false },
      testOverride,
    });
    expect(dispatchIdeathonSignupMails).toHaveBeenNthCalledWith(2, expect.objectContaining({ email: TO }), {
      parts: { notification: false, confirmation: true },
      testOverride,
    });

    expect(dispatchReminderConfirmation).toHaveBeenCalledWith(expect.objectContaining({ email: TO }), testOverride);
    expect(dispatchReminderAlreadyRegistered).toHaveBeenCalledWith(
      expect.objectContaining({ email: TO }),
      testOverride,
    );
    expect(dispatchReminderWindowOpen).toHaveBeenCalledWith(expect.objectContaining({ email: TO }), testOverride);
    expect(dispatchContactNotification).toHaveBeenCalledWith(expect.objectContaining({ email: TO }), testOverride);
    expect(sendInsertFailureAlert).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      testOverride,
    );
  });

  it("uploads a real throwaway CV blob and deletes it again after every send", async () => {
    const { POST } = await import("@/app/api/admin/mails/testversand/route");
    await POST(await postRequest({ to: TO }));

    expect(putTestCvBlob).toHaveBeenCalledWith(expect.stringMatching(/^bewerbungen\//), expect.any(Buffer));
    expect(deleteCvBlobs).toHaveBeenCalledWith([expect.stringMatching(/^bewerbungen\//)]);
    // The delete must happen after every send attempt, not interleaved.
    const lastSendCallOrder = Math.max(
      ...dispatchApplicationMails.mock.invocationCallOrder,
      ...sendInsertFailureAlert.mock.invocationCallOrder,
    );
    expect(deleteCvBlobs.mock.invocationCallOrder[0]).toBeGreaterThan(lastSendCallOrder);
  });

  it("still sends all ten, without a CV attached, when the throwaway upload itself fails", async () => {
    putTestCvBlob.mockRejectedValue(new Error("blob store unreachable"));
    const { POST } = await import("@/app/api/admin/mails/testversand/route");
    const response = await POST(await postRequest({ to: TO }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results.every((r: { ok: boolean }) => r.ok)).toBe(true);
    expect(dispatchApplicationMails.mock.calls[0][0]).not.toHaveProperty("cvPathname");
    // Nothing to clean up if nothing was ever uploaded.
    expect(deleteCvBlobs).not.toHaveBeenCalled();
  });

  it("reports one template's failure without aborting the other nine", async () => {
    dispatchContactNotification.mockRejectedValue(new Error("Resend is down"));
    const { POST } = await import("@/app/api/admin/mails/testversand/route");
    const response = await POST(await postRequest({ to: TO }));

    expect(response.status).toBe(200);
    const body = await response.json();
    const contactResult = body.results.find((r: { key: string }) => r.key === "contactNotification");
    expect(contactResult).toMatchObject({ ok: false, error: "Resend is down" });
    expect(body.results.filter((r: { ok: boolean }) => r.ok)).toHaveLength(9);
    // The one failure didn't stop the rest from being attempted.
    expect(sendInsertFailureAlert).toHaveBeenCalled();
    expect(dispatchReminderWindowOpen).toHaveBeenCalled();
  });
});
