import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { PartnerMembership } from "@/components/sections/PartnerMembership";

describe("PartnerMembership", () => {
  it("states the 2 euro monthly contribution", () => {
    renderWithIntl(<PartnerMembership />);
    expect(screen.getByText(/2 Euro pro Monat/)).toBeInTheDocument();
  });

  it("lists what a supporting member funds and what they get in return", () => {
    renderWithIntl(<PartnerMembership />);
    expect(
      screen.getByText("Die Umsetzung und Weiterentwicklung unserer Projekte"),
    ).toBeInTheDocument();
    expect(screen.getByText("Von steuerlich absetzbaren Beiträgen")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PartnerMembership />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
