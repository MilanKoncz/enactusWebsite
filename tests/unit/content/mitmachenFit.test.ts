import { describe, expect, it } from "vitest";
import { expectations, offers } from "@/content/mitmachenFit";

describe("content/mitmachenFit", () => {
  it("has exactly four expectations, in order", () => {
    expect(expectations).toHaveLength(4);
    expect(expectations.map((item) => item.order)).toEqual([1, 2, 3, 4]);
  });

  it("has exactly four offers, in order", () => {
    expect(offers).toHaveLength(4);
    expect(offers.map((item) => item.order)).toEqual([1, 2, 3, 4]);
  });

  it("includes agency as one of the expectations", () => {
    expect(expectations.map((item) => item.key)).toContain("agency");
  });
});
