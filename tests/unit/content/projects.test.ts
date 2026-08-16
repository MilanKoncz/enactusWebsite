import { describe, expect, it } from "vitest";
import { projectSchema, projectStatusSchema, projects } from "@/content/projects";

const baseProject = {
  name: "Test",
  oneLiner: "Projects.test.oneLiner",
  description: "Projects.test.description",
  status: "active" as const,
  stage: null,
  year: null,
  leads: [],
  externalUrl: null,
  linkedinUrl: null,
  logo: null,
  images: [],
  sdgs: [],
};

describe("content/projects", () => {
  it("lists the four active projects and the archive", () => {
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
      "sun-n-soil",
      "green-heat",
      "reverze",
      "afya",
      "mushroom",
      "moufense",
      "greenscape",
    ]);
  });

  it("marks the confirmed archive statuses correctly", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p.status]));
    expect(bySlug.differgy).toBe("spinoff");
    expect(bySlug.safesteps).toBe("paused");
    expect(bySlug.vela).toBe("paused");
    expect(bySlug.moufense).toBe("cancelled");
  });

  it("defaults the six unconfirmed archive projects to cancelled", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p.status]));
    for (const slug of ["sun-n-soil", "green-heat", "reverze", "afya", "mushroom", "greenscape"]) {
      expect(bySlug[slug]).toBe("cancelled");
    }
  });

  it("carries both SmileGreen project leads, not just the first", () => {
    const smilegreen = projects.find((p) => p.slug === "smilegreen")!;
    expect(smilegreen.leads.map((lead) => lead.name)).toEqual(["Tim Köster", "Franka Zanolli"]);
    expect(smilegreen.leads[0].email).toBe("tim.koester@unimannheim.enactus.team");
    expect(smilegreen.leads[0].linkedinUrl).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
  });

  it("leaves the second SmileGreen lead's contact details empty rather than guessed", () => {
    const franka = projects
      .find((p) => p.slug === "smilegreen")!
      .leads.find((lead) => lead.name === "Franka Zanolli")!;
    expect(franka.email).toBeNull();
    expect(franka.linkedinUrl).toBeNull();
    expect(franka.photo).toBeNull();
  });

  it("has a single named lead for Mealyo and ImpactWithUs", () => {
    expect(projects.find((p) => p.slug === "mealyo")!.leads.map((l) => l.name)).toEqual([
      "Justin Prodan",
    ]);
    expect(projects.find((p) => p.slug === "impactwithus")!.leads.map((l) => l.name)).toEqual([
      "Finn Brämig",
    ]);
  });

  it("leaves ReSoap's leads empty — only a first name is confirmed", () => {
    expect(projects.find((p) => p.slug === "resoap")!.leads).toEqual([]);
  });

  it("records the confirmed SDG focus per active project", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p.sdgs]));
    expect(bySlug.smilegreen).toEqual([3, 12, 13]);
    expect(bySlug.mealyo).toEqual([12, 13]);
    expect(bySlug.resoap).toEqual([6, 11, 12]);
    expect(bySlug.impactwithus).toEqual([17]);
  });

  it("records SmileGreen's confirmed process stage and leaves the rest untracked", () => {
    for (const p of projects) {
      expect(p.stage).toBe(p.slug === "smilegreen" ? "mvp" : null);
    }
  });

  it("links Mealyo's own site and SmileGreen's LinkedIn page, nothing invented", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
    expect(bySlug.mealyo.externalUrl).toBe("https://mealyo.de");
    expect(bySlug.mealyo.linkedinUrl).toBeNull();
    expect(bySlug.smilegreen.externalUrl).toBeNull();
    expect(bySlug.smilegreen.linkedinUrl).toBe(
      "https://www.linkedin.com/company/smilegreen-oral-care/",
    );
    for (const p of projects.filter((p) => p.status !== "active")) {
      expect(p.externalUrl).toBeNull();
      expect(p.linkedinUrl).toBeNull();
    }
  });

  it("points every asset path at a rooted public path", () => {
    for (const p of projects) {
      if (p.logo) expect(p.logo).toMatch(/^\/projects\//);
      for (const image of p.images) expect(image).toMatch(/^\/projects\//);
      for (const lead of p.leads) {
        if (lead.photo) expect(lead.photo).toMatch(/^\/projects\//);
      }
    }
  });

  it("derives oneLiner and description message keys from the slug", () => {
    const smilegreen = projects.find((p) => p.slug === "smilegreen")!;
    expect(smilegreen.oneLiner).toBe("Projects.smilegreen.oneLiner");
    expect(smilegreen.description).toBe("Projects.smilegreen.description");
  });

  it("leaves still-unconfirmed fields null or empty rather than guessed", () => {
    for (const p of projects) {
      expect(p.year).toBeNull();
    }
    for (const p of projects.filter((p) => p.status !== "active")) {
      expect(p.logo).toBeNull();
      expect(p.images).toEqual([]);
      expect(p.sdgs).toEqual([]);
      expect(p.leads).toEqual([]);
    }
  });

  it("validates every exported project against the schema", () => {
    for (const p of projects) {
      expect(() => projectSchema.parse(p)).not.toThrow();
    }
  });

  it("rejects a project with an invalid status", () => {
    expect(() =>
      projectSchema.parse({ ...baseProject, slug: "test-project", status: "on-hold" }),
    ).toThrow();
  });

  it("rejects a project with a malformed slug or lead email", () => {
    expect(() => projectSchema.parse({ ...baseProject, slug: "Not A Slug" })).toThrow();
    expect(() =>
      projectSchema.parse({
        ...baseProject,
        slug: "test",
        leads: [{ name: "Test", email: "not-an-email", linkedinUrl: null, photo: null }],
      }),
    ).toThrow();
  });

  it("rejects a lead without a name", () => {
    expect(() =>
      projectSchema.parse({
        ...baseProject,
        slug: "test",
        leads: [{ name: "", email: null, linkedinUrl: null, photo: null }],
      }),
    ).toThrow();
  });

  it("rejects an asset path that isn't rooted", () => {
    expect(() =>
      projectSchema.parse({ ...baseProject, slug: "test", logo: "projects/logo.png" }),
    ).toThrow();
    expect(() =>
      projectSchema.parse({ ...baseProject, slug: "test", images: ["projects/photo.jpg"] }),
    ).toThrow();
  });

  it("rejects an SDG number outside 1-17", () => {
    expect(() => projectSchema.parse({ ...baseProject, slug: "test", sdgs: [18] })).toThrow();
  });

  it("rejects unsorted or duplicated SDG numbers", () => {
    expect(() => projectSchema.parse({ ...baseProject, slug: "test", sdgs: [13, 12] })).toThrow();
    expect(() => projectSchema.parse({ ...baseProject, slug: "test", sdgs: [12, 12] })).toThrow();
  });

  it("exposes the same four-value status vocabulary as the national database", () => {
    expect(projectStatusSchema.options).toEqual(["active", "spinoff", "cancelled", "paused"]);
  });
});
