import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { GermanyMap } from "@/components/sections/GermanyMap";
import { germanTeamCities, teamLinks } from "@/content/network";

describe("GermanyMap", () => {
  it("gives the map one describing accessible name, in German by default", () => {
    renderWithIntl(<GermanyMap />);
    expect(
      screen.getByRole("img", {
        name: /Karte der Enactus-Standorte in Deutschland/,
      }),
    ).toBeInTheDocument();
  });

  it("gives the map an English name on the English locale", () => {
    renderWithIntl(<GermanyMap />, { locale: "en" });
    expect(screen.getByRole("img", { name: /Map of Enactus team locations in Germany/ })).toBeInTheDocument();
  });

  it("marks every decorative path, dot, and label inside the picture as aria-hidden", () => {
    const { container } = renderWithIntl(<GermanyMap />);
    const svg = container.querySelector('svg[role="img"]')!;
    for (const child of Array.from(svg.children)) {
      expect(child).toHaveAttribute("aria-hidden", "true");
    }
  });

  // No role="img" descendant may be independently focusable — the overlay
  // links live as siblings of the <svg>, not inside it, so a screen reader
  // gets one flat picture plus real, separately reachable links.
  it("keeps every clickable team link outside the img-role picture", () => {
    const { container } = renderWithIntl(<GermanyMap />);
    const svg = container.querySelector('svg[role="img"]')!;
    expect(svg.querySelectorAll("a")).toHaveLength(0);
  });

  it("links every team with a confirmed URL to that same URL, in a new tab", () => {
    renderWithIntl(<GermanyMap />);
    for (const team of teamLinks) {
      const link = screen.getByRole("link", { name: new RegExp(team.name) });
      expect(link).toHaveAttribute("href", team.url!);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("renders exactly as many overlay links as teams", () => {
    renderWithIntl(<GermanyMap />);
    expect(screen.getAllByRole("link")).toHaveLength(teamLinks.length);
  });

  it("names every other German location in a text list, not just as a dot", () => {
    renderWithIntl(<GermanyMap />);
    for (const city of germanTeamCities) {
      expect(screen.getByText(city.name)).toBeInTheDocument();
    }
  });

  it("keeps every unlinked city dot aria-hidden, same as the rest of the picture", () => {
    const { container } = renderWithIntl(<GermanyMap />);
    const svg = container.querySelector('svg[role="img"]')!;
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(germanTeamCities.length);
    for (const circle of Array.from(circles)) {
      expect(circle.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<GermanyMap />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
