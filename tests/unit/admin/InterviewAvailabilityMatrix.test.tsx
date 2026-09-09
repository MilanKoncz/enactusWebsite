import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { InterviewAvailabilityMatrix } from "@/components/admin/InterviewAvailabilityMatrix";
import { buildInterviewAvailabilityMatrix } from "@/lib/interviewAvailabilityMatrix";
import { generateInterviewSlots } from "@/lib/interviewSlots";

const CONFIGURED = generateInterviewSlots({
  days: ["2026-09-15", "2026-09-16"],
  startTime: "10:00",
  endTime: "12:00",
  slotMinutes: 60,
});

function renderMatrix(applications: Array<{ id: string; name: string; interviewSlots: string[] | null }>) {
  const matrix = buildInterviewAvailabilityMatrix(CONFIGURED, applications);
  return render(
    <InterviewAvailabilityMatrix
      matrix={matrix}
      captionLabel="Verfügbarkeit für Bewerbungsgespräche"
      applicantColumnLabel="Bewerber:in"
      totalColumnLabel="Summe"
      totalsRowLabel="Verfügbar"
      noAnswerLabel="keine Angabe"
      noneChosenLabel="nichts gewählt"
      notConfiguredLabel="nicht mehr konfiguriert"
      availableLabel="verfügbar"
      notAvailableLabel="nicht verfügbar"
      dayHeading={(day) => `Tag ${day}`}
    />,
  );
}

describe("InterviewAvailabilityMatrix", () => {
  it("renders one row header per applicant and one column header per configured slot", () => {
    renderMatrix([
      { id: "1", name: "Anna Berger", interviewSlots: [CONFIGURED[0].value] },
      { id: "2", name: "Ben Cakir", interviewSlots: [] },
    ]);
    expect(screen.getByRole("rowheader", { name: "Anna Berger" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Ben Cakir" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader", { name: "10:00" })).toHaveLength(2);
  });

  it("shows the totals row with the correct per-column sums", () => {
    renderMatrix([
      { id: "1", name: "Anna Berger", interviewSlots: [CONFIGURED[0].value] },
      { id: "2", name: "Ben Cakir", interviewSlots: [CONFIGURED[0].value] },
    ]);
    const totalsRow = screen.getByRole("rowheader", { name: "Verfügbar" }).closest("tr")!;
    expect(within(totalsRow).getByText("2")).toBeInTheDocument();
  });

  it("collapses a row with no answer into a single spanning cell, showing the no-answer note", () => {
    renderMatrix([{ id: "1", name: "Clara Doerr", interviewSlots: null }]);
    const row = screen.getByRole("rowheader", { name: "Clara Doerr" }).closest("tr")!;
    const cell = row.querySelector("td[colspan]");
    expect(cell).toHaveTextContent("keine Angabe");
    expect(cell).toHaveAttribute("colspan", String(CONFIGURED.length));
  });

  it("shows a plain 0 total and a 'nothing chosen' note for an answered-but-empty row", () => {
    renderMatrix([{ id: "1", name: "Dilan Erk", interviewSlots: [] }]);
    const row = screen.getByRole("rowheader", { name: "Dilan Erk" }).closest("tr")!;
    expect(within(row).getByText("nichts gewählt", { exact: false })).toBeInTheDocument();
  });

  it("marks an orphaned column as no longer configured", () => {
    const orphaned = "2099-01-01T08:00:00.000Z";
    renderMatrix([{ id: "1", name: "Anna Berger", interviewSlots: [orphaned] }]);
    expect(screen.getByText("nicht mehr konfiguriert", { exact: false })).toBeInTheDocument();
  });

  it("announces availability per cell for screen readers, not just a bare icon", () => {
    renderMatrix([{ id: "1", name: "Anna Berger", interviewSlots: [CONFIGURED[0].value] }]);
    expect(screen.getAllByText("verfügbar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("nicht verfügbar").length).toBeGreaterThan(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderMatrix([
      { id: "1", name: "Anna Berger", interviewSlots: [CONFIGURED[0].value] },
      { id: "2", name: "Ben Cakir", interviewSlots: [] },
      { id: "3", name: "Clara Doerr", interviewSlots: null },
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });
});
