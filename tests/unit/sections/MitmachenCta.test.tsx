import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { MitmachenCta } from "@/components/sections/MitmachenCta";

describe("MitmachenCta", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("scrolls to the application section instead of linking to /mitmachen again", async () => {
    mockMatchMedia(false);
    const target = document.createElement("div");
    target.id = "bewerbung";
    document.body.appendChild(target);
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    renderWithIntl(<MitmachenCta />);
    await user.click(screen.getByRole("button", { name: "Zur Bewerbung" }));

    expect(scrollIntoView).toHaveBeenCalled();
    document.body.removeChild(target);
  });

  it("links the secondary action to /prozess", () => {
    mockMatchMedia(false);
    renderWithIntl(<MitmachenCta />);
    expect(screen.getByRole("link", { name: "Prozess kennenlernen" })).toHaveAttribute("href", "/prozess");
  });

  it("has no accessibility violations", async () => {
    mockMatchMedia(false);
    const { container } = renderWithIntl(<MitmachenCta />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
