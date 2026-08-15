import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { EventsNetwork } from "@/components/sections/EventsNetwork";
import { teamLinks } from "@/content/network";

describe("EventsNetwork", () => {
  it("renders the approximate Germany-wide figures with their qualifiers", () => {
    renderWithIntl(<EventsNetwork />);
    expect(screen.getByText("rund 1.700")).toBeInTheDocument();
    expect(screen.getByText("über 30")).toBeInTheDocument();
  });

  it("renders the global country count as a plain figure, no qualifier", () => {
    renderWithIntl(<EventsNetwork />);
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("links every sibling team to its confirmed URL in a new tab", () => {
    renderWithIntl(<EventsNetwork />);
    for (const team of teamLinks) {
      const link = screen.getByRole("link", { name: new RegExp(team.name) });
      expect(link).toHaveAttribute("href", team.url!);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<EventsNetwork />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
