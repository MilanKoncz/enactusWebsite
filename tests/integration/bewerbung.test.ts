// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MIN_FILL_MS } from "@/lib/antiSpam";

const insertApplication = vi.fn();
const markApplicationMailed = vi.fn();
const markApplicationMailFailed = vi.fn();
const sendApplicationNotification = vi.fn();
const sendApplicationConfirmation = vi.fn();
const checkRateLimit = vi.fn();
const renderToBuffer = vi.fn();

vi.mock("@/lib/db", () => ({
  insertApplication: (...args: unknown[]) => insertApplication(...args),
  markApplicationMailed: (...args: unknown[]) => markApplicationMailed(...args),
  markApplicationMailFailed: (...args: unknown[]) => markApplicationMailFailed(...args),
}));

vi.mock("@/lib/mail", () => ({
  sendApplicationNotification: (...args: unknown[]) => sendApplicationNotification(...args),
  sendApplicationConfirmation: (...args: unknown[]) => sendApplicationConfirmation(...args),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
  return { ...actual, renderToBuffer: (...args: unknown[]) => renderToBuffer(...args) };
});

vi.mock("next-intl/server", async () => (await import("../fixtures/nextIntlServer")).nextIntlServerMock);

const STORED_APPLICATION = {
  id: "11111111-1111-1111-1111-111111111111",
  createdAt: new Date("2026-09-05T10:00:00Z"),
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  studyProgram: "BWL",
  semester: 3,
  university: "Universität Mannheim",
  priorInvolvement: undefined,
  languagesSkills: undefined,
  motivation: "Ich möchte gerne aktiv mitarbeiten und Verantwortung übernehmen.",
  desiredAreas: ["SmileGreen"],
  availabilityHours: 10,
  heardAboutUs: undefined,
  consentAt: new Date("2026-09-05T10:00:00Z"),
  locale: "de" as const,
  mailStatus: "pending" as const,
  mailError: null,
  mailedAt: null,
};

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    studyProgram: "BWL",
    semester: 3,
    university: "Universität Mannheim",
    motivation: "Ich möchte gerne aktiv mitarbeiten und Verantwortung übernehmen.",
    desiredAreas: ["SmileGreen"],
    availabilityHours: 10,
    consent: true,
    website: "",
    locale: "de",
    formRenderedAt: Date.now() - MIN_FILL_MS - 1000,
    ...overrides,
  };
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bewerbung", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/bewerbung", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("persists the application when email delivery fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertApplication.mockResolvedValue(STORED_APPLICATION);
    renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
    sendApplicationNotification.mockRejectedValue(new Error("Resend is down"));
    markApplicationMailFailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertApplication).toHaveBeenCalledTimes(1);
    expect(markApplicationMailFailed).toHaveBeenCalledWith(STORED_APPLICATION.id, "Resend is down");
  });

  it("persists the application when PDF rendering fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertApplication.mockResolvedValue(STORED_APPLICATION);
    renderToBuffer.mockRejectedValue(new Error("PDF renderer crashed"));
    markApplicationMailFailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertApplication).toHaveBeenCalledTimes(1);
    expect(sendApplicationNotification).not.toHaveBeenCalled();
    expect(markApplicationMailFailed).toHaveBeenCalledWith(STORED_APPLICATION.id, "PDF renderer crashed");
  });

  it("sends the notification and the applicant's confirmation, then marks the application mailed", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertApplication.mockResolvedValue(STORED_APPLICATION);
    renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
    sendApplicationNotification.mockResolvedValue("email-id-1");
    sendApplicationConfirmation.mockResolvedValue("email-id-2");
    markApplicationMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(sendApplicationNotification).toHaveBeenCalledWith(STORED_APPLICATION, expect.any(Buffer));
    expect(sendApplicationConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ email: STORED_APPLICATION.email, firstName: STORED_APPLICATION.firstName }),
    );
    expect(markApplicationMailed).toHaveBeenCalledWith(STORED_APPLICATION.id);
  });

  it("reports a server error and never claims success when the database write itself fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertApplication.mockRejectedValue(new Error("connection reset"));

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "server_error" });
    expect(sendApplicationNotification).not.toHaveBeenCalled();
  });

  it("rejects invalid input with 400 and never writes to the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload({ email: "not-an-email" })));

    expect(response.status).toBe(400);
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("silently accepts a honeypot-triggered submission without writing or mailing anything", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload({ website: "https://spam.example" })));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertApplication).not.toHaveBeenCalled();
    expect(sendApplicationNotification).not.toHaveBeenCalled();
  });

  it("silently accepts a too-fast submission without writing or mailing anything", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload({ formRenderedAt: Date.now() })));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("rejects a flood with 429 before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(429);
    expect(insertApplication).not.toHaveBeenCalled();
  });
});
