import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ClosingCta } from "@/components/sections/ClosingCta";

describe("ClosingCta", () => {
  it("renders the section heading and lead sentence", () => {
    renderWithIntl(<ClosingCta />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Werde Teil des nächsten Projekts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bewirb dich, wenn du wirklich etwas umsetzen willst — nicht nur darüber reden."),
    ).toBeInTheDocument();
  });

  it("renders the primary CTA linking to the application route", () => {
    renderWithIntl(<ClosingCta />);
    expect(screen.getByRole("link", { name: "Jetzt bewerben" })).toHaveAttribute(
      "href",
      "/mitmachen",
    );
  });

  it("renders a secondary link to the process page", () => {
    renderWithIntl(<ClosingCta />);
    expect(screen.getByRole("link", { name: "Prozess kennenlernen" })).toHaveAttribute(
      "href",
      "/prozess",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ClosingCta />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
