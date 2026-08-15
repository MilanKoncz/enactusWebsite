import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { steps } from "@/content/process";

describe("ProcessTimeline", () => {
  it("renders all eight stations as toggle buttons, in process order", () => {
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

  it("keeps every checklist item in the document without any interaction", () => {
    renderWithIntl(<ProcessTimeline />);
    expect(screen.getAllByText("PRÜFPUNKT_1")).not.toHaveLength(0);
    expect(
      screen.getByText("Enge Betreuung durch erfahrene Coaches aus dem InnoLab-Team."),
    ).toBeInTheDocument();
  });

  it("distinguishes milestones from phases for screen readers, not only through the gate rule", () => {
    renderWithIntl(<ProcessTimeline />);
    expect(screen.getByRole("button", { name: /Meilenstein: Kick-Off/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Phase: Ideation-Phase \(InnoLab\)/ }),
    ).toBeInTheDocument();
  });

  it("opens a station's panel on keyboard focus and points aria-controls at a real panel", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProcessTimeline />);
    const button = screen.getByRole("button", { name: /kick-off/i });

    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-expanded", "true");

    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toBeInTheDocument();
  });

  it("closes the previously open station when a second one is activated", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProcessTimeline />);
    const first = screen.getByRole("button", { name: /kick-off/i });
    const second = screen.getByRole("button", { name: /ideation-phase/i });

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
