import { statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  projectGuide,
  projectGuideSchema,
  projectStageSchema,
  stageKeySchema,
  stepKindSchema,
  stepSchema,
  steps,
} from "@/content/process";

// Same "X,Y MB" shape content/process.ts's fileSizeLabel uses — kept in one
// place so the drift test below and the content file can never quietly
// disagree on the formatting rule itself.
function formatSizeLabel(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`;
}

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

  it("marks the exact three board-confirmed gates as milestones, everything else as a phase", () => {
    const milestones = steps.filter((s) => s.kind === "milestone").map((s) => s.key);
    expect(milestones).toEqual(["innoGating", "operationsGating", "spinoff"]);

    const phases = steps.filter((s) => s.kind === "phase").map((s) => s.key);
    expect(phases).toEqual(["kickOff", "ideation", "mvp", "implementation", "startup"]);
  });

  it("gives a checklist to every step except kickOff and ideation", () => {
    const withChecklist = steps.filter((s) => s.hasChecklist).map((s) => s.key);
    expect(withChecklist).toEqual(["innoGating", "mvp", "operationsGating", "implementation", "spinoff", "startup"]);

    const withoutChecklist = steps.filter((s) => !s.hasChecklist).map((s) => s.key);
    expect(withoutChecklist).toEqual(["kickOff", "ideation"]);
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
        kind: "phase",
        order: 1,
        confirmed: true,
        icon: "flag",
        title: "Process.steps.kickOff.title",
        short: "Process.steps.kickOff.short",
        hasChecklist: false,
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
        hasChecklist: false,
      }),
    ).toThrow();
  });

  it("rejects a step with an unknown icon", () => {
    expect(() =>
      stepSchema.parse({
        key: "kickOff",
        kind: "phase",
        order: 1,
        confirmed: true,
        icon: "not-a-real-icon",
        title: "Process.steps.kickOff.title",
        short: "Process.steps.kickOff.short",
        hasChecklist: false,
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
        fileSizeLabel: "2,4 MB",
        updatedAt: "2026-07-27",
      }),
    ).not.toThrow();
  });

  it("is available with a real file whose on-disk size matches the label exactly", () => {
    expect(projectGuide.available).toBe(true);
    expect(projectGuide.href).toBe("/downloads/enactus-mannheim-project-guide.pdf");

    const filePath = path.join(process.cwd(), "public", projectGuide.href!.replace(/^\//, ""));
    const { size } = statSync(filePath);

    // Under 5 MB, per the board's size target for a file that opens in the
    // browser rather than downloading — fails loudly if a future swap
    // regresses back toward the original 16.7 MB handover.
    expect(size).toBeLessThan(5_000_000);
    expect(projectGuide.fileSizeLabel).toBe(formatSizeLabel(size));
  });
});
