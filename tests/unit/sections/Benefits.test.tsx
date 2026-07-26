import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Benefits } from "@/components/sections/Benefits";
import { benefits } from "@/content/benefits";

describe("Benefits", () => {
  it("renders the section heading", () => {
    renderWithIntl(<Benefits />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Was ihr lernt und bekommt" }),
    ).toBeInTheDocument();
  });

  it("renders all six benefit titles as h3s", () => {
    renderWithIntl(<Benefits />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(benefits.length);
  });

  it("always renders each benefit's lead sentence", () => {
    renderWithIntl(<Benefits />);
    expect(
      screen.getByText("Ihr übernehmt von Anfang an echte Verantwortung für ein Projekt."),
    ).toBeInTheDocument();
  });

  it("keeps the detail sentence in the document regardless of hover state", () => {
    renderWithIntl(<Benefits />);
    expect(
      screen.getByText(
        "Kein Praktikum, das nebenherläuft — ihr entscheidet operativ mit und verantwortet Ergebnisse.",
      ),
    ).toBeInTheDocument();
  });

  it("makes each card keyboard-focusable, so hover-equivalent content is reachable without a mouse", () => {
    renderWithIntl(<Benefits />);
    const heading = screen.getByRole("heading", { level: 3, name: "Verantwortung" });
    const card = heading.closest('[tabindex="0"]');
    expect(card).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Benefits />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
