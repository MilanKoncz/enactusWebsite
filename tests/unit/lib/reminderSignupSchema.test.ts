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

  // reminder_signups.email carries a unique constraint on the raw column —
  // without normalization, "Max@Uni.de" and "max@uni.de" would be two
  // different rows to Postgres despite being the same address.
  it("normalizes the email's case and surrounding whitespace before it ever reaches the database", () => {
    const result = reminderSignupSchema.safeParse({ email: "  Max@Uni.DE  ", consent: true });
    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe("max@uni.de");
  });

  it("still rejects an invalid address after trimming and lowercasing", () => {
    expect(reminderSignupSchema.safeParse({ email: "  NOT-AN-EMAIL  ", consent: true }).success).toBe(false);
  });
});
