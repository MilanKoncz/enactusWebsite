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
      "back-on-track",
      "stadthonig",
      "flat-mates",
    ]);
  });

  it("marks the confirmed archive statuses correctly", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p.status]));
    expect(bySlug.differgy).toBe("spinoff");
    expect(bySlug.safesteps).toBe("paused");
    expect(bySlug.vela).toBe("paused");
    expect(bySlug.moufense).toBe("cancelled");
    // Carried over from its former content/stars.ts entry (verified: true
    // there) when the board moved it off the Stars roster 2026-08-21 — a
    // confirmed fact, not a placeholder default like the block below.
    expect(bySlug["back-on-track"]).toBe("cancelled");
  });

  it("defaults the eight unconfirmed archive projects to cancelled", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p.status]));
    for (const slug of [
      "sun-n-soil",
      "green-heat",
      "reverze",
      "afya",
      "mushroom",
      "greenscape",
      "stadthonig",
      "flat-mates",
    ]) {
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

  it("names both ReSoap leads, with derived addresses marked unconfirmed", () => {
    const leads = projects.find((p) => p.slug === "resoap")!.leads;
    expect(leads.map((l) => l.name)).toEqual(["Heidi Hoffmann", "Nayab Sheikh"]);
    // Derived from the house pattern, never handed over — so they must not
    // claim to be confirmed.
    expect(leads.every((l) => l.emailVerified === false)).toBe(true);
    expect(leads.map((l) => l.email)).toEqual([
      "heidi.hoffmann@unimannheim.enactus.team",
      "nayab.sheikh@unimannheim.enactus.team",
    ]);
    expect(leads.every((l) => l.photo !== null)).toBe(true);
  });

  it("marks every handed-over lead address as verified", () => {
    const handedOver = projects
      .flatMap((p) => p.leads)
      .filter((l) => l.email !== null && !["Heidi Hoffmann", "Nayab Sheikh"].includes(l.name));
    expect(handedOver.length).toBeGreaterThan(0);
    expect(handedOver.every((l) => l.emailVerified)).toBe(true);
  });

  it("records the confirmed SDG focus per active project", () => {
    const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p.sdgs]));
    expect(bySlug.smilegreen).toEqual([3, 12, 13]);
    expect(bySlug.mealyo).toEqual([12, 13]);
    expect(bySlug.resoap).toEqual([6, 11, 12]);
    expect(bySlug.impactwithus).toEqual([17]);
  });

  it("records the confirmed process stages and leaves the rest untracked", () => {
    const withStage = new Set(["smilegreen", "resoap"]);
    for (const p of projects) {
      expect(p.stage).toBe(withStage.has(p.slug) ? "mvp" : null);
    }
  });

  it("gives ReSoap its logo and three process photos", () => {
    const resoap = projects.find((p) => p.slug === "resoap")!;
    expect(resoap.logo).toBe("/projects/resoap-logo.png");
    expect(resoap.images).toEqual([
      "/projects/resoap-herstellung.jpg",
      "/projects/resoap-reifeprozess.jpg",
      "/projects/resoap-fertige-seife.jpg",
    ]);
  });

  it("gives Mealyo three app-screenshot photos and Justin Prodan a portrait", () => {
    const mealyo = projects.find((p) => p.slug === "mealyo")!;
    expect(mealyo.images).toEqual([
      "/projects/mealyo-expiry-reminder.jpg",
      "/projects/mealyo-inventar.jpg",
      "/projects/mealyo-scan.jpg",
    ]);
    expect(mealyo.leads[0].photo).toBe("/projects/leads/justin-prodan.jpg");
  });

  it("gives ImpactWithUs three photos, not just the original workshop one", () => {
    const impactwithus = projects.find((p) => p.slug === "impactwithus")!;
    expect(impactwithus.images).toEqual([
      "/projects/impactwithus-workshop.jpg",
      "/projects/impactwithus-projecttrip.jpg",
      "/projects/impactwithus-garango.jpg",
    ]);
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
      // moufense's logo lives under /stars/ — the same file content/stars.ts's
      // STAR_2 entry points at, since it's the same historical project.
      if (p.logo) expect(p.logo).toMatch(p.slug === "moufense" ? /^\/stars\// : /^\/projects\//);
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
    // The archive exceptions with a real logo, matched by name from board
    // media handovers rather than every other archive project's null.
    // moufense's logo is the same file as the STAR_2 entry in
    // content/stars.ts — the same historical project shown in two
    // different sections of the site. differgy's is likewise the same file
    // as its own STAR_6 entry.
    const logoExceptions = ["afya", "differgy", "safesteps", "vela", "green-heat", "moufense"];
    // afya and impactwithus (active, checked separately elsewhere) are the
    // only archive/active projects with real photos beyond the four active
    // projects already covered by their own dedicated tests.
    const imageExceptions = ["afya"];
    for (const p of projects.filter((p) => p.status !== "active")) {
      if (!logoExceptions.includes(p.slug)) expect(p.logo).toBeNull();
      if (!imageExceptions.includes(p.slug)) expect(p.images).toEqual([]);
      expect(p.sdgs).toEqual([]);
      expect(p.leads).toEqual([]);
    }
    const afya = projects.find((p) => p.slug === "afya")!;
    expect(afya.logo).toBe("/projects/afya-logo.png");
    expect(afya.images).toEqual([
      "/projects/afya-ernte.jpg",
      "/projects/afya-produktfoto.jpg",
      "/projects/afya-team.jpg",
    ]);
    const moufense = projects.find((p) => p.slug === "moufense")!;
    expect(moufense.logo).toBe("/stars/moufense-logo.png");
    const differgy = projects.find((p) => p.slug === "differgy")!;
    expect(differgy.logo).toBe("/projects/differgy-logo.png");
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
