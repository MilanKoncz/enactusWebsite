import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { MitmachenTimeline } from "@/components/sections/MitmachenTimeline";

describe("MitmachenTimeline", () => {
  it("renders exactly three stations, in order", () => {
    renderWithIntl(<MitmachenTimeline />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Bewerbung");
    expect(items[1]).toHaveTextContent("Kennenlerngespräch");
    expect(items[2]).toHaveTextContent("Rückmeldung");
  });

  it("labels the list for assistive tech", () => {
    renderWithIntl(<MitmachenTimeline />);
    expect(screen.getByRole("list", { name: "Bewerbungsprozess" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<MitmachenTimeline />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
