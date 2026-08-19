import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { AlumniEmployers } from "@/components/sections/AlumniEmployers";
import { alumniEmployers } from "@/content/alumniEmployers";

beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AlumniEmployers", () => {
  it("renders the section heading", () => {
    renderWithIntl(<AlumniEmployers />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Wo unsere Alumni heute arbeiten" }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<AlumniEmployers />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the alumni-employer logos as a decorative, hidden background field", () => {
    const { container } = renderWithIntl(<AlumniEmployers />);
    const field = container.querySelector('[aria-hidden="true"]');
    expect(field).toBeInTheDocument();
    const images = field!.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(alumniEmployers.length);
    for (const img of images) {
      expect(img).toHaveAttribute("alt", "");
    }
  });

  // Regression for the dock/proximity effect never firing (2026-08-19): the
  // field used to carry pointer-events-none, which makes an element (and
  // every descendant that doesn't explicitly override it) invisible to hit
  // testing — so ProximityGroup's own pointermove listener, attached to
  // this exact element, never received an event. Asserting the class string
  // directly, not computed style: jsdom doesn't apply the project's actual
  // Tailwind CSS, so getComputedStyle can't tell the two states apart here.
  it("does not carry pointer-events-none on the logo field, so ProximityGroup's listener can receive hover events", () => {
    const { container } = renderWithIntl(<AlumniEmployers />);
    const field = container.querySelector('[aria-hidden="true"]');
    expect(field).toBeInTheDocument();
    expect(field!.className).not.toContain("pointer-events-none");
  });
});
