import { describe, expect, it } from "vitest";
import { applicationFormSchema } from "@/lib/applicationFormSchema";

function validInput() {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    studyProgram: "BWL",
    semester: "3",
    university: "Universität Mannheim",
    motivation: "Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.",
    desiredAreas: ["SmileGreen"],
    availabilityHours: "10",
    consent: true,
  };
}

describe("applicationFormSchema", () => {
  it("accepts a minimal valid application with the optional fields omitted", () => {
    const result = applicationFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("coerces semester and availabilityHours to numbers", () => {
    const result = applicationFormSchema.parse(validInput());
    expect(result.semester).toBe(3);
    expect(result.availabilityHours).toBe(10);
  });

  it("rejects a submission without consent", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects a motivation shorter than 20 characters", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), motivation: "Zu kurz." });
    expect(result.success).toBe(false);
  });

  it("rejects an empty desiredAreas selection", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), desiredAreas: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a filled honeypot field", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), website: "https://spam.example" });
    expect(result.success).toBe(false);
  });

  it("accepts a filled priorInvolvement and languagesSkills within their limits", () => {
    const result = applicationFormSchema.safeParse({
      ...validInput(),
      priorInvolvement: "Ehrenamt im Verein.",
      languagesSkills: "Deutsch, Englisch.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a priorInvolvement over 600 characters", () => {
    const result = applicationFormSchema.safeParse({
      ...validInput(),
      priorInvolvement: "x".repeat(601),
    });
    expect(result.success).toBe(false);
  });
});
