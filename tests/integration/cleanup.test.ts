// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const deleteExpiredApplications = vi.fn();
const deleteExpiredContactMessages = vi.fn();
const deleteExpiredReminderSignups = vi.fn();
const pruneRateLimitHits = vi.fn();
const startCronRun = vi.fn();
const finishCronRun = vi.fn();

vi.mock("@/lib/db", () => ({
  deleteExpiredApplications: (...args: unknown[]) => deleteExpiredApplications(...args),
  deleteExpiredContactMessages: (...args: unknown[]) => deleteExpiredContactMessages(...args),
  deleteExpiredReminderSignups: (...args: unknown[]) => deleteExpiredReminderSignups(...args),
  pruneRateLimitHits: (...args: unknown[]) => pruneRateLimitHits(...args),
  startCronRun: (...args: unknown[]) => startCronRun(...args),
  finishCronRun: (...args: unknown[]) => finishCronRun(...args),
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
    pruneRateLimitHits.mockResolvedValue(10);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    const response = await GET(request("Bearer test-secret"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      deleted: { applications: 2, contactMessages: 1, reminderSignups: 3, rateLimitHits: 10 },
    });
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

  it("closes the run with the counts and no error on a clean sweep", async () => {
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

  it("closes the run with the failing step's reason when one throws", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    deleteExpiredApplications.mockRejectedValue(new Error("db unreachable"));
    deleteExpiredContactMessages.mockResolvedValue(1);
    deleteExpiredReminderSignups.mockResolvedValue(0);
    pruneRateLimitHits.mockResolvedValue(0);

    const { GET } = await import("@/app/api/cron/cleanup/route");
    await GET(request("Bearer test-secret"));

    const [, , error] = finishCronRun.mock.calls[0] as [string, unknown, string | null];
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
});
