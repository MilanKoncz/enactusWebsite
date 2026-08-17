import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CLEANUP_CRON_SCHEDULE,
  CRON_STALE_AFTER_MS,
  isCleanupStale,
  nextCleanupRun,
} from "@/lib/cronSchedule";

describe("CLEANUP_CRON_SCHEDULE", () => {
  // The drift guard. vercel.json is platform config the app can't import,
  // so the schedule is duplicated — this makes the duplication enforced
  // rather than hoped for, the same way tests/unit/contrast.test.ts keeps
  // the design tokens and globals.css in step.
  it("matches the schedule actually configured in vercel.json", () => {
    const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      crons?: { path: string; schedule: string }[];
    };
    const cleanup = vercelConfig.crons?.find((cron) => cron.path === "/api/cron/cleanup");

    expect(cleanup).toBeDefined();
    expect(cleanup?.schedule).toBe(CLEANUP_CRON_SCHEDULE);
  });
});

describe("nextCleanupRun", () => {
  it("is today's 03:00 UTC when the current time is before it", () => {
    expect(nextCleanupRun(new Date("2026-08-17T01:30:00Z")).toISOString()).toBe("2026-08-17T03:00:00.000Z");
  });

  it("is tomorrow's 03:00 UTC when the current time is past it", () => {
    expect(nextCleanupRun(new Date("2026-08-17T07:00:00Z")).toISOString()).toBe("2026-08-18T03:00:00.000Z");
  });

  it("moves to tomorrow at exactly 03:00, never returning the current instant", () => {
    expect(nextCleanupRun(new Date("2026-08-17T03:00:00Z")).toISOString()).toBe("2026-08-18T03:00:00.000Z");
  });

  it("rolls over month and year boundaries", () => {
    expect(nextCleanupRun(new Date("2026-08-31T23:00:00Z")).toISOString()).toBe("2026-09-01T03:00:00.000Z");
    expect(nextCleanupRun(new Date("2026-12-31T23:00:00Z")).toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });
});

describe("isCleanupStale", () => {
  const now = new Date("2026-08-17T12:00:00Z");

  it("treats a job that has never run as stale — the most serious state, not an unknown one", () => {
    expect(isCleanupStale(null, now)).toBe(true);
  });

  it("is not stale after a run earlier today", () => {
    expect(isCleanupStale(new Date("2026-08-17T03:00:00Z"), now)).toBe(false);
  });

  it("is not stale after one missed day, which a slow trigger could explain", () => {
    expect(isCleanupStale(new Date("2026-08-16T03:00:00Z"), now)).toBe(false);
  });

  it("is stale once more than 48 hours have passed", () => {
    expect(isCleanupStale(new Date("2026-08-15T02:00:00Z"), now)).toBe(true);
  });

  it("is not stale at exactly the threshold, only beyond it", () => {
    const exactly = new Date(now.getTime() - CRON_STALE_AFTER_MS);
    expect(isCleanupStale(exactly, now)).toBe(false);
    expect(isCleanupStale(new Date(exactly.getTime() - 1), now)).toBe(true);
  });
});
