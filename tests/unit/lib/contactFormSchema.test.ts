import { describe, expect, it } from "vitest";
import { contactFormSchema } from "@/lib/contactFormSchema";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Partnerschaft",
  message: "Wir würden gerne mit euch über eine Kooperation sprechen.",
};

describe("contactFormSchema", () => {
  it("accepts a well-formed submission", () => {
    expect(() => contactFormSchema.parse(valid)).not.toThrow();
  });

  it("rejects a submission without a subject — it's required", () => {
    const { subject: _subject, ...rest } = valid;
    expect(() => contactFormSchema.parse(rest)).toThrow();
  });

  it("rejects a subject shorter than two characters", () => {
    expect(() => contactFormSchema.parse({ ...valid, subject: "A" })).toThrow();
  });

  it("rejects a subject over 150 characters", () => {
    expect(() => contactFormSchema.parse({ ...valid, subject: "a".repeat(151) })).toThrow();
  });

  it("rejects a name shorter than two characters", () => {
    expect(() => contactFormSchema.parse({ ...valid, name: "A" })).toThrow();
  });

  it("rejects a malformed email", () => {
    expect(() => contactFormSchema.parse({ ...valid, email: "not-an-email" })).toThrow();
  });

  it("rejects a message under ten characters", () => {
    expect(() => contactFormSchema.parse({ ...valid, message: "Hi." })).toThrow();
  });

  it("rejects a message over 2000 characters", () => {
    expect(() => contactFormSchema.parse({ ...valid, message: "a".repeat(2001) })).toThrow();
  });

  it("trims whitespace-only fields down to nothing, failing the minimum length", () => {
    expect(() => contactFormSchema.parse({ ...valid, name: "   " })).toThrow();
  });
});
