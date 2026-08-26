import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { benefits, faqEntries, scheduleGuide, signupSteps, stats, timelineSteps } from "@/content/ideathon";

function expectContiguousOrder(items: { order: number }[]) {
  const orders = items.map((item) => item.order).sort((a, b) => a - b);
  expect(orders).toEqual(items.map((_, index) => index + 1));
}

describe("content/ideathon", () => {
  it("has four timeline stops in contiguous order", () => {
    expect(timelineSteps).toHaveLength(4);
    expectContiguousOrder(timelineSteps);
  });

  it("has six benefit cards, only the first carrying a headline figure", () => {
    expect(benefits).toHaveLength(6);
    expectContiguousOrder(benefits);
    expect(benefits.find((benefit) => benefit.order === 1)?.figure).toBe("1.000 €");
    expect(benefits.filter((benefit) => benefit.figure !== null)).toHaveLength(1);
  });

  it("has four signup steps in contiguous order", () => {
    expect(signupSteps).toHaveLength(4);
    expectContiguousOrder(signupSteps);
  });

  it("has five FAQ entries in contiguous order", () => {
    expect(faqEntries).toHaveLength(5);
    expectContiguousOrder(faqEntries);
  });

  it("has the board's stat-band figures as real numbers, not pre-formatted strings", () => {
    expect(stats).toEqual({ days: 4, teams: 10, workshops: 3, prizeEuros: 1000 });
  });

  it("points the schedule guide download at a file that actually exists in public/", () => {
    expect(scheduleGuide.available).toBe(true);
    expect(scheduleGuide.href).not.toBeNull();
    expect(existsSync(join(process.cwd(), "public", scheduleGuide.href!))).toBe(true);
  });
});
