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

  it("renders all four benefit titles as h3s", () => {
    renderWithIntl(<Benefits />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(benefits.length);
    expect(headings.map((h) => h.textContent)).toEqual([
      "Verantwortung",
      "Teamarbeit",
      "Alumni und Advisor",
      "Enactus Community",
    ]);
  });

  it("always renders each benefit's lead sentence", () => {
    renderWithIntl(<Benefits />);
    expect(
      screen.getByText(
        "Bei uns erstellst du nicht nur ein Pitchdeck oder schreibst fünf Partner an, sondern verantwortest Projekte, Events und Finanzen mit eigenem Entscheidungsspielraum.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the detail sentence in the document regardless of hover state", () => {
    renderWithIntl(<Benefits />);
    expect(
      screen.getByText(
        "Eine wertvolle Ergänzung für deinen Lebenslauf und ein Weg, deinen Agency-Skill zu verbessern.",
      ),
    ).toBeInTheDocument();
  });

  // No tab stop on the card: it holds nothing interactive now that the
  // detail sentence is permanent, and a focus stop that only grows a box is
  // noise in the tab order.
  it("adds no tab stop of its own around a benefit card", () => {
    const { container } = renderWithIntl(<Benefits />);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
  });

  it("grows the card on hover instead of revealing anything", () => {
    renderWithIntl(<Benefits />);
    const card = screen
      .getByRole("heading", { level: 3, name: "Verantwortung" })
      .closest(".hover-grow");
    expect(card).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Benefits />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
