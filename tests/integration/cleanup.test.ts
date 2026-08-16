// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const deleteExpiredApplications = vi.fn();
const deleteExpiredContactMessages = vi.fn();
const deleteExpiredReminderSignups = vi.fn();
const pruneRateLimitHits = vi.fn();

vi.mock("@/lib/db", () => ({
  deleteExpiredApplications: (...args: unknown[]) => deleteExpiredApplications(...args),
  deleteExpiredContactMessages: (...args: unknown[]) => deleteExpiredContactMessages(...args),
  deleteExpiredReminderSignups: (...args: unknown[]) => deleteExpiredReminderSignups(...args),
  pruneRateLimitHits: (...args: unknown[]) => pruneRateLimitHits(...args),
}));

function request(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/cleanup", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET /api/cron/cleanup", () => {
  const originalSecret = process.env.CRON_SECRET;

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
});
