import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { EventFormats } from "@/components/sections/EventFormats";

// Tall, static cards (2026-08-18): every format is readable at a glance now,
// no click needed — replaced the earlier Tabs/Accordion pair that hid the
// detail text behind a selection, back when that text was still a
// BESCHREIBUNG_FEHLT placeholder.
describe("EventFormats", () => {
  it("renders all four formats with their title and detail text", () => {
    renderWithIntl(<EventFormats />);
    expect(screen.getByRole("heading", { name: "Socials" })).toBeInTheDocument();
    expect(
      screen.getByText("Wir veranstalten wie viele Initiativen Socials wie Running Dinners und gemeinsame Barabende."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Workshops" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Teamwochenende" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Semesterabschluss" })).toBeInTheDocument();
  });

  it("renders a real photo for all four formats, none left as a placeholder", () => {
    const { container } = renderWithIntl(<EventFormats />);
    expect(container.querySelectorAll('img[src*="socials.webp"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('img[src*="workshops.webp"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('img[src*="teamweekend.webp"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('img[src*="gala.webp"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("Bild")).not.toBeInTheDocument();
  });

  it("gives the teamweekend photo real, descriptive alt text — the others stay decorative", () => {
    const { container } = renderWithIntl(<EventFormats />);
    const teamweekendImg = container.querySelector('img[src*="teamweekend.webp"]');
    expect(teamweekendImg).toHaveAttribute("alt", expect.stringContaining("ENACTUS"));
    for (const src of ["socials.webp", "workshops.webp", "gala.webp"]) {
      expect(container.querySelector(`img[src*="${src}"]`)).toHaveAttribute("alt", "");
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<EventFormats />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
