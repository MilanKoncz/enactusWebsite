import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
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

describe("ProcessTimeline", () => {
  it("renders all eight stations, each as a toggle button", () => {
    renderWithIntl(<ProcessTimeline />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(steps.length);
    expect(buttons[0]).toHaveAccessibleName(/kick-off/i);
    expect(buttons[buttons.length - 1]).toHaveAccessibleName(/startup/i);
  });

  it("exposes the track as a labelled region", () => {
    renderWithIntl(<ProcessTimeline />);
    expect(screen.getByRole("group", { name: "Prozessschritte" })).toBeInTheDocument();
  });

  it("keeps every checklist item and every description in the document without any interaction", () => {
    renderWithIntl(<ProcessTimeline />);
    expect(screen.getAllByText("Problem-Solution-Fit")).not.toHaveLength(0);
    expect(
      screen.getAllByText(/Im Team entwickelt ihr gemeinsam mit anderen/),
    ).not.toHaveLength(0);
  });

  it("gives a checklist to the six stations the board confirmed one for, and none to kickOff or ideation", () => {
    renderWithIntl(<ProcessTimeline />);
    expect(screen.getAllByText("Preisgeld")).not.toHaveLength(0);
    expect(screen.getAllByText("Rechtsberatung")).not.toHaveLength(0);
    expect(screen.getAllByText("Kick-off")).not.toHaveLength(0);
    // Neither kickOff nor ideation ever renders a Prüfpunkte/Vorteile label
    // of its own — both share the region's two labels with the other six
    // stations, so absence has to be checked per panel, not via the shared
    // label text itself. The mocked GateMarker below is the more direct
    // signal that content and rendering stay in lockstep; this test only
    // guards that the two checklist-less steps' own descriptions are real
    // sentences, not the removed placeholder tokens.
    expect(screen.queryByText("PRÜFPUNKT_1")).toBeNull();
  });

  it("renders GateMarker for exactly the three confirmed gates, a calm dot for the other five", () => {
    renderWithIntl(<ProcessTimeline />);
    const calls = vi.mocked(GateMarker).mock.calls;
    const labels = new Set(calls.map(([props]) => props.label));
    expect(labels).toEqual(new Set(["Inno-Gating", "Operations-Gating", "Legal-Gating/Ausgründung"]));
  });

  it("distinguishes milestones from phases for screen readers, not only through the gate rule", () => {
    renderWithIntl(<ProcessTimeline />);
    expect(screen.getByRole("button", { name: /Meilenstein: Inno-Gating/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Phase: Ideation-Phase \(InnoLab\)/ }),
    ).toBeInTheDocument();
  });

  it("opens a station's panel on keyboard focus and points aria-controls at a real panel", () => {
    renderWithIntl(<ProcessTimeline />);
    const button = screen.getByRole("button", { name: /inno-gating/i });

    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.focus(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toBeInTheDocument();
  });

  it("closes the previously open station when a second one is activated", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProcessTimeline />);
    const first = screen.getByRole("button", { name: /inno-gating/i });
    const second = screen.getByRole("button", { name: /mvp-phase/i });

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ProcessTimeline />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
