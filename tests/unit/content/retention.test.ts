import { describe, expect, it } from "vitest";
import { retention, retentionSchema } from "@/content/retention";

describe("content/retention", () => {
  it("has the board-pending retention periods", () => {
    expect(retention).toEqual({
      applications: { months: 6, confirmedByBoard: false },
      contactMessages: { months: 12, confirmedByBoard: false },
      reminderSignupsUnconfirmed: { days: 30, confirmedByBoard: false },
    });
  });

  it("validates the exported periods", () => {
    expect(() => retentionSchema.parse(retention)).not.toThrow();
  });

  it("rejects a non-positive period", () => {
    expect(() =>
      retentionSchema.parse({
        applications: { months: 0, confirmedByBoard: false },
        contactMessages: { months: 12, confirmedByBoard: false },
        reminderSignupsUnconfirmed: { days: 30, confirmedByBoard: false },
      }),
    ).toThrow();
  });

  it("requires confirmedByBoard on every period", () => {
    expect(() =>
      retentionSchema.parse({
        applications: { months: 6 },
        contactMessages: { months: 12, confirmedByBoard: false },
        reminderSignupsUnconfirmed: { days: 30, confirmedByBoard: false },
      }),
    ).toThrow();
  });
});
