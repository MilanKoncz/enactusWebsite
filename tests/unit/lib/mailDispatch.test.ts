import { afterEach, describe, expect, it, vi } from "vitest";
import type { Application, IdeathonSignup } from "@/lib/db";

const sendApplicationNotification = vi.fn();
const sendApplicationConfirmation = vi.fn();
const sendIdeathonSignupNotification = vi.fn();
const sendIdeathonSignupConfirmation = vi.fn();
const fetchCvBlobBuffer = vi.fn();
const renderToBuffer = vi.fn();

vi.mock("@/lib/mail", () => ({
  sendApplicationNotification: (...args: unknown[]) => sendApplicationNotification(...args),
  sendApplicationConfirmation: (...args: unknown[]) => sendApplicationConfirmation(...args),
  sendIdeathonSignupNotification: (...args: unknown[]) => sendIdeathonSignupNotification(...args),
  sendIdeathonSignupConfirmation: (...args: unknown[]) => sendIdeathonSignupConfirmation(...args),
  sendContactMessageNotification: vi.fn(),
  sendReminderConfirmationEmail: vi.fn(),
  sendReminderAlreadyRegisteredEmail: vi.fn(),
  sendReminderWindowOpenEmail: vi.fn(),
}));

vi.mock("@/lib/cvBlob", () => ({
  fetchCvBlobBuffer: (...args: unknown[]) => fetchCvBlobBuffer(...args),
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: (...args: unknown[]) => renderToBuffer(...args),
}));

vi.mock("@/lib/applicationPdf", () => ({
  ApplicationPdfDocument: vi.fn(() => "pdf-document"),
}));

vi.mock("next-intl/server", async () => (await import("../../fixtures/nextIntlServer")).nextIntlServerMock);

const APPLICATION = {
  id: "app-1",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  locale: "de",
  cvPathname: undefined,
} as unknown as Application;

const IDEATHON_SIGNUP = {
  id: "signup-1",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  locale: "de",
} as unknown as IdeathonSignup;

const TEST_OVERRIDE = { to: "board@example.invalid", subjectPrefix: "[TESTVERSAND]" };

/**
 * The `parts` option added for /api/admin/mails/testversand: real
 * production callers omit it and get exactly the pre-existing behavior
 * (both halves, every time) — these tests are specifically about the new
 * selective-skip path, since the route's own integration test mocks
 * mailDispatch.ts wholesale and can't prove this function itself honors it.
 */
describe("dispatchApplicationMails parts option", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sends both halves when parts is omitted, unchanged from before this option existed", async () => {
    renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
    const { dispatchApplicationMails } = await import("@/lib/mailDispatch");

    await dispatchApplicationMails(APPLICATION);

    expect(sendApplicationNotification).toHaveBeenCalledTimes(1);
    expect(sendApplicationConfirmation).toHaveBeenCalledTimes(1);
  });

  it("sends only the notification when confirmation is turned off", async () => {
    renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
    const { dispatchApplicationMails } = await import("@/lib/mailDispatch");

    await dispatchApplicationMails(APPLICATION, { parts: { notification: true, confirmation: false } });

    expect(sendApplicationNotification).toHaveBeenCalledTimes(1);
    expect(sendApplicationConfirmation).not.toHaveBeenCalled();
  });

  it("sends only the confirmation when notification is turned off — no PDF is even rendered", async () => {
    const { dispatchApplicationMails } = await import("@/lib/mailDispatch");

    await dispatchApplicationMails(APPLICATION, { parts: { notification: false, confirmation: true } });

    expect(sendApplicationNotification).not.toHaveBeenCalled();
    expect(renderToBuffer).not.toHaveBeenCalled();
    expect(sendApplicationConfirmation).toHaveBeenCalledTimes(1);
  });

  it("forwards testOverride to whichever half actually runs", async () => {
    renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
    const { dispatchApplicationMails } = await import("@/lib/mailDispatch");

    await dispatchApplicationMails(APPLICATION, {
      parts: { notification: true, confirmation: false },
      testOverride: TEST_OVERRIDE,
    });

    expect(sendApplicationNotification).toHaveBeenCalledWith(
      APPLICATION,
      expect.any(Buffer),
      null,
      TEST_OVERRIDE,
    );
  });
});

describe("dispatchIdeathonSignupMails parts option", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sends both halves when parts is omitted", async () => {
    const { dispatchIdeathonSignupMails } = await import("@/lib/mailDispatch");

    await dispatchIdeathonSignupMails(IDEATHON_SIGNUP);

    expect(sendIdeathonSignupNotification).toHaveBeenCalledTimes(1);
    expect(sendIdeathonSignupConfirmation).toHaveBeenCalledTimes(1);
  });

  it("sends only the notification when confirmation is turned off", async () => {
    const { dispatchIdeathonSignupMails } = await import("@/lib/mailDispatch");

    await dispatchIdeathonSignupMails(IDEATHON_SIGNUP, { parts: { notification: true, confirmation: false } });

    expect(sendIdeathonSignupNotification).toHaveBeenCalledTimes(1);
    expect(sendIdeathonSignupConfirmation).not.toHaveBeenCalled();
  });

  it("sends only the confirmation when notification is turned off", async () => {
    const { dispatchIdeathonSignupMails } = await import("@/lib/mailDispatch");

    await dispatchIdeathonSignupMails(IDEATHON_SIGNUP, { parts: { notification: false, confirmation: true } });

    expect(sendIdeathonSignupNotification).not.toHaveBeenCalled();
    expect(sendIdeathonSignupConfirmation).toHaveBeenCalledTimes(1);
  });

  it("forwards testOverride to whichever half actually runs", async () => {
    const { dispatchIdeathonSignupMails } = await import("@/lib/mailDispatch");

    await dispatchIdeathonSignupMails(IDEATHON_SIGNUP, {
      parts: { notification: false, confirmation: true },
      testOverride: TEST_OVERRIDE,
    });

    expect(sendIdeathonSignupConfirmation).toHaveBeenCalledWith(expect.anything(), TEST_OVERRIDE);
  });
});
