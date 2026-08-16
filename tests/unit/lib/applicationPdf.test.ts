// @vitest-environment node
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { ApplicationPdfDocument } from "@/lib/applicationPdf";
import type { Application } from "@/lib/db";

const baseApplication: Application = {
  id: "00000000-0000-0000-0000-000000000000",
  createdAt: new Date("2026-09-05T10:00:00Z"),
  firstName: "Mara",
  lastName: "Beispiel",
  email: "mara@example.invalid",
  studyProgram: "Wirtschaftsinformatik",
  semester: 4,
  university: "Universität Mannheim",
  priorInvolvement: "Zwei Jahre Vereinsvorstand.",
  languagesSkills: "Deutsch, Englisch, etwas Spanisch.",
  motivation: "Ich möchte reale soziale Wirkung erzeugen und dabei unternehmerisch arbeiten.",
  desiredAreas: ["SmileGreen", "Team-Lead"],
  availabilityHours: 8,
  heardAboutUs: "Instagram",
  consentAt: new Date("2026-09-05T10:00:00Z"),
  locale: "de",
  mailStatus: "pending",
  mailError: null,
  mailedAt: null,
};

describe("ApplicationPdfDocument", () => {
  it("renders a well-formed PDF buffer for a fully filled-in application", async () => {
    const buffer = await renderToBuffer(ApplicationPdfDocument({ application: baseApplication }));
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(500);
  });

  it("renders without throwing when every optional field is absent", async () => {
    const minimal: Application = {
      ...baseApplication,
      priorInvolvement: undefined,
      languagesSkills: undefined,
      heardAboutUs: undefined,
    };
    const buffer = await renderToBuffer(ApplicationPdfDocument({ application: minimal }));
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("renders a single desired area without a stray separator", async () => {
    const single: Application = { ...baseApplication, desiredAreas: ["ReSoap"] };
    await expect(renderToBuffer(ApplicationPdfDocument({ application: single }))).resolves.toBeInstanceOf(Buffer);
  });
});
