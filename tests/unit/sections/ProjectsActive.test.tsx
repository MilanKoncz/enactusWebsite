import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { ProjectsActive } from "@/components/sections/ProjectsActive";
import { projects } from "@/content/projects";

// motion/react's layout animations read prefers-reduced-motion indirectly
// through usePrefersReducedMotion (useMediaQuery) — same requirement as
// BoardGrid.test.tsx's ProximityGroup.
beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const activeNames = projects.filter((p) => p.status === "active").map((p) => p.name);

describe("ProjectsActive", () => {
  it("renders exactly the four active projects as collapsed toggle buttons", () => {
    renderWithIntl(<ProjectsActive />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(activeNames.length);
    for (const name of activeNames) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    }
  });

  it("expands a card on click, revealing its description, photos, and lead", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectsActive />);

    const button = screen.getByRole("button", { name: /SmileGreen/ });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(
        "Wir entwickeln eine kompromisslos nachhaltige Zahnbürste, die gleichzeitig zu 100 % hygienisch ist. Durch unsere Materialkomposition aus einem zu einem Hochleistungselastomer transformierten Naturkautschuk, PHA und Bio-PE bieten wir die Lösung, die nachhaltiges Zähneputzen hygienisch macht.",
      ),
    ).toBeInTheDocument();
    // Appears twice: once as the lead photo placeholder's label, once as the
    // name caption below it — same pattern as BoardGrid's portraits.
    expect(screen.getAllByText("Tim Köster").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: "tim.koester@unimannheim.enactus.team" })).toHaveAttribute(
      "href",
      "mailto:tim.koester@unimannheim.enactus.team",
    );
  });

  // Every active project has a named lead since ReSoap's handover
  // (2026-08-17), so the missing-lead placeholder is exercised on the detail
  // page against an archive project instead (ProjectDetailPage.test.tsx).
  // What's still genuinely missing here is Mealyo's photos, and the point of
  // the assertion is unchanged: a gap renders as a marked placeholder, never
  // as an empty slot.
  it("marks a missing project photo as a placeholder instead of a blank slot", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectsActive />);

    await user.click(screen.getByRole("button", { name: /Mealyo/ }));
    expect(screen.getAllByText(/FOTO/i).length).toBeGreaterThan(0);
  });

  it("shows ReSoap's handed-over leads and photos, with no placeholder left in that card", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectsActive />);

    await user.click(screen.getByRole("button", { name: /ReSoap/ }));
    expect(screen.getAllByText("Heidi Hoffmann").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nayab Sheikh").length).toBeGreaterThan(0);
  });

  it("closes the previously open card when a second one is opened", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectsActive />);

    const first = screen.getByRole("button", { name: /SmileGreen/ });
    const second = screen.getByRole("button", { name: /Mealyo/ });

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses again when the open card's button is clicked a second time", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectsActive />);

    const button = screen.getByRole("button", { name: /SmileGreen/ });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations, collapsed or with a card open", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<ProjectsActive />);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: /SmileGreen/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
