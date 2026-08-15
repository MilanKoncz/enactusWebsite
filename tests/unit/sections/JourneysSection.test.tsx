import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { JourneysSection } from "@/components/sections/JourneysSection";

describe("JourneysSection", () => {
  it("renders all four confirmed trips with their season, year, and destination", () => {
    renderWithIntl(<JourneysSection />);
    expect(screen.getByText("FSS 2026")).toBeInTheDocument();
    expect(screen.getByText("St. Gallen")).toBeInTheDocument();
    expect(screen.getByText("FSS 2025")).toBeInTheDocument();
    expect(screen.getAllByText("Berlin")).toHaveLength(2);
    expect(screen.getByText("HWS 2024")).toBeInTheDocument();
    expect(screen.getByText("München")).toBeInTheDocument();
  });

  it("lists the trips most recent first, matching content/journeys.ts", () => {
    renderWithIntl(<JourneysSection />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("FSS 2026");
    expect(items[3]).toHaveTextContent("FSS 2024");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<JourneysSection />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
