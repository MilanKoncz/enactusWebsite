import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { InterviewAvailabilityField } from "@/components/sections/InterviewAvailabilityField";
import type { InterviewSlot } from "@/lib/interviewSlots";

const SLOTS: InterviewSlot[] = [
  { value: "2026-09-15T08:00:00.000Z", day: "2026-09-15", startTime: "10:00", endTime: "11:00" },
  { value: "2026-09-15T09:00:00.000Z", day: "2026-09-15", startTime: "11:00", endTime: "12:00" },
  { value: "2026-09-16T08:00:00.000Z", day: "2026-09-16", startTime: "10:00", endTime: "11:00" },
];

function renderField(overrides: Partial<Parameters<typeof InterviewAvailabilityField>[0]> = {}) {
  return render(
    <InterviewAvailabilityField
      legend="Verfügbarkeit für ein Bewerbungsgespräch"
      hint="Mehrfachauswahl möglich."
      countLabel="0 ausgewählt"
      slots={SLOTS}
      value={[]}
      onChange={vi.fn()}
      dayHeading={(day) => `Tag ${day}`}
      slotLabel={(slot) => `${slot.startTime}-${slot.endTime}`}
      {...overrides}
    />,
  );
}

describe("InterviewAvailabilityField", () => {
  it("renders nothing when no slots are offered", () => {
    const { container } = renderField({ slots: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it("groups slots into one CheckboxGroup per day", () => {
    renderField();
    expect(screen.getByRole("group", { name: "Tag 2026-09-15" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Tag 2026-09-16" })).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("has no per-applicant maximum — every slot stays checkable regardless of how many are already chosen", () => {
    renderField({ value: SLOTS.map((slot) => slot.value) });
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeEnabled();
    }
  });

  it("calls onChange with the slot added, preserving selections in the other day's group", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ value: ["2026-09-16T08:00:00.000Z"], onChange });

    const day15 = within(screen.getByRole("group", { name: "Tag 2026-09-15" }));
    await user.click(day15.getByRole("checkbox", { name: "10:00-11:00" }));

    expect(onChange).toHaveBeenCalledWith(["2026-09-16T08:00:00.000Z", "2026-09-15T08:00:00.000Z"]);
  });

  it("is operable by keyboard", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ onChange });

    await user.tab();
    // The first checkbox in document order is day 2026-09-15's 10:00-11:00.
    expect(screen.getAllByRole("checkbox", { name: "10:00-11:00" })[0]).toHaveFocus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(["2026-09-15T08:00:00.000Z"]);
  });

  it("shows a group-level error when given one", () => {
    renderField({ error: "Bitte wähle jedes Zeitfenster nur einmal aus." });
    expect(screen.getByRole("alert")).toHaveTextContent("Bitte wähle jedes Zeitfenster nur einmal aus.");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderField({ value: [SLOTS[0].value] });
    expect(await axe(container)).toHaveNoViolations();
  });
});
