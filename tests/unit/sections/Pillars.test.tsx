import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Pillars } from "@/components/sections/Pillars";

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
    expect(
      screen.getByText(
        "Jedes Projekt zahlt auf ein UN-Nachhaltigkeitsziel ein, nicht nur auf eine Geschäftsidee.",
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

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Pillars />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
