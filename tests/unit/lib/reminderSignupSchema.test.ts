import { describe, expect, it } from "vitest";
import { reminderSignupSchema } from "@/lib/reminderSignupSchema";

describe("reminderSignupSchema", () => {
  it("accepts a valid email with consent given", () => {
    expect(reminderSignupSchema.safeParse({ email: "jane@example.com", consent: true }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(reminderSignupSchema.safeParse({ email: "not-an-email", consent: true }).success).toBe(false);
  });

  it("rejects a submission without consent", () => {
    expect(reminderSignupSchema.safeParse({ email: "jane@example.com", consent: false }).success).toBe(false);
  });
});
