import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { HomeKpis } from "@/components/sections/HomeKpis";

describe("HomeKpis", () => {
  it("renders a small eyebrow instead of a headline — board feedback dropped the big title", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("In Zahlen")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders all five KPI labels in the requested order", () => {
    renderWithIntl(<HomeKpis />);
    const labels = screen
      .getAllByText(/Projektiterationen|Eingeworbenes Funding|Nationale Meistertitel|Weltweit|Gegründet & Übergeben/)
      .map((el) => el.textContent);
    expect(labels).toEqual([
      "Projektiterationen",
      "Eingeworbenes Funding",
      "Nationale Meistertitel",
      "Weltweit",
      "Gegründet & Übergeben",
    ]);
  });

  it("renders the world-ranking figure with a 'Top' prefix and its field-size detail", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("Top 16")).toBeInTheDocument();
    expect(screen.getByText("von über 1.000 Teams")).toBeInTheDocument();
  });

  it("renders funding and project iterations as lower bounds", () => {
    renderWithIntl(<HomeKpis />);
    const funding = screen.getByText(/>150\.000/);
    expect(funding.textContent).toContain("€");
    expect(screen.getByText(">65")).toBeInTheDocument();
  });

  it("has no unverified figures left — every KPI is board-confirmed", () => {
    const { container } = renderWithIntl(<HomeKpis />);
    expect(container.querySelectorAll(".border-dotted")).toHaveLength(0);
  });

  it("no longer renders an as-of line — board feedback removed it from the page", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.queryByText(/Stand:/)).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<HomeKpis />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
