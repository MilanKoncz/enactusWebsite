import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Pillars } from "@/components/sections/Pillars";
import { pillars } from "@/content/pillars";

describe("Pillars", () => {
  it("renders the section heading", () => {
    renderWithIntl(<Pillars />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Was uns einzigartig macht" }),
    ).toBeInTheDocument();
  });

  it("renders each pillar's title as its own h3, via the gate marker", () => {
    renderWithIntl(<Pillars />);
    expect(screen.getByRole("heading", { level: 3, name: "ESG-Charakter" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Risikofreies Umsetzen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Internationales Netzwerk" }),
    ).toBeInTheDocument();
  });

  it("always renders each pillar's lead sentence", () => {
    renderWithIntl(<Pillars />);
    // The ESG pillar's lead is split across text and an inline SDG link
    // (see the dedicated link test below), so it's matched by the
    // paragraph's combined textContent rather than screen.getByText's
    // single-text-node matching.
    const esgLead = screen
      .getByRole("heading", { level: 3, name: "ESG-Charakter" })
      .closest('[tabindex="0"]')!.querySelector("p");
    expect(esgLead).toHaveTextContent(
      "Jedes Projekt zahlt auf ein UN-Nachhaltigkeitsziel ein, nicht nur auf eine Geschäftsidee.",
    );
    expect(
      screen.getByText(
        "Ihr gründet ein echtes Unternehmen, ohne das persönliche Risiko einer Gründung zu tragen.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the detail sentence in the document regardless of hover state", () => {
    renderWithIntl(<Pillars />);
    expect(
      screen.getByText(
        "Wir wählen Projekte danach aus, welches SDG sie voranbringen — Wirkung ist die Eintrittskarte, nicht ein Zusatz am Ende.",
      ),
    ).toBeInTheDocument();
  });

  it("makes each pillar column keyboard-focusable, so hover-equivalent content is reachable without a mouse", () => {
    renderWithIntl(<Pillars />);
    const heading = screen.getByRole("heading", { level: 3, name: "ESG-Charakter" });
    const column = heading.closest('[tabindex="0"]');
    expect(column).toBeInTheDocument();
  });

  it("renders each column's background photo", () => {
    const { container } = renderWithIntl(<Pillars />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(pillars.length);
    for (const pillar of pillars) {
      expect(container.querySelector(`img[src*="${encodeURIComponent(pillar.image!)}"]`)).toBeInTheDocument();
    }
  });

  it("links the SDG reference in the ESG pillar's lead sentence to the official UN goals page", () => {
    renderWithIntl(<Pillars />);
    const link = screen.getByRole("link", { name: "UN-Nachhaltigkeitsziel" });
    expect(link).toHaveAttribute("href", "https://sdgs.un.org/goals");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Pillars />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
