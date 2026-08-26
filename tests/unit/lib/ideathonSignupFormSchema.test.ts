import { describe, expect, it } from "vitest";
import { ideathonSignupFormSchema } from "@/lib/ideathonSignupFormSchema";

function validInput() {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    studyProgram: "BWL",
    semester: "3",
    hasIdea: false,
    registeringAsTeam: false,
    dietaryPreference: "omnivore",
    consent: true,
  };
}

describe("ideathonSignupFormSchema", () => {
  it("accepts a minimal valid signup with the optional fields omitted", () => {
    const result = ideathonSignupFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("has no university field", () => {
    const result = ideathonSignupFormSchema.safeParse(validInput());
    expect(result.success && "university" in result.data).toBe(false);
  });

  it("rejects a submission without consent", () => {
    const result = ideathonSignupFormSchema.safeParse({ ...validInput(), consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects a submission missing dietaryPreference", () => {
    const { dietaryPreference: _dietaryPreference, ...withoutDietary } = validInput();
    const result = ideathonSignupFormSchema.safeParse(withoutDietary);
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string dietaryPreference (the form's own placeholder value)", () => {
    const result = ideathonSignupFormSchema.safeParse({ ...validInput(), dietaryPreference: "" });
    expect(result.success).toBe(false);
  });

  it("accepts every real dietaryPreference option", () => {
    for (const value of ["omnivore", "vegetarian", "vegan", "halal", "kosher", "noAnswer"]) {
      const result = ideathonSignupFormSchema.safeParse({ ...validInput(), dietaryPreference: value });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an unknown dietaryPreference value", () => {
    const result = ideathonSignupFormSchema.safeParse({ ...validInput(), dietaryPreference: "keto" });
    expect(result.success).toBe(false);
  });

  it("accepts motivationExperience, teamMembers, and ideaDescription within their limits", () => {
    const result = ideathonSignupFormSchema.safeParse({
      ...validInput(),
      motivationExperience: "x".repeat(1000),
      registeringAsTeam: true,
      teamSize: 4,
      teamMembers: "x".repeat(300),
      hasIdea: true,
      ideaDescription: "x".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a motivationExperience over 1000 characters", () => {
    const result = ideathonSignupFormSchema.safeParse({
      ...validInput(),
      motivationExperience: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a teamMembers value over 300 characters", () => {
    const result = ideathonSignupFormSchema.safeParse({
      ...validInput(),
      registeringAsTeam: true,
      teamMembers: "x".repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a filled honeypot field", () => {
    const result = ideathonSignupFormSchema.safeParse({ ...validInput(), website: "https://spam.example" });
    expect(result.success).toBe(false);
  });

  it("coerces semester and teamSize to numbers", () => {
    const result = ideathonSignupFormSchema.parse({ ...validInput(), registeringAsTeam: true, teamSize: "4" });
    expect(result.semester).toBe(3);
    expect(result.teamSize).toBe(4);
  });
});
