import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { PartnerMarquee } from "@/components/sections/PartnerMarquee";
import { partners } from "@/content/partners";

describe("PartnerMarquee", () => {
  it("renders every partner's name once visibly", () => {
    renderWithIntl(<PartnerMarquee />);
    for (const partner of partners) {
      expect(screen.getAllByText(partner.name).length).toBeGreaterThan(0);
    }
  });

  it("duplicates the track for a seamless loop, hiding the duplicate from assistive technology", () => {
    renderWithIntl(<PartnerMarquee />);
    const firstPartnerOccurrences = screen.getAllByText(partners[0].name);
    expect(firstPartnerOccurrences).toHaveLength(2);
    const hiddenCopy = firstPartnerOccurrences.find(
      (el) => el.closest('[aria-hidden="true"]') !== null,
    );
    expect(hiddenCopy).toBeDefined();
  });

  it("hides the duplicate half under reduced motion instead of scrolling through it twice", () => {
    const { container } = renderWithIntl(<PartnerMarquee />);
    // Scoped to the track viewport, not the whole section — the section also
    // carries a decorative, aria-hidden golden-thread SVG (ThreadSegment)
    // that this assertion isn't about.
    const viewport = container.querySelector(".overflow-hidden");
    const hiddenWrappers = viewport!.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenWrappers.length).toBe(partners.length);
    for (const wrapper of hiddenWrappers) {
      expect(wrapper).toHaveClass("motion-reduce:hidden");
    }
  });

  it("keeps the viewport non-scrolling by default, scrollable only under reduced motion", () => {
    const { container } = renderWithIntl(<PartnerMarquee />);
    const viewport = container.querySelector(".overflow-hidden");
    expect(viewport).toHaveClass("motion-reduce:overflow-x-auto");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PartnerMarquee />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
