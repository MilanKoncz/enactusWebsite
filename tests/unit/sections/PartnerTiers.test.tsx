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

  it("marks the one partner without a confirmed website as a placeholder, not a dead link", () => {
    renderWithIntl(<PartnerTiers />);
    expect(screen.queryByRole("link", { name: /MCEI/ })).not.toBeInTheDocument();
    expect(screen.getByText("MCEI")).toBeInTheDocument();
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
