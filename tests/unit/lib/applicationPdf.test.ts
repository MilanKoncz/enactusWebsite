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
  priorInvolvement: "Zwei Jahre Vereinsvorstand.",
  languagesSkills: "Figma, Excel-Modelle, Spanisch (C1).",
  motivation: "Ich möchte reale soziale Wirkung erzeugen und dabei unternehmerisch arbeiten.",
  wantToGain: "Praxiserfahrung im Projektmanagement.",
  areaChoices: [
    { priority: 1, areaLabel: "SmileGreen", reason: "Weil ich dort am meisten bewirken kann." },
    { priority: 2, areaLabel: "Team-Lead", reason: "Zweitwahl, weil ich auch dort mitwirken möchte." },
  ],
  availabilityHours: 8,
  heardAboutUs: "Instagram",
  consentAt: new Date("2026-09-05T10:00:00Z"),
  locale: "de",
  mailStatus: "pending",
  mailError: null,
  mailedAt: null,
  recruitingSemester: "HWS26",
  retainUntil: new Date("2027-03-05T10:00:00Z"),
  cvBlobUrl: "https://example-store.private.blob.vercel-storage.com/bewerbungen/lebenslauf-abc123.pdf",
  cvPathname: "bewerbungen/lebenslauf-abc123.pdf",
  cvOriginalFilename: "Lebenslauf Mara Beispiel.pdf",
  cvSizeBytes: 123456,
  cvUploadedAt: new Date("2026-09-05T09:55:00Z"),
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
      wantToGain: undefined,
      university: undefined,
      cvBlobUrl: undefined,
      cvPathname: undefined,
      cvOriginalFilename: undefined,
      cvSizeBytes: undefined,
      cvUploadedAt: undefined,
    };
    const buffer = await renderToBuffer(ApplicationPdfDocument({ application: minimal }));
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("renders a single area choice without a stray separator", async () => {
    const single: Application = {
      ...baseApplication,
      areaChoices: [{ priority: 1, areaLabel: "ReSoap", reason: "Interesse an Nachhaltigkeit." }],
    };
    await expect(renderToBuffer(ApplicationPdfDocument({ application: single }))).resolves.toBeInstanceOf(Buffer);
  });

  it("falls back to the legacy desiredAreas array when there are no area choices", async () => {
    const legacy: Application = {
      ...baseApplication,
      areaChoices: [],
      desiredAreas: ["SmileGreen", "Team-Lead"],
    };
    await expect(renderToBuffer(ApplicationPdfDocument({ application: legacy }))).resolves.toBeInstanceOf(Buffer);
  });

  it("renders without throwing when there is neither an area choice nor a legacy desiredAreas array", async () => {
    const neither: Application = { ...baseApplication, areaChoices: [], desiredAreas: undefined };
    await expect(renderToBuffer(ApplicationPdfDocument({ application: neither }))).resolves.toBeInstanceOf(Buffer);
  });

  it("still renders a legacy row's university when present", async () => {
    const legacy: Application = { ...baseApplication, university: "Universität Mannheim" };
    await expect(renderToBuffer(ApplicationPdfDocument({ application: legacy }))).resolves.toBeInstanceOf(Buffer);
  });

  it("renders without a CV attached", async () => {
    const noCv: Application = {
      ...baseApplication,
      cvBlobUrl: undefined,
      cvPathname: undefined,
      cvOriginalFilename: undefined,
      cvSizeBytes: undefined,
      cvUploadedAt: undefined,
    };
    await expect(renderToBuffer(ApplicationPdfDocument({ application: noCv }))).resolves.toBeInstanceOf(Buffer);
  });
});
