// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const upsertReminderSignup = vi.fn();
const confirmReminderSignup = vi.fn();
const unsubscribeReminder = vi.fn();
const findConfirmedReminderSignups = vi.fn();
const markReminderMailed = vi.fn();
const markReminderMailFailed = vi.fn();
const sendReminderConfirmationEmail = vi.fn();
const checkRateLimit = vi.fn();
const generateToken = vi.fn();

vi.mock("@/lib/db", () => ({
  upsertReminderSignup: (...args: unknown[]) => upsertReminderSignup(...args),
  confirmReminderSignup: (...args: unknown[]) => confirmReminderSignup(...args),
  unsubscribeReminder: (...args: unknown[]) => unsubscribeReminder(...args),
  findConfirmedReminderSignups: (...args: unknown[]) => findConfirmedReminderSignups(...args),
  markReminderMailed: (...args: unknown[]) => markReminderMailed(...args),
  markReminderMailFailed: (...args: unknown[]) => markReminderMailFailed(...args),
}));

vi.mock("@/lib/mail", () => ({
  sendReminderConfirmationEmail: (...args: unknown[]) => sendReminderConfirmationEmail(...args),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("@/lib/tokens", () => ({
  generateToken: (...args: unknown[]) => generateToken(...args),
}));

vi.mock("next-intl/server", async () => (await import("../fixtures/nextIntlServer")).nextIntlServerMock);

function postSignup(body: unknown) {
  return new NextRequest("http://localhost/api/reminder", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getConfirm(token: string | null) {
  const url = token
    ? `http://localhost/api/reminder/bestaetigen?token=${token}`
    : "http://localhost/api/reminder/bestaetigen";
  return new NextRequest(url);
}

function getUnsubscribe(token: string | null) {
  const url = token
    ? `http://localhost/api/reminder/abmelden?token=${token}`
    : "http://localhost/api/reminder/abmelden";
  return new NextRequest(url);
}

function postUnsubscribe(token: string | null) {
  const url = token
    ? `http://localhost/api/reminder/abmelden?token=${token}`
    : "http://localhost/api/reminder/abmelden";
  return new NextRequest(url, { method: "POST" });
}

describe("POST /api/reminder", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("writes an unconfirmed row and emails a confirmation link for a new signup", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    generateToken.mockReturnValueOnce("confirm-token").mockReturnValueOnce("unsub-token");
    upsertReminderSignup.mockResolvedValue({
      id: "signup-1",
      confirmed: false,
      confirmToken: "confirm-token",
      unsubscribeToken: "unsub-token",
    });
    sendReminderConfirmationEmail.mockResolvedValue("email-id");

    const { POST } = await import("@/app/api/reminder/route");
    const response = await POST(postSignup({ email: "jane@example.com", consent: true, locale: "de" }));

    expect(response.status).toBe(200);
    expect(upsertReminderSignup).toHaveBeenCalledWith("jane@example.com", "confirm-token", "unsub-token", "de");
    expect(sendReminderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@example.com",
        unsubscribeUrl: expect.stringContaining("token=unsub-token"),
      }),
    );
  });

  it("sends no second confirmation email for an address that's already confirmed", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    generateToken.mockReturnValue("ignored-token");
    upsertReminderSignup.mockResolvedValue({
      id: "signup-1",
      confirmed: true,
      confirmToken: "old-token",
      unsubscribeToken: "old-unsub-token",
    });

    const { POST } = await import("@/app/api/reminder/route");
    const response = await POST(postSignup({ email: "jane@example.com", consent: true, locale: "de" }));

    expect(response.status).toBe(200);
    expect(sendReminderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("still reports success when the write succeeds but the confirmation email fails to send", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    generateToken.mockReturnValue("token");
    upsertReminderSignup.mockResolvedValue({
      id: "signup-1",
      confirmed: false,
      confirmToken: "token",
      unsubscribeToken: "unsub-token",
    });
    sendReminderConfirmationEmail.mockRejectedValue(new Error("Resend is down"));
    markReminderMailFailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/reminder/route");
    const response = await POST(postSignup({ email: "jane@example.com", consent: true, locale: "de" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    // Recorded on the row, not only logged — that's what makes the signup
    // show up in /admin/mails instead of vanishing into a console nobody
    // reads.
    expect(markReminderMailFailed).toHaveBeenCalledWith("signup-1", "Resend is down");
  });

  it("records a successful confirmation send on the row", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    generateToken.mockReturnValue("token");
    upsertReminderSignup.mockResolvedValue({
      id: "signup-1",
      confirmed: false,
      confirmToken: "token",
      unsubscribeToken: "unsub-token",
    });
    sendReminderConfirmationEmail.mockResolvedValue("email-id");
    markReminderMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/reminder/route");
    await POST(postSignup({ email: "jane@example.com", consent: true, locale: "de" }));

    expect(markReminderMailed).toHaveBeenCalledWith("signup-1");
    expect(markReminderMailFailed).not.toHaveBeenCalled();
  });

  it("rejects a flood with 429 before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { POST } = await import("@/app/api/reminder/route");
    const response = await POST(postSignup({ email: "jane@example.com", consent: true, locale: "de" }));

    expect(response.status).toBe(429);
    expect(upsertReminderSignup).not.toHaveBeenCalled();
  });

  it("rejects a signup without consent", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/reminder/route");
    const response = await POST(postSignup({ email: "jane@example.com", consent: false, locale: "de" }));

    expect(response.status).toBe(400);
    expect(upsertReminderSignup).not.toHaveBeenCalled();
  });
});

describe("GET /api/reminder/bestaetigen", () => {
  beforeEach(() => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("confirms a valid token and redirects to the real confirmation page with a confirmed status", async () => {
    confirmReminderSignup.mockResolvedValue({ status: "confirmed", id: "1", email: "jane@example.com", locale: "en" });

    const { GET } = await import("@/app/api/reminder/bestaetigen/route");
    const response = await GET(getConfirm("good-token"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/en/erinnerung-status?status=confirmed");
  });

  it("shows already-confirmed, not a generic error, when the same token is clicked a second time", async () => {
    confirmReminderSignup.mockResolvedValueOnce({ status: "confirmed", id: "1", email: "jane@example.com", locale: "de" });
    confirmReminderSignup.mockResolvedValueOnce({ status: "already-confirmed", locale: "de" });

    const { GET } = await import("@/app/api/reminder/bestaetigen/route");
    await GET(getConfirm("good-token"));
    const second = await GET(getConfirm("good-token"));

    expect(second.headers.get("location")).toContain("/erinnerung-status?status=already-confirmed");
  });

  it("redirects with an invalid status for a missing or unknown token", async () => {
    const { GET } = await import("@/app/api/reminder/bestaetigen/route");

    const missing = await GET(getConfirm(null));
    expect(missing.headers.get("location")).toContain("status=invalid");

    confirmReminderSignup.mockResolvedValue({ status: "invalid" });
    const unknown = await GET(getConfirm("bad-token"));
    expect(unknown.headers.get("location")).toContain("status=invalid");
  });

  it("rejects a flood with an invalid-status redirect before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { GET } = await import("@/app/api/reminder/bestaetigen/route");
    const response = await GET(getConfirm("good-token"));

    expect(response.headers.get("location")).toContain("status=invalid");
    expect(confirmReminderSignup).not.toHaveBeenCalled();
  });
});

describe("/api/reminder/abmelden", () => {
  beforeEach(() => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("GET redirects to the real confirmation page with an unsubscribed status on a valid token", async () => {
    unsubscribeReminder.mockResolvedValue({ status: "unsubscribed", locale: "de" });

    const { GET } = await import("@/app/api/reminder/abmelden/route");
    const response = await GET(getUnsubscribe("good-token"));

    expect(response.headers.get("location")).toContain("/erinnerung-status?status=unsubscribed");
  });

  it("GET redirects with an invalid status for a missing or unknown token", async () => {
    const { GET } = await import("@/app/api/reminder/abmelden/route");

    const missing = await GET(getUnsubscribe(null));
    expect(missing.headers.get("location")).toContain("status=invalid");

    unsubscribeReminder.mockResolvedValue({ status: "invalid" });
    const unknown = await GET(getUnsubscribe("bad-token"));
    expect(unknown.headers.get("location")).toContain("status=invalid");
  });

  it("GET rejects a flood with an invalid-status redirect before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { GET } = await import("@/app/api/reminder/abmelden/route");
    const response = await GET(getUnsubscribe("good-token"));

    expect(response.headers.get("location")).toContain("status=invalid");
    expect(unsubscribeReminder).not.toHaveBeenCalled();
  });

  it("POST answers a bare 200 for a one-click unsubscribe, per RFC 8058", async () => {
    unsubscribeReminder.mockResolvedValue({ status: "unsubscribed", locale: "de" });

    const { POST } = await import("@/app/api/reminder/abmelden/route");
    const response = await POST(postUnsubscribe("good-token"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("POST answers 404 for an unknown token without touching a redirect", async () => {
    unsubscribeReminder.mockResolvedValue({ status: "invalid" });

    const { POST } = await import("@/app/api/reminder/abmelden/route");
    const response = await POST(postUnsubscribe("bad-token"));

    expect(response.status).toBe(404);
  });

  it("POST rejects a flood with 429 before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { POST } = await import("@/app/api/reminder/abmelden/route");
    const response = await POST(postUnsubscribe("good-token"));

    expect(response.status).toBe(429);
    expect(unsubscribeReminder).not.toHaveBeenCalled();
  });
});
