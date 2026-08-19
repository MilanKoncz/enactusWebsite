import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { PartnerTiers } from "@/components/sections/PartnerTiers";

describe("PartnerTiers", () => {
  it("renders all four tier headings in the canonical order", () => {
    renderWithIntl(<PartnerTiers />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "Knowledge Partner",
      "Flagship Partner",
      "Sponsoring Partner",
      "Advisor",
    ]);
  });

  it("links a partner logo to its confirmed website", () => {
    renderWithIntl(<PartnerTiers />);
    const link = screen.getByRole("link", { name: "Website von SZA öffnet in neuem Tab" });
    expect(link).toHaveAttribute("href", "https://www.sza.de/");
    expect(link).toHaveAttribute("target", "_blank");
  });

  // MCEI and HTGF both have a real logo but no confirmed url — see
  // content/partners.ts and ASSETS-TODO.md, which tracks the open question.
  // The tile renders exactly like every confirmed partner's (no visible
  // caption calling out the gap), just not wrapped in a link; the name still
  // reaches a screen reader as the tile's only accessible text.
  it("renders an unconfirmed-url partner's tile without a link, and without a visible name caption", () => {
    const { container } = renderWithIntl(<PartnerTiers />);
    expect(screen.queryByRole("link", { name: /MCEI/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /HTGF/ })).not.toBeInTheDocument();

    const mceiName = screen.getByText("MCEI");
    expect(mceiName).toHaveClass("sr-only");
    const htgfName = screen.getByText("HTGF");
    expect(htgfName).toHaveClass("sr-only");

    // PlaceholderMark sets a `title` tooltip on its wrapping span — asserting
    // none exists confirms the dashed-border caption is gone, not just
    // visually but structurally.
    expect(container.querySelectorAll("[title]")).toHaveLength(0);
  });

  it("shows an empty-state note for the Advisor tier, which has no partner yet", () => {
    renderWithIntl(<PartnerTiers />);
    expect(screen.getByText("Noch kein Advisor-Partner öffentlich bestätigt.")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PartnerTiers />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
