import { describe, expect, it } from "vitest";
import { buildInterviewAvailabilityMatrix } from "@/lib/interviewAvailabilityMatrix";
import { generateInterviewSlots } from "@/lib/interviewSlots";

const CONFIGURED = generateInterviewSlots({
  days: ["2026-09-15", "2026-09-16"],
  startTime: "10:00",
  endTime: "12:00",
  slotMinutes: 60,
});
// Four columns: 15th 10:00/11:00, 16th 10:00/11:00.

describe("buildInterviewAvailabilityMatrix", () => {
  it("has one column per configured slot, all marked configured", () => {
    const matrix = buildInterviewAvailabilityMatrix(CONFIGURED, []);
    expect(matrix.columns).toHaveLength(4);
    expect(matrix.columns.every((column) => column.configured)).toBe(true);
  });

  it("marks a row with no answer as hasAnswer: false, distinct from an empty selection", () => {
    const matrix = buildInterviewAvailabilityMatrix(CONFIGURED, [
      { id: "1", name: "No Answer", interviewSlots: null },
      { id: "2", name: "Answered, Nothing Chosen", interviewSlots: [] },
    ]);
    expect(matrix.rows[0]).toMatchObject({ hasAnswer: false, selected: [] });
    expect(matrix.rows[1]).toMatchObject({ hasAnswer: true, selected: [] });
  });

  it("counts column totals across every row that selected it", () => {
    const matrix = buildInterviewAvailabilityMatrix(CONFIGURED, [
      { id: "1", name: "Anna", interviewSlots: [CONFIGURED[0].value] },
      { id: "2", name: "Ben", interviewSlots: [CONFIGURED[0].value, CONFIGURED[1].value] },
      { id: "3", name: "Clara", interviewSlots: null },
    ]);
    expect(matrix.columnTotals[0]).toBe(2);
    expect(matrix.columnTotals[1]).toBe(1);
    expect(matrix.columnTotals[2]).toBe(0);
  });

  it("appends an orphaned value (chosen but no longer configured) after every configured column", () => {
    const orphaned = "2099-01-01T08:00:00.000Z";
    const matrix = buildInterviewAvailabilityMatrix(CONFIGURED, [
      { id: "1", name: "Anna", interviewSlots: [orphaned] },
    ]);
    expect(matrix.columns).toHaveLength(5);
    expect(matrix.columns[4]).toMatchObject({ value: orphaned, configured: false });
    expect(matrix.columnTotals[4]).toBe(1);
  });

  it("never double-counts a value that both is configured and was chosen", () => {
    const matrix = buildInterviewAvailabilityMatrix(CONFIGURED, [
      { id: "1", name: "Anna", interviewSlots: [CONFIGURED[0].value] },
    ]);
    expect(matrix.columns).toHaveLength(4);
  });

  it("sorts multiple orphaned columns chronologically", () => {
    const matrix = buildInterviewAvailabilityMatrix(CONFIGURED, [
      {
        id: "1",
        name: "Anna",
        interviewSlots: ["2099-02-01T08:00:00.000Z", "2099-01-01T08:00:00.000Z"],
      },
    ]);
    const orphanedValues = matrix.columns.slice(4).map((column) => column.value);
    expect(orphanedValues).toEqual(["2099-01-01T08:00:00.000Z", "2099-02-01T08:00:00.000Z"]);
  });
});
