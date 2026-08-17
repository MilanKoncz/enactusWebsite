import { describe, expect, it } from "vitest";
import { countReminderStates, reminderState } from "@/lib/adminReminders";
import type { ReminderSignupSummary } from "@/lib/db";

function signup(overrides: Partial<ReminderSignupSummary> = {}): ReminderSignupSummary {
  return {
    id: "1",
    createdAt: new Date("2026-08-01T10:00:00Z"),
    email: "jane@example.com",
    confirmed: false,
    confirmedAt: null,
    unsubscribedAt: null,
    mailStatus: "sent",
    ...overrides,
  };
}

describe("reminderState", () => {
  it("is 'unconfirmed' for a row that never completed the double opt-in", () => {
    expect(reminderState(signup())).toBe("unconfirmed");
  });

  it("is 'confirmed' once the link was clicked", () => {
    expect(reminderState(signup({ confirmed: true, confirmedAt: new Date() }))).toBe("confirmed");
  });

  // The one that matters for not overstating the list: someone who
  // confirmed and later unsubscribed is not a subscriber.
  it("is 'unsubscribed' even when the row is also confirmed", () => {
    expect(
      reminderState(signup({ confirmed: true, confirmedAt: new Date(), unsubscribedAt: new Date() })),
    ).toBe("unsubscribed");
  });

  it("is 'unsubscribed' for an unconfirmed row that unsubscribed anyway", () => {
    expect(reminderState(signup({ unsubscribedAt: new Date() }))).toBe("unsubscribed");
  });
});

describe("countReminderStates", () => {
  it("counts each state separately and never double-counts a row", () => {
    const totals = countReminderStates([
      signup({ id: "a" }),
      signup({ id: "b", confirmed: true, confirmedAt: new Date() }),
      signup({ id: "c", confirmed: true, confirmedAt: new Date() }),
      signup({ id: "d", confirmed: true, confirmedAt: new Date(), unsubscribedAt: new Date() }),
    ]);

    expect(totals).toEqual({ confirmed: 2, unconfirmed: 1, unsubscribed: 1 });
    expect(totals.confirmed + totals.unconfirmed + totals.unsubscribed).toBe(4);
  });

  it("returns zeros for an empty list", () => {
    expect(countReminderStates([])).toEqual({ confirmed: 0, unconfirmed: 0, unsubscribed: 0 });
  });
});
