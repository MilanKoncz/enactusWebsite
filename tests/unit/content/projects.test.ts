import { describe, expect, it } from "vitest";
import { projectSchema, projectStatusSchema, projects } from "@/content/projects";

describe("content/projects", () => {
  it("lists the four active projects and the three archived ones", () => {
    expect(projects.filter((p) => p.status === "active").map((p) => p.slug)).toEqual([
      "smilegreen",
      "mealyo",
      "resoap",
      "impactwithus",
    ]);
    expect(projects.filter((p) => p.status !== "active").map((p) => p.slug)).toEqual([
      "differgy",
      "safesteps",
      "vela",
    ]);
  });

  it("marks Differgy as a spinoff and Safesteps/Vela as paused, not cancelled", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p.status]));
    expect(bySlug.differgy).toBe("spinoff");
    expect(bySlug.safesteps).toBe("paused");
    expect(bySlug.vela).toBe("paused");
  });

  it("derives oneLiner and description message keys from the slug", () => {
    const smilegreen = projects.find((p) => p.slug === "smilegreen")!;
    expect(smilegreen.oneLiner).toBe("Projects.smilegreen.oneLiner");
    expect(smilegreen.description).toBe("Projects.smilegreen.description");
  });

  it("leaves unconfirmed fields null or empty rather than guessed", () => {
    for (const p of projects) {
      expect(p.stage).toBeNull();
      expect(p.leadName).toBeNull();
      expect(p.leadEmail).toBeNull();
      expect(p.externalUrl).toBeNull();
      expect(p.logo).toBeNull();
      expect(p.images).toEqual([]);
      expect(p.sdgs).toEqual([]);
    }
  });

  it("validates every exported project against the schema", () => {
    for (const p of projects) {
      expect(() => projectSchema.parse(p)).not.toThrow();
    }
  });

  it("rejects a project with an invalid status", () => {
    expect(() =>
      projectSchema.parse({
        slug: "test-project",
        name: "Test",
        oneLiner: "Projects.test-project.oneLiner",
        description: "Projects.test-project.description",
        status: "on-hold",
        stage: null,
        leadName: null,
        leadEmail: null,
        externalUrl: null,
        logo: null,
        images: [],
        sdgs: [],
      }),
    ).toThrow();
  });

  it("rejects a project with a malformed slug or lead email", () => {
    const base = {
      name: "Test",
      oneLiner: "Projects.test.oneLiner",
      description: "Projects.test.description",
      status: "active" as const,
      stage: null,
      leadName: null,
      externalUrl: null,
      logo: null,
      images: [],
      sdgs: [],
    };
    expect(() => projectSchema.parse({ ...base, slug: "Not A Slug", leadEmail: null })).toThrow();
    expect(() =>
      projectSchema.parse({ ...base, slug: "test", leadEmail: "not-an-email" }),
    ).toThrow();
  });

  it("rejects an SDG number outside 1-17", () => {
    expect(() =>
      projectSchema.parse({
        slug: "test",
        name: "Test",
        oneLiner: "Projects.test.oneLiner",
        description: "Projects.test.description",
        status: "active",
        stage: null,
        leadName: null,
        leadEmail: null,
        externalUrl: null,
        logo: null,
        images: [],
        sdgs: [18],
      }),
    ).toThrow();
  });

  it("exposes the same four-value status vocabulary as the national database", () => {
    expect(projectStatusSchema.options).toEqual(["active", "spinoff", "cancelled", "paused"]);
  });
});
