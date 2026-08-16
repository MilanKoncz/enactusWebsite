import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockIntersectionObserver } from "../../fixtures/observers";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { HomeHero } from "@/components/sections/HomeHero";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HomeHero", () => {
  it("renders exactly one h1 with the prefix and the first rotating term", () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    renderWithIntl(<HomeHero />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Wir sind BEGRIFF_1");
  });

  it("renders the apply CTA as a link to /mitmachen", () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    renderWithIntl(<HomeHero />);
    expect(screen.getByRole("link", { name: "Jetzt bewerben" })).toHaveAttribute(
      "href",
      "/mitmachen",
    );
  });

  it("renders the full logo as the hero's central element, ahead of the headline", () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    const { container } = renderWithIntl(<HomeHero />);
    const logo = container.querySelector('img[src*="enactus-mannheim-logo-full-on-dark"]');
    expect(logo).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 1 });
    // compareDocumentPosition: DOCUMENT_POSITION_FOLLOWING (4) means `heading`
    // comes after `logo` in document order — the logo leads, the headline follows.
    expect(logo!.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("shows a placeholder background while no hero footage exists", () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    renderWithIntl(<HomeHero />);
    expect(screen.getByText("Bühnenpitch-Loop")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    const { container } = renderWithIntl(<HomeHero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
