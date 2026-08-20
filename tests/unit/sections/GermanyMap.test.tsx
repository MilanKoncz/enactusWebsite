import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { GermanyMap } from "@/components/sections/GermanyMap";
import { germanTeamCities } from "@/content/network";

const LINKED_CITIES = germanTeamCities.filter((c) => c.url !== null);
const UNLINKED_CITIES = germanTeamCities.filter((c) => c.url === null);

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

  it("links every German team city with a confirmed URL to that same URL, in a new tab", () => {
    renderWithIntl(<GermanyMap />);
    for (const city of LINKED_CITIES) {
      const link = screen.getByRole("link", { name: new RegExp(city.name) });
      expect(link).toHaveAttribute("href", city.url!);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("renders exactly as many overlay links as cities with a confirmed URL", () => {
    renderWithIntl(<GermanyMap />);
    expect(screen.getAllByRole("link")).toHaveLength(LINKED_CITIES.length);
  });

  it("renders no link for a city with no confirmed URL (Straubing)", () => {
    renderWithIntl(<GermanyMap />);
    expect(UNLINKED_CITIES.length).toBeGreaterThan(0);
    for (const city of UNLINKED_CITIES) {
      expect(screen.queryByRole("link", { name: new RegExp(city.name) })).not.toBeInTheDocument();
    }
  });

  it("names every German location in a text list, not just as a dot", () => {
    renderWithIntl(<GermanyMap />);
    for (const city of germanTeamCities) {
      expect(screen.getAllByText(city.name).length).toBeGreaterThan(0);
    }
  });

  // Every dot's name is a hover/focus-revealed HTML label, not permanent
  // text — board feedback, 2026-08-20 ("show names on hover, except
  // Mannheim"). It's still present in the DOM at all times (aria-hidden,
  // opacity-0 by default), never conditionally rendered only on
  // interaction, so it's never literally hidden from anyone who can read
  // the DOM — only from the *default visual state*, which the always-on
  // text list below the map exists specifically to cover.
  it("keeps every city's hover label present but visually opacity-0 at rest, except Mannheim's always-visible one", () => {
    renderWithIntl(<GermanyMap />);
    for (const city of germanTeamCities) {
      const labels = screen.getAllByText(city.name).filter((el) => el.tagName === "SPAN" && el.hasAttribute("aria-hidden"));
      expect(labels.length).toBeGreaterThan(0);
      expect(labels[0]).toHaveClass("opacity-0");
    }
    // Mannheim's label is the SVG <text> element it always was — an
    // svgtagName stays lowercase in the DOM, unlike an HTML element's.
    const mannheim = screen.getByText("Mannheim");
    expect(mannheim.tagName).toBe("text");
  });

  it("keeps every city dot aria-hidden, same as the rest of the picture", () => {
    const { container } = renderWithIntl(<GermanyMap />);
    const svg = container.querySelector('svg[role="img"]')!;
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(germanTeamCities.length);
    for (const circle of Array.from(circles)) {
      expect(circle.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it("dims the unlinked city's dot so it reads as not-clickable, not just silently un-linked", () => {
    const { container } = renderWithIntl(<GermanyMap />);
    const svg = container.querySelector('svg[role="img"]')!;
    const circles = Array.from(svg.querySelectorAll("circle"));
    // Mannheim's own circle has no fill-opacity attribute set (defaults to
    // fully opaque) and a stroke, so filter to the plain city dots by
    // radius (CITY_DOT_RADIUS) to avoid it here.
    const dimmed = circles.filter((c) => c.getAttribute("fill-opacity") === "0.55");
    expect(dimmed.length).toBe(UNLINKED_CITIES.length);
    const full = circles.filter((c) => c.getAttribute("fill-opacity") === "1");
    expect(full.length).toBe(LINKED_CITIES.length);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<GermanyMap />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
