import { describe, expect, it } from "vitest";
import { mitmachenSteps } from "@/content/mitmachenProcess";

describe("content/mitmachenProcess", () => {
  it("has exactly three stations, much shorter than the old six-step process", () => {
    expect(mitmachenSteps).toHaveLength(3);
  });

  it("orders application before interview before response", () => {
    expect(mitmachenSteps.map((step) => step.key)).toEqual(["application", "interview", "response"]);
    expect(mitmachenSteps.map((step) => step.order)).toEqual([1, 2, 3]);
  });
});
