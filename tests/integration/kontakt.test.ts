// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertContactMessage = vi.fn();
const markContactMessageMailed = vi.fn();
const markContactMessageMailFailed = vi.fn();
const sendContactMessageNotification = vi.fn();
const checkRateLimit = vi.fn();

vi.mock("@/lib/db", () => ({
  insertContactMessage: (...args: unknown[]) => insertContactMessage(...args),
  markContactMessageMailed: (...args: unknown[]) => markContactMessageMailed(...args),
  markContactMessageMailFailed: (...args: unknown[]) => markContactMessageMailFailed(...args),
}));

vi.mock("@/lib/mail", () => ({
  sendContactMessageNotification: (...args: unknown[]) => sendContactMessageNotification(...args),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("next-intl/server", async () => (await import("../fixtures/nextIntlServer")).nextIntlServerMock);

const STORED_MESSAGE = {
  id: "22222222-2222-2222-2222-222222222222",
  createdAt: new Date("2026-08-16T10:00:00Z"),
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Frage zur Bewerbung",
  message: "Wir würden gerne mit euch sprechen.",
  locale: "de" as const,
};

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    subject: "Frage zur Bewerbung",
    message: "Wir würden gerne mit euch sprechen.",
    locale: "de",
    ...overrides,
  };
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/kontakt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/kontakt", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("persists the message when forwarding it by email fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertContactMessage.mockResolvedValue(STORED_MESSAGE);
    sendContactMessageNotification.mockRejectedValue(new Error("Resend is down"));
    markContactMessageMailFailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/kontakt/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertContactMessage).toHaveBeenCalledTimes(1);
    expect(markContactMessageMailFailed).toHaveBeenCalledWith(STORED_MESSAGE.id, "Resend is down");
  });

  it("forwards the message and marks it mailed on success", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertContactMessage.mockResolvedValue(STORED_MESSAGE);
    sendContactMessageNotification.mockResolvedValue("email-id");
    markContactMessageMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/kontakt/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(sendContactMessageNotification).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Jane Doe", email: "jane@example.com" }),
    );
    expect(markContactMessageMailed).toHaveBeenCalledWith(STORED_MESSAGE.id);
  });

  it("reports a server error and never claims success when the database write fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertContactMessage.mockRejectedValue(new Error("connection reset"));

    const { POST } = await import("@/app/api/kontakt/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(500);
    expect(sendContactMessageNotification).not.toHaveBeenCalled();
  });

  it("rejects invalid input with 400 and never writes to the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/kontakt/route");
    const response = await POST(postRequest(validPayload({ message: "too short" })));

    expect(response.status).toBe(400);
    expect(insertContactMessage).not.toHaveBeenCalled();
  });

  it("rejects a flood with 429 before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { POST } = await import("@/app/api/kontakt/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(429);
    expect(insertContactMessage).not.toHaveBeenCalled();
  });
});
