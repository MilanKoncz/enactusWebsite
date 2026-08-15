import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { HomeKpis } from "@/components/sections/HomeKpis";

describe("HomeKpis", () => {
  it("renders the section heading", () => {
    renderWithIntl(<HomeKpis />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Zahlen, die für sich sprechen" }),
    ).toBeInTheDocument();
  });

  it("renders all five KPI labels", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("Nationale Meistertitel")).toBeInTheDocument();
    expect(screen.getByText("World-Cup-Finale")).toBeInTheDocument();
    expect(screen.getByText("Gegründet & Übergeben")).toBeInTheDocument();
    expect(screen.getByText("Eingeworbenes Funding")).toBeInTheDocument();
    expect(screen.getByText("Projektiterationen")).toBeInTheDocument();
  });

  it("renders the world-cup-finals figure with a multiplier suffix", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("2×")).toBeInTheDocument();
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

  it("renders a single as-of line for the whole row, not one per figure", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("Stand: August 2026")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<HomeKpis />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
