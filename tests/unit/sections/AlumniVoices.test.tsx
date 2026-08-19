import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockIntersectionObserver } from "../../fixtures/observers";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { AlumniVoices } from "@/components/sections/AlumniVoices";
import { alumni } from "@/content/alumni";
import { alumniEmployers } from "@/content/alumniEmployers";

beforeEach(() => {
  // jsdom doesn't implement scroll containers actually scrolling.
  HTMLElement.prototype.scrollTo = vi.fn();
  mockIntersectionObserver();
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AlumniVoices", () => {
  it("renders the section heading", () => {
    renderWithIntl(<AlumniVoices />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Was aus unseren Mitgliedern wird" }),
    ).toBeInTheDocument();
  });

  it("keeps every alumnus statement in the DOM at once, not just the current slide", () => {
    renderWithIntl(<AlumniVoices />);
    for (const alumnus of alumni) {
      expect(screen.getByText(`„${alumnus.quote}“`)).toBeInTheDocument();
    }
  });

  it("exposes the track as a labelled region", () => {
    renderWithIntl(<AlumniVoices />);
    expect(screen.getByRole("region", { name: "Alumni-Statements" })).toBeInTheDocument();
  });

  it("starts on the first statement, with the previous button disabled", () => {
    renderWithIntl(<AlumniVoices />);
    expect(screen.getByText(`1 von ${alumni.length}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vorheriges Statement" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Nächstes Statement" })).toBeEnabled();
  });

  it("scrolls the track when the next button is activated", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AlumniVoices />);
    await user.click(screen.getByRole("button", { name: "Nächstes Statement" }));
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<AlumniVoices />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the alumni-employer logos as a decorative, hidden background field", () => {
    const { container } = renderWithIntl(<AlumniVoices />);
    const field = container.querySelector('[aria-hidden="true"]');
    expect(field).toBeInTheDocument();
    const images = field!.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(alumniEmployers.length);
    for (const img of images) {
      expect(img).toHaveAttribute("alt", "");
    }
  });
});
