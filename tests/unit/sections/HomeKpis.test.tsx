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
    expect(screen.getByText("Ausgründungen")).toBeInTheDocument();
    expect(screen.getByText("Eingeworbenes Funding")).toBeInTheDocument();
    expect(screen.getByText("Projektiterationen")).toBeInTheDocument();
    expect(screen.getByText("Gegründet")).toBeInTheDocument();
  });

  it("formats the founding year without a thousands separator", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("2003")).toBeInTheDocument();
    expect(screen.queryByText("2.003")).not.toBeInTheDocument();
  });

  it("formats funding as a grouped euro amount", () => {
    renderWithIntl(<HomeKpis />);
    const funding = screen.getByText(/250\.000/);
    expect(funding.textContent).toContain("€");
  });

  it("marks every currently-unverified figure with the quiet unverified treatment", () => {
    const { container } = renderWithIntl(<HomeKpis />);
    const marks = container.querySelectorAll(".border-dotted");
    expect(marks).toHaveLength(5);
  });

  it("renders a single as-of line for the whole row, not one per figure", () => {
    renderWithIntl(<HomeKpis />);
    expect(screen.getByText("Stand: Juli 2026")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<HomeKpis />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
