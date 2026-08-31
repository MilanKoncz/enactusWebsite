import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Application } from "@/lib/db";

/**
 * Same regression as lib/db.test.ts: `next build` collects route metadata
 * without running a request handler, so lib/mail.ts must not reach for
 * RESEND_API_KEY (or any of the from/reply-to addresses) at import time.
 */
describe("lib/mail module import", () => {
  const originalEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
    APPLICATION_RECIPIENT_EMAIL: process.env.APPLICATION_RECIPIENT_EMAIL,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
  });

  function clearMailEnv() {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_REPLY_TO_EMAIL;
    delete process.env.APPLICATION_RECIPIENT_EMAIL;
  }

  it("imports without throwing when no mail env vars are set", async () => {
    clearMailEnv();
    vi.resetModules();
    await expect(import("@/lib/mail")).resolves.toBeDefined();
  });

  it("only throws once a send is actually attempted, with a clear message", async () => {
    clearMailEnv();
    vi.resetModules();
    const { sendContactMessageNotification } = await import("@/lib/mail");
    await expect(
      sendContactMessageNotification({ name: "Test", email: "test@example.invalid", subject: "Hi", text: "Hi" }),
    ).rejects.toThrow(/is not set — see \.env\.example/);
  });
});

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function ResendMock() {
    return { emails: { send: sendMock } };
  }),
}));

const APPLICATION = {
  id: "11111111-1111-1111-1111-111111111111",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
} as unknown as Application;

describe("sendApplicationNotification", () => {
  const originalEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
    APPLICATION_RECIPIENT_EMAIL: process.env.APPLICATION_RECIPIENT_EMAIL,
  };

  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-api-key";
    process.env.RESEND_FROM_EMAIL = "bewerbung@enactus-mannheim.com";
    process.env.RESEND_REPLY_TO_EMAIL = "info@unimannheim.enactus.team";
    process.env.APPLICATION_RECIPIENT_EMAIL = "vorstand@unimannheim.enactus.team";
    sendMock.mockResolvedValue({ data: { id: "email-id" }, error: null });
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
    sendMock.mockReset();
  });

  it("attaches both the application PDF and the CV, and mentions the retention caveat", async () => {
    const { sendApplicationNotification } = await import("@/lib/mail");
    const pdfBuffer = Buffer.from("pdf");
    const cvAttachment = { filename: `lebenslauf-${APPLICATION.id}.pdf`, content: Buffer.from("cv") };

    await sendApplicationNotification(APPLICATION, pdfBuffer, cvAttachment);

    const call = sendMock.mock.calls[0][0];
    expect(call.attachments).toEqual([
      { filename: `bewerbung-${APPLICATION.id}.pdf`, content: pdfBuffer },
      cvAttachment,
    ]);
    expect(call.text).toMatch(/Lebenslauf liegt als zweiter Anhang bei/);
    expect(call.text).toMatch(/Löschkonzept/);
  });

  it("sends only the PDF and a not-attached note when there is no CV attachment", async () => {
    const { sendApplicationNotification } = await import("@/lib/mail");
    const pdfBuffer = Buffer.from("pdf");

    await sendApplicationNotification(APPLICATION, pdfBuffer, null);

    const call = sendMock.mock.calls[0][0];
    expect(call.attachments).toEqual([{ filename: `bewerbung-${APPLICATION.id}.pdf`, content: pdfBuffer }]);
    expect(call.text).toMatch(/konnte dieser Mail nicht beigefügt werden/);
    expect(call.text).toMatch(/\/admin\/bewerbungen/);
  });
});
