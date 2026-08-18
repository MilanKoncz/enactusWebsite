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
    expect(headings[0]).toHaveTextContent("Wir sind Entrepreneurship");
  });

  it("sets the rotating term in gold and leaves the prefix alone", () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    renderWithIntl(<HomeHero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).not.toHaveClass("text-gold");
    expect(heading.querySelector(".text-gold")).toBeInTheDocument();
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

  // The video itself is HeroVideo's contract and is covered there, including
  // that it renders nothing below md. What matters here is only that the
  // hero mounts it — and that a narrow viewport gets no video markup at all,
  // since a hidden <video> still downloads in WebKit.
  it("mounts no video markup below the md breakpoint", () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    const { container } = renderWithIntl(<HomeHero />);
    expect(container.querySelector("video")).toBeNull();
  });

  it("shows the video's own poster as a static image below md, not an empty fill", () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    const { container } = renderWithIntl(<HomeHero />);
    const posterImage = container.querySelector('img[src*="hero-poster.jpg"]');
    expect(posterImage).toBeInTheDocument();
    expect(posterImage).toHaveClass("md:hidden");
  });

  it("renders the hero video with the real poster and source at desktop width", () => {
    mockIntersectionObserver();
    mockMatchMedia(true);
    const { container } = renderWithIntl(<HomeHero />);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("poster", "/video/hero-poster.jpg");
    expect(video!.querySelector("source")).toHaveAttribute("src", "/video/hero-video.webm");
  });

  // axe-core takes noticeably longer to scan a real <video> element than the
  // gradient placeholder it replaced — comfortably past the default 5000ms.
  it("has no accessibility violations", async () => {
    mockIntersectionObserver();
    mockMatchMedia(false);
    const { container } = renderWithIntl(<HomeHero />);
    expect(await axe(container)).toHaveNoViolations();
  }, 15000);
});
