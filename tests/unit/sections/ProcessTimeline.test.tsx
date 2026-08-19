import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { GateMarker } from "@/components/ui/GateMarker";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { steps } from "@/content/process";

// vi.mock calls are hoisted above these imports by Vitest's transform, so
// GateMarker is already this spy-wrapped version by the time ProcessTimeline
// (and this file) import it — lets the test below assert exactly which
// steps render the real gate rule vs. the calmer phase dot, without
// reaching for a class-name or test-id query for something that's
// deliberately aria-hidden either way.
vi.mock("@/components/ui/GateMarker", async () => {
  const actual =
    await vi.importActual<typeof import("@/components/ui/GateMarker")>("@/components/ui/GateMarker");
  return { GateMarker: vi.fn(actual.GateMarker) };
});

const CHECKLIST_STEP_COUNT = steps.filter((step) => step.hasChecklist).length;

afterEach(() => {
  vi.unstubAllGlobals();
});

// The common case: motion is allowed, so ProcessTimeline is "enhanced"
// (closed-by-default, opens only on click or keyboard activation).
function renderEnhanced() {
  mockMatchMedia(false);
  return renderWithIntl(<ProcessTimeline />);
}

describe("ProcessTimeline", () => {
  it(`renders all eight stations, ${CHECKLIST_STEP_COUNT} of them as a toggle button, and two — kickOff and ideation — as plain description blocks`, () => {
    renderEnhanced();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(CHECKLIST_STEP_COUNT);
    expect(screen.getByText("Kick-off")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kick-off/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ideation-phase/i })).toBeNull();
  });

  it("exposes the track as a labelled region", () => {
    renderEnhanced();
    expect(screen.getByRole("group", { name: "Prozessschritte" })).toBeInTheDocument();
  });

  it("keeps every checklist item and every description in the document without any interaction", () => {
    renderEnhanced();
    expect(screen.getAllByText("Problem-Solution-Fit")).not.toHaveLength(0);
    expect(
      screen.getAllByText(/Im Team entwickelt ihr gemeinsam mit anderen/),
    ).not.toHaveLength(0);
  });

  it("gives a checklist to the six stations the board confirmed one for, and none to kickOff or ideation", () => {
    renderEnhanced();
    expect(screen.getAllByText("Preisgeld")).not.toHaveLength(0);
    expect(screen.getAllByText("Rechtsberatung")).not.toHaveLength(0);
    expect(screen.getAllByText("Kick-off")).not.toHaveLength(0);
    expect(screen.queryByText("PRÜFPUNKT_1")).toBeNull();
  });

  it("renders GateMarker for exactly the three confirmed gates, a calm bar for the other five", () => {
    renderEnhanced();
    const calls = vi.mocked(GateMarker).mock.calls;
    const labels = new Set(calls.map(([props]) => props.label));
    expect(labels).toEqual(new Set(["Inno-Gating", "Operations-Gating", "Legal-Gating/Ausgründung"]));
  });

  it("distinguishes milestones from phases for screen readers, not only through the gate rule", () => {
    renderEnhanced();
    expect(screen.getByRole("button", { name: /Meilenstein: Inno-Gating/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Phase: MVP-Phase/ })).toBeInTheDocument();
  });

  it("falls back to permanently open under prefers-reduced-motion", () => {
    mockMatchMedia(true);
    renderWithIntl(<ProcessTimeline />);
    expect(screen.getByRole("button", { name: /inno-gating/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("starts closed once enhanced, and opens on click", async () => {
    const user = userEvent.setup();
    renderEnhanced();

    const button = screen.getByRole("button", { name: /mvp-phase/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("lets a manually opened station close again", async () => {
    const user = userEvent.setup();
    renderEnhanced();

    const button = screen.getByRole("button", { name: /mvp-phase/i });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("never opens a station on its own — every station stays closed until a reader acts", () => {
    renderEnhanced();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = renderEnhanced();
    expect(await axe(container)).toHaveNoViolations();
  });
});
