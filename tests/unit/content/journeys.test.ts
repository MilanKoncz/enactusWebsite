import { describe, expect, it } from "vitest";
import { journeyKeySchema, journeySteps, journeyStepSchema } from "@/content/journeys";

describe("content/journeys", () => {
  it("has four ordered placeholder phases until the journey is confirmed with the board", () => {
    expect(journeySteps.map((s) => s.key)).toEqual(["phase-1", "phase-2", "phase-3", "phase-4"]);
    expect(journeySteps.map((s) => s.order)).toEqual([1, 2, 3, 4]);
  });

  it("derives title and description message keys from the step's key", () => {
    for (const step of journeySteps) {
      expect(step.title).toBe(`Journeys.${step.key}.title`);
      expect(step.description).toBe(`Journeys.${step.key}.description`);
    }
  });

  it("validates every exported step against the schema", () => {
    for (const step of journeySteps) {
      expect(() => journeyStepSchema.parse(step)).not.toThrow();
    }
  });

  it("accepts a well-formed journey step", () => {
    expect(() =>
      journeyStepSchema.parse({
        key: "phase-1",
        order: 1,
        title: "Journeys.phase-1.title",
        description: "Journeys.phase-1.description",
      }),
    ).not.toThrow();
  });

  it("rejects a journey step with an unknown key or non-positive order", () => {
    const base = { title: "Journeys.phase-1.title", description: "Journeys.phase-1.description" };
    expect(() => journeyStepSchema.parse({ ...base, key: "not-a-phase", order: 1 })).toThrow();
    expect(() => journeyStepSchema.parse({ ...base, key: "phase-1", order: 0 })).toThrow();
  });

  it("keeps the key enum in sync with the exported step list", () => {
    expect(journeyKeySchema.options).toEqual(journeySteps.map((s) => s.key));
  });
});
