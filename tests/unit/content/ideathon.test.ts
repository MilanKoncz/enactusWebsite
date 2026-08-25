import { describe, expect, it } from "vitest";
import { benefits, faqEntries, signupSteps, timelineSteps } from "@/content/ideathon";

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
});
