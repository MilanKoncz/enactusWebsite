import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabHero } from "@/components/sections/InnoLabHero";

describe("InnoLabHero", () => {
  it("renders exactly one h1", () => {
    renderWithIntl(<InnoLabHero />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("links the primary CTA to the membership application", () => {
    renderWithIntl(<InnoLabHero />);
    expect(screen.getByRole("link", { name: "Jetzt bewerben" })).toHaveAttribute("href", "/mitmachen");
  });

  it("scrolls the secondary CTA to the steps section", () => {
    renderWithIntl(<InnoLabHero />);
    expect(screen.getByRole("link", { name: "So funktioniert's" })).toHaveAttribute("href", "#schritte");
  });

  it("shows the German-language note only in English", () => {
    const { unmount } = renderWithIntl(<InnoLabHero />);
    expect(screen.queryByText(/take place in German/)).not.toBeInTheDocument();
    unmount();
    renderWithIntl(<InnoLabHero />, { locale: "en" });
    expect(screen.getByText(/take place in German/)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabHero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
