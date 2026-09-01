import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { HeaderSocialLinks } from "@/components/layout/HeaderSocialLinks";

describe("HeaderSocialLinks", () => {
  it("exposes a labelled group with WhatsApp and Instagram, in that order", () => {
    renderWithIntl(<HeaderSocialLinks />);
    const group = screen.getByRole("group", { name: "Social Media" });
    const links = within(group).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName("WhatsApp-Community (öffnet in einem neuen Tab)");
    expect(links[1]).toHaveAccessibleName("Instagram (öffnet in einem neuen Tab)");
  });

  it("points WhatsApp at the community invite, target=_blank, noopener", () => {
    renderWithIntl(<HeaderSocialLinks />);
    const link = screen.getByRole("link", { name: "WhatsApp-Community (öffnet in einem neuen Tab)" });
    expect(link).toHaveAttribute("href", "https://chat.whatsapp.com/FplqECI7eYL2CmoxR2OR2Q");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("points Instagram at the existing profile, target=_blank, noopener", () => {
    renderWithIntl(<HeaderSocialLinks />);
    const link = screen.getByRole("link", { name: "Instagram (öffnet in einem neuen Tab)" });
    expect(link).toHaveAttribute("href", "https://www.instagram.com/enactus_mannheim/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders a real icon inside each link", () => {
    renderWithIntl(<HeaderSocialLinks />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("is reachable and activatable by keyboard", async () => {
    const user = userEvent.setup();
    renderWithIntl(<HeaderSocialLinks />);
    const whatsapp = screen.getByRole("link", { name: "WhatsApp-Community (öffnet in einem neuen Tab)" });
    whatsapp.focus();
    expect(whatsapp).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Instagram (öffnet in einem neuen Tab)" })).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<HeaderSocialLinks />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
