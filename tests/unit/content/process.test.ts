import { describe, expect, it } from "vitest";
import {
  projectGuideSchema,
  projectStageSchema,
  stageKeySchema,
  stepKindSchema,
  stepSchema,
  steps,
} from "@/content/process";

describe("content/process", () => {
  it("lists the eight process steps in order", () => {
    expect(steps.map((s) => s.key)).toEqual([
      "kickOff",
      "ideation",
      "innoGating",
      "mvp",
      "operationsGating",
      "implementation",
      "spinoff",
      "startup",
    ]);
    expect(steps.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("alternates milestone and phase, starting and ending on a milestone-then-phase pair", () => {
    expect(steps.map((s) => s.kind)).toEqual([
      "milestone",
      "phase",
      "milestone",
      "phase",
      "milestone",
      "phase",
      "milestone",
      "phase",
    ]);
  });

  it("marks the exact four board-given milestones as milestones", () => {
    const milestones = steps.filter((s) => s.kind === "milestone").map((s) => s.key);
    expect(milestones).toEqual(["kickOff", "innoGating", "operationsGating", "spinoff"]);
  });

  it("treats every step's own name and position as board-confirmed", () => {
    expect(steps.every((s) => s.confirmed)).toBe(true);
  });

  it("gives every step a distinct icon", () => {
    const icons = steps.map((s) => s.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("accepts a well-formed step", () => {
    expect(() =>
      stepSchema.parse({
        key: "kickOff",
        kind: "milestone",
        order: 1,
        confirmed: true,
        icon: "flag",
        title: "Process.steps.kickOff.title",
        short: "Process.steps.kickOff.short",
      }),
    ).not.toThrow();
  });

  it("rejects a step with an unknown key", () => {
    expect(() =>
      stepSchema.parse({
        key: "scaling",
        kind: "phase",
        order: 9,
        confirmed: false,
        icon: "flag",
        title: "Process.steps.scaling.title",
        short: "Process.steps.scaling.short",
      }),
    ).toThrow();
  });

  it("rejects a step with an unknown icon", () => {
    expect(() =>
      stepSchema.parse({
        key: "kickOff",
        kind: "milestone",
        order: 1,
        confirmed: true,
        icon: "not-a-real-icon",
        title: "Process.steps.kickOff.title",
        short: "Process.steps.kickOff.short",
      }),
    ).toThrow();
  });

  it("rejects a step missing required fields", () => {
    expect(() => stepSchema.parse({ key: "kickOff" })).toThrow();
  });

  it("rejects a kind outside milestone/phase", () => {
    expect(() => stepKindSchema.parse("gate")).toThrow();
  });

  it("allows a null project stage but rejects an unknown one", () => {
    expect(() => projectStageSchema.parse(null)).not.toThrow();
    expect(() => projectStageSchema.parse("innoGating")).not.toThrow();
    expect(() => projectStageSchema.parse("unconfirmed-stage")).toThrow();
  });

  it("keeps the stage key enum in sync with the exported step list", () => {
    expect(stageKeySchema.options).toEqual(steps.map((s) => s.key));
  });

  it("defaults the project guide to unavailable, with no href", () => {
    expect(projectGuideSchema.parse({
      available: false,
      href: null,
      fileSizeLabel: null,
      updatedAt: null,
    })).toEqual({ available: false, href: null, fileSizeLabel: null, updatedAt: null });
  });

  it("requires an href once the project guide becomes available", () => {
    expect(() =>
      projectGuideSchema.parse({
        available: true,
        href: null,
        fileSizeLabel: null,
        updatedAt: null,
      }),
    ).toThrow();

    expect(() =>
      projectGuideSchema.parse({
        available: true,
        href: "/downloads/project-guide.pdf",
        fileSizeLabel: "2.4 MB",
        updatedAt: "2026-07-27",
      }),
    ).not.toThrow();
  });
});
