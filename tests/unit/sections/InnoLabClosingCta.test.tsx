import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabClosingCta } from "@/components/sections/InnoLabClosingCta";

describe("InnoLabClosingCta", () => {
  it("renders the primary CTA linking to the application route", () => {
    renderWithIntl(<InnoLabClosingCta />);
    expect(screen.getByRole("link", { name: "Jetzt bewerben" })).toHaveAttribute("href", "/mitmachen");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabClosingCta />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
