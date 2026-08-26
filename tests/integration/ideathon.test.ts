// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertIdeathonSignup = vi.fn();
const markIdeathonSignupMailed = vi.fn();
const markIdeathonSignupMailFailed = vi.fn();
const sendIdeathonSignupNotification = vi.fn();
const sendIdeathonSignupConfirmation = vi.fn();
const checkRateLimit = vi.fn();
const getCalendarEvents = vi.fn();
const checkFormToken = vi.fn();

vi.mock("@/lib/db", () => ({
  insertIdeathonSignup: (...args: unknown[]) => insertIdeathonSignup(...args),
  markIdeathonSignupMailed: (...args: unknown[]) => markIdeathonSignupMailed(...args),
  markIdeathonSignupMailFailed: (...args: unknown[]) => markIdeathonSignupMailFailed(...args),
}));

vi.mock("@/lib/mail", () => ({
  sendIdeathonSignupNotification: (...args: unknown[]) => sendIdeathonSignupNotification(...args),
  sendIdeathonSignupConfirmation: (...args: unknown[]) => sendIdeathonSignupConfirmation(...args),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("@/lib/formToken", () => ({
  checkFormToken: (...args: unknown[]) => checkFormToken(...args),
}));

// findNextIdeathonEvent (lib/ideathonEvent.ts) has its own unit tests — this
// mocks the one call the route makes to decide "is signup open", same
// reasoning as bewerbung.test.ts's getRecruitingWindows mock.
vi.mock("@/lib/calendarEvents", () => ({
  getCalendarEvents: (...args: unknown[]) => getCalendarEvents(...args),
}));
const UPCOMING_IDEATHON = {
  id: "e1",
  title: "Ideathon",
  titleEn: null,
  category: "innolab" as const,
  startDate: "2100-01-01",
  endDate: "2100-01-04",
  startTime: null,
  endTime: null,
  location: "MAFINEX, Mannheim",
  description: null,
  descriptionEn: null,
  tentative: false,
  internalLink: "/ideathon",
};

vi.mock("next-intl/server", async () => (await import("../fixtures/nextIntlServer")).nextIntlServerMock);

const STORED_SIGNUP = {
  id: "11111111-1111-1111-1111-111111111111",
  createdAt: new Date("2026-09-05T10:00:00Z"),
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  studyProgram: "BWL",
  semester: 3,
  hasIdea: false,
  ideaDescription: undefined,
  motivationExperience: undefined,
  registeringAsTeam: false,
  teamSize: undefined,
  teamMembers: undefined,
  dietaryPreference: "omnivore" as const,
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
    hasIdea: false,
    registeringAsTeam: false,
    dietaryPreference: "omnivore",
    consent: true,
    website: "",
    locale: "de",
    formToken: "test-token",
    ...overrides,
  };
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/ideathon", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ideathon", () => {
  beforeEach(() => {
    getCalendarEvents.mockResolvedValue([UPCOMING_IDEATHON]);
    checkFormToken.mockReturnValue("valid");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("persists the signup when email delivery fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertIdeathonSignup.mockResolvedValue(STORED_SIGNUP);
    sendIdeathonSignupNotification.mockRejectedValue(new Error("Resend is down"));
    markIdeathonSignupMailFailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertIdeathonSignup).toHaveBeenCalledTimes(1);
    expect(markIdeathonSignupMailFailed).toHaveBeenCalledWith(STORED_SIGNUP.id, "Resend is down");
  });

  it("sends the notification and the applicant's confirmation, then marks the signup mailed", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertIdeathonSignup.mockResolvedValue(STORED_SIGNUP);
    sendIdeathonSignupNotification.mockResolvedValue("email-id-1");
    sendIdeathonSignupConfirmation.mockResolvedValue("email-id-2");
    markIdeathonSignupMailed.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(sendIdeathonSignupNotification).toHaveBeenCalledWith(STORED_SIGNUP);
    expect(sendIdeathonSignupConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ email: STORED_SIGNUP.email, firstName: STORED_SIGNUP.firstName }),
    );
    expect(markIdeathonSignupMailed).toHaveBeenCalledWith(STORED_SIGNUP.id);
  });

  it("passes the new team member, motivation, and dietary fields through to insertIdeathonSignup", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertIdeathonSignup.mockResolvedValue(STORED_SIGNUP);
    sendIdeathonSignupNotification.mockResolvedValue("email-id-1");
    sendIdeathonSignupConfirmation.mockResolvedValue("email-id-2");

    const { POST } = await import("@/app/api/ideathon/route");
    await POST(
      postRequest(
        validPayload({
          registeringAsTeam: true,
          teamSize: 4,
          teamMembers: "Jane, John, Alex",
          motivationExperience: "Ich bringe Erfahrung aus einem Schulprojekt mit.",
          dietaryPreference: "vegan",
        }),
      ),
    );

    expect(insertIdeathonSignup).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMembers: "Jane, John, Alex",
        motivationExperience: "Ich bringe Erfahrung aus einem Schulprojekt mit.",
        dietaryPreference: "vegan",
      }),
    );
  });

  it("reports a server error and never claims success when the database write itself fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    insertIdeathonSignup.mockRejectedValue(new Error("connection reset"));

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "server_error" });
    expect(sendIdeathonSignupNotification).not.toHaveBeenCalled();
  });

  it("rejects invalid input with 400 and never writes to the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload({ email: "not-an-email" })));

    expect(response.status).toBe(400);
    expect(insertIdeathonSignup).not.toHaveBeenCalled();
  });

  it("rejects a submission missing dietaryPreference with 400", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    const { dietaryPreference: _dietaryPreference, ...payload } = validPayload();

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(payload));

    expect(response.status).toBe(400);
    expect(insertIdeathonSignup).not.toHaveBeenCalled();
  });

  it("silently accepts a honeypot-triggered submission without writing or mailing anything", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload({ website: "https://spam.example" })));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertIdeathonSignup).not.toHaveBeenCalled();
    expect(sendIdeathonSignupNotification).not.toHaveBeenCalled();
  });

  it("silently accepts a too-fast submission without writing or mailing anything", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    checkFormToken.mockReturnValue("too_fast");

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertIdeathonSignup).not.toHaveBeenCalled();
  });

  it("rejects an expired form token with a real, distinguishable error", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    checkFormToken.mockReturnValue("expired");

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "form_expired" });
    expect(insertIdeathonSignup).not.toHaveBeenCalled();
  });

  it("rejects a flood with 429 before touching the database", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(429);
    expect(insertIdeathonSignup).not.toHaveBeenCalled();
  });

  it("rejects a submission with 409 when no Ideathon is upcoming, and writes nothing", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    getCalendarEvents.mockResolvedValue([]);

    const { POST } = await import("@/app/api/ideathon/route");
    const response = await POST(postRequest(validPayload()));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: "signup_closed" });
    expect(insertIdeathonSignup).not.toHaveBeenCalled();
    expect(sendIdeathonSignupNotification).not.toHaveBeenCalled();
  });
});
