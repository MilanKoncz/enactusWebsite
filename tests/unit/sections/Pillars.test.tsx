import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Pillars, PILLAR_IMAGE_FIT } from "@/components/sections/Pillars";
import { pillars } from "@/content/pillars";

describe("Pillars", () => {
  it("renders the section heading", () => {
    renderWithIntl(<Pillars />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Was uns einzigartig macht" }),
    ).toBeInTheDocument();
  });

  it("renders each pillar's title as its own h3, via the gate marker", () => {
    renderWithIntl(<Pillars />);
    expect(screen.getByRole("heading", { level: 3, name: "ESG-Charakter" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Risikofreies Umsetzen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Internationales Netzwerk" }),
    ).toBeInTheDocument();
  });

  it("always renders each pillar's lead sentence", () => {
    renderWithIntl(<Pillars />);
    // The ESG pillar's lead is split across text and an inline SDG link
    // (see the dedicated link test below), so it's matched by the
    // paragraph's combined textContent rather than screen.getByText's
    // single-text-node matching.
    const esgLead = screen
      .getByRole("heading", { level: 3, name: "ESG-Charakter" })
      .closest(".hover-grow")!
      .querySelector("p");
    expect(esgLead).toHaveTextContent(
      "Jedes Projekt zahlt auf ein UN-Nachhaltigkeitsziel ein, nicht nur auf eine Geschäftsidee.",
    );
    expect(
      screen.getByText(
        "Ihr gründet ein echtes Unternehmen, ohne das persönliche Risiko einer Gründung zu tragen.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the detail sentence in the document regardless of hover state", () => {
    renderWithIntl(<Pillars />);
    expect(
      screen.getByText(
        "Wir wählen Projekte danach aus, welches SDG sie voranbringen. Wirkung ist die Eintrittskarte, nicht ein Zusatz am Ende.",
      ),
    ).toBeInTheDocument();
  });

  // No tab stop on the column: it holds nothing interactive now that the
  // detail sentence is permanent, and a focus stop that only grows a box is
  // noise in the tab order.
  it("adds no tab stop of its own around a pillar column", () => {
    const { container } = renderWithIntl(<Pillars />);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
  });

  it("grows the column on hover instead of revealing anything", () => {
    renderWithIntl(<Pillars />);
    const column = screen
      .getByRole("heading", { level: 3, name: "ESG-Charakter" })
      .closest(".hover-grow");
    expect(column).toBeInTheDocument();
  });

  it("renders each column's background photo", () => {
    const { container } = renderWithIntl(<Pillars />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(pillars.length);
    for (const pillar of pillars) {
      expect(container.querySelector(`img[src*="${encodeURIComponent(pillar.image!)}"]`)).toBeInTheDocument();
    }
  });

  it("shows the ESG wheel whole (object-contain) and the two photos cropped (object-cover)", () => {
    const { container } = renderWithIntl(<Pillars />);
    for (const pillar of pillars) {
      const img = container.querySelector(`img[src*="${encodeURIComponent(pillar.image!)}"]`);
      const expectedClass = PILLAR_IMAGE_FIT[pillar.key] === "contain" ? "object-contain" : "object-cover";
      expect(img).toHaveClass(expectedClass);
    }
  });

  it("keeps the heading, lead, and detail in a positioned wrapper after the photo, so they always paint above it", () => {
    renderWithIntl(<Pillars />);
    const heading = screen.getByRole("heading", { level: 3, name: "ESG-Charakter" });
    const column = heading.closest(".hover-grow")!;
    const textWrapper = heading.parentElement!;
    expect(textWrapper).toHaveClass("relative");
    // The photo and its scrim are the column's first two children; the text
    // wrapper must come after both in DOM order — painting order for
    // same-stack-level positioned boxes follows DOM order, so this ordering
    // is what keeps the text on top, not merely an implementation detail.
    expect(Array.from(column.children).indexOf(textWrapper)).toBe(column.children.length - 1);
  });

  it("links the SDG reference in the ESG pillar's lead sentence to the official UN goals page", () => {
    renderWithIntl(<Pillars />);
    const link = screen.getByRole("link", { name: "UN-Nachhaltigkeitsziel" });
    expect(link).toHaveAttribute("href", "https://sdgs.un.org/goals");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Pillars />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
