import { describe, expect, it } from "vitest";
import { boundaryBlocks, faqEntries, insideItems, paths, steps } from "@/content/innolab";

function expectContiguousOrder(items: { order: number }[]) {
  const orders = items.map((item) => item.order).sort((a, b) => a - b);
  expect(orders).toEqual(items.map((_, index) => index + 1));
}

describe("content/innolab", () => {
  it("has two entry paths in contiguous order, each with a real target", () => {
    expect(paths).toHaveLength(2);
    expectContiguousOrder(paths);
    for (const path of paths) {
      expect(path.href.startsWith("/") || path.href.startsWith("#")).toBe(true);
    }
    expect(paths.find((p) => p.key === "ideathon")?.href).toBe("/ideathon");
  });

  it("has five solo-path steps in contiguous order, only the last one a gate", () => {
    expect(steps).toHaveLength(5);
    expectContiguousOrder(steps);
    expect(steps.filter((step) => step.kind === "gate")).toHaveLength(1);
    expect(steps.find((step) => step.order === 5)?.kind).toBe("gate");
  });

  it("has three inside-InnoLab items in contiguous order", () => {
    expect(insideItems).toHaveLength(3);
    expectContiguousOrder(insideItems);
  });

  it("has two boundary blocks pointing at the membership form and the Ideathon", () => {
    expect(boundaryBlocks).toHaveLength(2);
    expectContiguousOrder(boundaryBlocks);
    expect(boundaryBlocks.find((b) => b.key === "innolab")?.href).toBe("/mitmachen");
    expect(boundaryBlocks.find((b) => b.key === "ideathon")?.href).toBe("/ideathon");
  });

  it("has five FAQ entries in contiguous order", () => {
    expect(faqEntries).toHaveLength(5);
    expectContiguousOrder(faqEntries);
  });
});
