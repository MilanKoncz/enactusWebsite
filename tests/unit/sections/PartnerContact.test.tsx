import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { PartnerContact } from "@/components/sections/PartnerContact";

describe("PartnerContact", () => {
  it("links to the shared team mailbox, not a form that doesn't exist", () => {
    renderWithIntl(<PartnerContact />);
    const link = screen.getByRole("link", { name: "E-Mail schreiben" });
    expect(link).toHaveAttribute("href", "mailto:teamvorstand@unimannheim.enactus.team");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PartnerContact />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
