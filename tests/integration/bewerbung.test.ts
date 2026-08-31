// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertApplication = vi.fn();
const markApplicationMailed = vi.fn();
const markApplicationMailFailed = vi.fn();
const sendApplicationNotification = vi.fn();
const sendApplicationConfirmation = vi.fn();
const checkRateLimit = vi.fn();
const renderToBuffer = vi.fn();
const getRecruitingWindows = vi.fn();
const checkFormToken = vi.fn();
const verifyUploadedPdf = vi.fn();
const fetchCvBlobBuffer = vi.fn();

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

// The route only ever sees checkFormToken's return value, never the token
// string itself — the real signing/verification logic has its own unit
// tests (tests/unit/lib/formToken.test.ts), so this mock just drives the
// route's branching.
vi.mock("@/lib/formToken", () => ({
  checkFormToken: (...args: unknown[]) => checkFormToken(...args),
}));

// isCvPathname is real (a pure prefix check, no reason to mock) —
// verifyUploadedPdf and fetchCvBlobBuffer are the two calls that would
// otherwise reach Vercel Blob.
vi.mock("@/lib/cvBlob", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cvBlob")>();
  return {
    ...actual,
    verifyUploadedPdf: (...args: unknown[]) => verifyUploadedPdf(...args),
    fetchCvBlobBuffer: (...args: unknown[]) => fetchCvBlobBuffer(...args),
  };
});

// A window spanning far past to far future — every test below runs at the
// real current time, and none of them are testing the window-open gate
// (tests/integration/bewerbung-window.test.ts covers that), so this just
// needs to always contain "now" and always resolve to the semester label
// STORED_APPLICATION expects.
vi.mock("@/lib/recruitingWindows", () => ({
  getRecruitingWindows: (...args: unknown[]) => getRecruitingWindows(...args),
}));
const OPEN_WINDOW = { semester: "HWS26", start: "2000-01-01T00:00:00+00:00", end: "2100-01-01T00:00:00+00:00" };

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
  priorInvolvement: undefined,
  languagesSkills: undefined,
  wantToGain: undefined,
  motivation: "Ich möchte gerne aktiv mitarbeiten und Verantwortung übernehmen.",
  desiredAreas: undefined,
  areaChoices: [{ priority: 1, areaLabel: "SmileGreen", reason: "Weil ich dort am meisten bewirken kann." }],
  availabilityHours: 10,
  heardAboutUs: undefined,
  consentAt: new Date("2026-09-05T10:00:00Z"),
  locale: "de" as const,
  mailStatus: "pending" as const,
  mailError: null,
  mailedAt: null,
  recruitingSemester: "HWS26",
  retainUntil: new Date("2027-01-01T00:00:00Z"),
  cvBlobUrl: "https://example-store.private.blob.vercel-storage.com/bewerbungen/lebenslauf-abc123.pdf",
  cvPathname: "bewerbungen/lebenslauf-abc123.pdf",
  cvOriginalFilename: "Lebenslauf Jane Doe.pdf",
  cvSizeBytes: 123456,
};

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    studyProgram: "BWL",
    semester: 3,
    motivation: "Ich möchte gerne aktiv mitarbeiten und Verantwortung übernehmen.",
    area1: "SmileGreen",
    area1Reason: "Weil ich dort am meisten bewirken kann.",
    availabilityHours: 10,
    consent: true,
    website: "",
    locale: "de",
    formToken: "test-token",
    cvBlobUrl: "https://example-store.private.blob.vercel-storage.com/bewerbungen/lebenslauf-abc123.pdf",
    cvPathname: "bewerbungen/lebenslauf-abc123.pdf",
    cvOriginalFilename: "Lebenslauf Jane Doe.pdf",
    cvSizeBytes: 123456,
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
  beforeEach(() => {
    getRecruitingWindows.mockResolvedValue([OPEN_WINDOW]);
    checkFormToken.mockReturnValue("valid");
    verifyUploadedPdf.mockResolvedValue(true);
    fetchCvBlobBuffer.mockResolvedValue({ buffer: Buffer.from("%PDF-1.4 cv"), contentType: "application/pdf" });
  });

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
    expect(sendApplicationNotification).toHaveBeenCalledWith(STORED_APPLICATION, expect.any(Buffer), {
      filename: `lebenslauf-${STORED_APPLICATION.id}.pdf`,
      content: Buffer.from("%PDF-1.4 cv"),
    });
    expect(sendApplicationConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ email: STORED_APPLICATION.email, firstName: STORED_APPLICATION.firstName }),
    );
    expect(markApplicationMailed).toHaveBeenCalledWith(STORED_APPLICATION.id);
  });

  // The load-bearing case for the "an application can never fail on the CV
  // attachment" contract (docs/engineering.md): the CV blob is unreachable
  // (retain_until already deleted it, or Vercel Blob simply errors), but the
  // board notification — with the application PDF — must still go out, and
  // the applicant's own confirmation must still be sent. mail.ts's own text
  // covers telling the board where to find the CV instead.
  it("still sends the notification, degraded, when the CV blob can't be fetched", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertApplication.mockResolvedValue(STORED_APPLICATION);
    renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
    fetchCvBlobBuffer.mockRejectedValue(new Error("blob not found"));
    sendApplicationNotification.mockResolvedValue("email-id-1");
    sendApplicationConfirmation.mockResolvedValue("email-id-2");
    markApplicationMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sendApplicationNotification).toHaveBeenCalledWith(STORED_APPLICATION, expect.any(Buffer), null);
    expect(sendApplicationConfirmation).toHaveBeenCalled();
    expect(markApplicationMailed).toHaveBeenCalledWith(STORED_APPLICATION.id);
  });

  it("never tries to fetch a CV blob for an application that never had one", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertApplication.mockResolvedValue({ ...STORED_APPLICATION, cvPathname: undefined });
    renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
    sendApplicationNotification.mockResolvedValue("email-id-1");
    sendApplicationConfirmation.mockResolvedValue("email-id-2");
    markApplicationMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(fetchCvBlobBuffer).not.toHaveBeenCalled();
    expect(sendApplicationNotification).toHaveBeenCalledWith(
      { ...STORED_APPLICATION, cvPathname: undefined },
      expect.any(Buffer),
      null,
    );
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

  it("rejects a submission missing the required first-choice area", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload({ area1: "", area1Reason: "" })));

    expect(response.status).toBe(400);
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("rejects a submission with no CV attached, since CV_REQUIRED is true", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(
      postRequest(
        validPayload({ cvBlobUrl: undefined, cvPathname: undefined, cvOriginalFilename: undefined, cvSizeBytes: undefined }),
      ),
    );

    expect(response.status).toBe(400);
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("rejects a submission whose uploaded file fails the magic-byte check, without writing anything", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    verifyUploadedPdf.mockResolvedValue(false);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "cv_invalid" });
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("rejects a CV pathname outside bewerbungen/, without writing anything", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload({ cvPathname: "anders/lebenslauf.pdf" })));

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
    checkFormToken.mockReturnValue("too_fast");

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("silently accepts a submission with a missing or tampered form token", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    checkFormToken.mockReturnValue("invalid");

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("rejects an expired form token with a real, distinguishable error", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    checkFormToken.mockReturnValue("expired");

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "form_expired" });
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("rejects a flood with 429 before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(429);
    expect(insertApplication).not.toHaveBeenCalled();
  });

  it("rejects a submission with 409 when no recruiting window is open, and writes nothing", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    getRecruitingWindows.mockResolvedValue([
      { semester: "HWS20", start: "2020-01-01T00:00:00+00:00", end: "2020-01-14T00:00:00+00:00" },
    ]);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: "window_closed" });
    expect(insertApplication).not.toHaveBeenCalled();
    expect(sendApplicationNotification).not.toHaveBeenCalled();
  });

  it("rejects a submission with 409 when no window is scheduled at all", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    getRecruitingWindows.mockResolvedValue([]);

    const { POST } = await import("@/app/api/bewerbung/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(409);
    expect(insertApplication).not.toHaveBeenCalled();
  });
});
