import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { LinkCard } from "@/components/ui/LinkCard";

describe("LinkCard", () => {
  it("renders an external link with the title, opening in a new tab", () => {
    render(<LinkCard href="https://mealyo.de" title="mealyo.de" />);
    const link = screen.getByRole("link", { name: "mealyo.de" });
    expect(link).toHaveAttribute("href", "https://mealyo.de");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows an eyebrow label above the title when given one", () => {
    render(<LinkCard href="https://mealyo.de" eyebrow="Projektwebsite besuchen" title="mealyo.de" />);
    expect(screen.getByText("Projektwebsite besuchen")).toBeInTheDocument();
    expect(screen.getByText("mealyo.de")).toBeInTheDocument();
  });

  it("uses an explicit aria-label as the accessible name when given one", () => {
    render(<LinkCard href="https://mealyo.de" title="mealyo.de" ariaLabel="Zur Mealyo-Website" />);
    expect(screen.getByRole("link", { name: "Zur Mealyo-Website" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <LinkCard href="https://mealyo.de" eyebrow="Projektwebsite besuchen" title="mealyo.de" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
