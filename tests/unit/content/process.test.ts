import { describe, expect, it } from "vitest";
import { projectStageSchema, stageKeySchema, stages, stageSchema } from "@/content/process";

describe("content/process", () => {
  it("lists the four gate stages in order", () => {
    expect(stages.map((s) => s.key)).toEqual(["ideation", "innoGating", "operationsGating", "spinoff"]);
    expect(stages.map((s) => s.order)).toEqual([1, 2, 3, 4]);
  });

  it("marks only the two gates confirmed by docs/design-system.md as confirmed", () => {
    const confirmed = stages.filter((s) => s.confirmed).map((s) => s.key);
    expect(confirmed).toEqual(["innoGating", "operationsGating"]);
  });

  it("accepts a well-formed stage", () => {
    expect(() =>
      stageSchema.parse({
        key: "ideation",
        order: 1,
        confirmed: false,
        title: "Process.ideation.title",
        description: "Process.ideation.description",
      }),
    ).not.toThrow();
  });

  it("rejects a stage with an unknown key", () => {
    expect(() =>
      stageSchema.parse({
        key: "scaling",
        order: 5,
        confirmed: false,
        title: "Process.scaling.title",
        description: "Process.scaling.description",
      }),
    ).toThrow();
  });

  it("rejects a stage missing required fields", () => {
    expect(() => stageSchema.parse({ key: "ideation" })).toThrow();
  });

  it("allows a null project stage but rejects an unknown one", () => {
    expect(() => projectStageSchema.parse(null)).not.toThrow();
    expect(() => projectStageSchema.parse("innoGating")).not.toThrow();
    expect(() => projectStageSchema.parse("unconfirmed-stage")).toThrow();
  });

  it("keeps the stage key enum in sync with the exported stage list", () => {
    expect(stageKeySchema.options).toEqual(stages.map((s) => s.key));
  });
});
