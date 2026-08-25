// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const deleteExpiredApplications = vi.fn();
const deleteExpiredContactMessages = vi.fn();
const deleteExpiredReminderSignups = vi.fn();
const deleteExpiredJobPostings = vi.fn();
const deleteExpiredIdeathonSignups = vi.fn();
const pruneRateLimitHits = vi.fn();
const startCronRun = vi.fn();
const finishCronRun = vi.fn();
const findRecruitingWindowsNeedingReminderMail = vi.fn();

const sendReminderWindowMailsForWindow = vi.fn();

vi.mock("@/lib/db", () => ({
  deleteExpiredApplications: (...args: unknown[]) => deleteExpiredApplications(...args),
  deleteExpiredContactMessages: (...args: unknown[]) => deleteExpiredContactMessages(...args),
  deleteExpiredReminderSignups: (...args: unknown[]) => deleteExpiredReminderSignups(...args),
  deleteExpiredJobPostings: (...args: unknown[]) => deleteExpiredJobPostings(...args),
  deleteExpiredIdeathonSignups: (...args: unknown[]) => deleteExpiredIdeathonSignups(...args),
  pruneRateLimitHits: (...args: unknown[]) => pruneRateLimitHits(...args),
  startCronRun: (...args: unknown[]) => startCronRun(...args),
  finishCronRun: (...args: unknown[]) => finishCronRun(...args),
  findRecruitingWindowsNeedingReminderMail: (...args: unknown[]) => findRecruitingWindowsNeedingReminderMail(...args),
}));

// The reminder-window job's own send/claim logic (idempotency, batching) is
// covered by tests/unit/lib/reminderWindowMail.test.ts — this file only
// needs to prove the route wires the two jobs together correctly and
// independently, so sendReminderWindowMailsForWindow is a plain stub here.
vi.mock("@/lib/reminderWindowMail", () => ({
  sendReminderWindowMailsForWindow: (...args: unknown[]) => sendReminderWindowMailsForWindow(...args),
}));

function request(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/cleanup", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET /api/cron/cleanup", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    startCronRun.mockResolvedValue("run-1");
    finishCronRun.mockResolvedValue(undefined);
    // Nothing due by default — most tests care about cleanup or about job
    // independence, not about what a window actually sends.
    findRecruitingWindowsNeedingReminderMail.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
    vi.resetModules();
  });

  it("rejects a request with no Authorization header and deletes nothing", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { GET } = await import("@/app/api/cron/cleanup/route");

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(deleteExpiredApplications).not.toHaveBeenCalled();
  });

  it("rejects a request with the wrong secret and deletes nothing", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { GET } = await import("@/app/api/cron/cleanup/route");

    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(deleteExpiredApplications).not.toHaveBeenCalled();
  });

  it("rejects every request when CRON_SECRET itself is unset", async () => {
    delete process.env.CRON_SECRET;
    vi.resetModules();
    const { GET } = await import("@/app/api/cron/cleanup/route");

    const response = await GET(request("Bearer anything"));

    expect(response.status).toBe(401);
    expect(deleteExpiredApplications).not.toHaveBeenCalled();
  });

  it("runs every cleanup step and reports how many rows each deleted, given the right secret", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    deleteExpiredApplications.mockResolvedValue(2);
    deleteExpiredContactMessages.mockResolvedValue(1);
    deleteExpiredReminderSignups.mockResolvedValue(3);
    deleteExpiredJobPostings.mockResolvedValue(4);
    pruneRateLimitHits.mockResolvedValue(10);
    deleteExpiredIdeathonSignups.mockResolvedValue(5);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    const response = await GET(request("Bearer test-secret"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      deleted: {
        applications: 2,
        contactMessages: 1,
        reminderSignups: 3,
        jobPostings: 4,
        rateLimitHits: 10,
        ideathonSignups: 5,
      },
      reminderWindowMails: { sent: 0, failed: 0, error: null },
    });
  });

  it("deletes expired ideathon signups alongside the other tables", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    deleteExpiredApplications.mockResolvedValue(0);
    deleteExpiredContactMessages.mockResolvedValue(0);
    deleteExpiredReminderSignups.mockResolvedValue(0);
    pruneRateLimitHits.mockResolvedValue(0);
    deleteExpiredIdeathonSignups.mockResolvedValue(7);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    const response = await GET(request("Bearer test-secret"));

    expect(deleteExpiredIdeathonSignups).toHaveBeenCalled();
    const body = await response.json();
    expect(body.deleted.ideathonSignups).toBe(7);
  });

  it("still reports the steps that succeeded when one cleanup step throws", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    deleteExpiredApplications.mockRejectedValue(new Error("db unreachable"));
    deleteExpiredContactMessages.mockResolvedValue(1);
    deleteExpiredReminderSignups.mockResolvedValue(0);
    pruneRateLimitHits.mockResolvedValue(0);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    const response = await GET(request("Bearer test-secret"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deleted.applications).toBeNull();
    expect(body.deleted.contactMessages).toBe(1);
  });

  it("records the run before deleting, so a crash still leaves evidence it was attempted", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    deleteExpiredApplications.mockResolvedValue(0);
    deleteExpiredContactMessages.mockResolvedValue(0);
    deleteExpiredReminderSignups.mockResolvedValue(0);
    pruneRateLimitHits.mockResolvedValue(0);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    await GET(request("Bearer test-secret"));

    expect(startCronRun).toHaveBeenCalledWith("cleanup");
    expect(startCronRun.mock.invocationCallOrder[0]).toBeLessThan(
      deleteExpiredApplications.mock.invocationCallOrder[0],
    );
  });

  it("does not record a run for an unauthorized request", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { GET } = await import("@/app/api/cron/cleanup/route");
    await GET(request("Bearer wrong"));

    expect(startCronRun).not.toHaveBeenCalled();
  });

  it("closes the cleanup run with the counts and no error on a clean sweep", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    deleteExpiredApplications.mockResolvedValue(2);
    deleteExpiredContactMessages.mockResolvedValue(1);
    deleteExpiredReminderSignups.mockResolvedValue(3);
    pruneRateLimitHits.mockResolvedValue(10);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    await GET(request("Bearer test-secret"));

    expect(finishCronRun).toHaveBeenCalledWith(
      "run-1",
      { applications: 2, contactMessages: 1, reminderSignups: 3, rateLimitHits: 10 },
      null,
    );
  });

  it("closes the cleanup run with the failing step's reason when one throws", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    deleteExpiredApplications.mockRejectedValue(new Error("db unreachable"));
    deleteExpiredContactMessages.mockResolvedValue(1);
    deleteExpiredReminderSignups.mockResolvedValue(0);
    pruneRateLimitHits.mockResolvedValue(0);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    await GET(request("Bearer test-secret"));

    const cleanupCall = finishCronRun.mock.calls.find((call) => "applications" in (call[1] as object));
    const [, , error] = cleanupCall as [string, unknown, string | null];
    expect(error).toContain("applications");
    expect(error).toContain("db unreachable");
  });

  // The audit trail must never be the thing that stops the cleanup from
  // happening.
  it("still runs the cleanup when recording the run fails", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    startCronRun.mockRejectedValue(new Error("cron_runs unreachable"));
    deleteExpiredApplications.mockResolvedValue(2);
    deleteExpiredContactMessages.mockResolvedValue(0);
    deleteExpiredReminderSignups.mockResolvedValue(0);
    pruneRateLimitHits.mockResolvedValue(0);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    const response = await GET(request("Bearer test-secret"));

    expect(response.status).toBe(200);
    expect(deleteExpiredApplications).toHaveBeenCalled();
    expect(finishCronRun).not.toHaveBeenCalled();
  });

  describe("the reminder-window job", () => {
    beforeEach(() => {
      process.env.CRON_SECRET = "test-secret";
      vi.resetModules();
      deleteExpiredApplications.mockResolvedValue(0);
      deleteExpiredContactMessages.mockResolvedValue(0);
      deleteExpiredReminderSignups.mockResolvedValue(0);
      deleteExpiredJobPostings.mockResolvedValue(0);
      pruneRateLimitHits.mockResolvedValue(0);
    });

    it("sends for every window that needs it and logs its own cron_runs row", async () => {
      const windowA = { id: "window-a", semester: "HWS26", start: "2026-09-01T00:00:00+02:00", end: "2026-09-13T23:59:00+02:00" };
      const windowB = { id: "window-b", semester: "FSS27", start: "2027-03-01T00:00:00+01:00", end: "2027-03-13T23:59:00+01:00" };
      findRecruitingWindowsNeedingReminderMail.mockResolvedValue([windowA, windowB]);
      sendReminderWindowMailsForWindow.mockResolvedValueOnce({ sent: 3, failed: 1 }).mockResolvedValueOnce({ sent: 2, failed: 0 });

      const { GET } = await import("@/app/api/cron/cleanup/route");
      const response = await GET(request("Bearer test-secret"));

      expect(sendReminderWindowMailsForWindow).toHaveBeenCalledWith(windowA);
      expect(sendReminderWindowMailsForWindow).toHaveBeenCalledWith(windowB);
      const body = await response.json();
      expect(body.reminderWindowMails).toEqual({ sent: 5, failed: 1, error: null });

      expect(startCronRun).toHaveBeenCalledWith("reminder-window");
      expect(finishCronRun).toHaveBeenCalledWith("run-1", { sentReminderWindowMails: 5, failedReminderWindowMails: 1 }, null);
    });

    it("records the failure and still answers 200 when finding due windows itself throws", async () => {
      findRecruitingWindowsNeedingReminderMail.mockRejectedValue(new Error("db unreachable"));

      const { GET } = await import("@/app/api/cron/cleanup/route");
      const response = await GET(request("Bearer test-secret"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.reminderWindowMails.error).toContain("db unreachable");
      expect(finishCronRun).toHaveBeenCalledWith(
        "run-1",
        { sentReminderWindowMails: 0, failedReminderWindowMails: 0 },
        expect.stringContaining("db unreachable"),
      );
    });

    // The amendment this whole describe block exists for: neither job's
    // failure may suppress the other's work or its own cron_runs row.
    it("still runs when every cleanup step fails outright", async () => {
      deleteExpiredApplications.mockRejectedValue(new Error("db unreachable"));
      deleteExpiredContactMessages.mockRejectedValue(new Error("db unreachable"));
      deleteExpiredReminderSignups.mockRejectedValue(new Error("db unreachable"));
      deleteExpiredJobPostings.mockRejectedValue(new Error("db unreachable"));
      pruneRateLimitHits.mockRejectedValue(new Error("db unreachable"));
      findRecruitingWindowsNeedingReminderMail.mockResolvedValue([{ id: "w", semester: "HWS26", end: "2026-09-13T23:59:00+02:00" }]);
      sendReminderWindowMailsForWindow.mockResolvedValue({ sent: 1, failed: 0 });

      const { GET } = await import("@/app/api/cron/cleanup/route");
      const response = await GET(request("Bearer test-secret"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.reminderWindowMails).toEqual({ sent: 1, failed: 0, error: null });
      expect(startCronRun).toHaveBeenCalledWith("reminder-window");
    });

    it("still runs cleanup when the reminder-window job fails outright", async () => {
      deleteExpiredApplications.mockResolvedValue(2);
      deleteExpiredContactMessages.mockResolvedValue(1);
      deleteExpiredReminderSignups.mockResolvedValue(0);
      deleteExpiredJobPostings.mockResolvedValue(0);
      pruneRateLimitHits.mockResolvedValue(0);
      findRecruitingWindowsNeedingReminderMail.mockRejectedValue(new Error("db unreachable"));

      const { GET } = await import("@/app/api/cron/cleanup/route");
      const response = await GET(request("Bearer test-secret"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.deleted).toEqual({ applications: 2, contactMessages: 1, reminderSignups: 0, jobPostings: 0, rateLimitHits: 0 });
      expect(startCronRun).toHaveBeenCalledWith("cleanup");
    });
  });
});
