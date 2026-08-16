import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders its children", () => {
    render(
      <Card>
        <p>Grameen Bike</p>
      </Card>,
    );
    expect(screen.getByText("Grameen Bike")).toBeInTheDocument();
  });

  it("defaults to the lift interaction", () => {
    const { container } = render(<Card>Card</Card>);
    const card = container.firstElementChild!;
    expect(card).toHaveClass("hover:-translate-y-px");
    expect(card).not.toHaveClass("hover-grow");
  });

  it("takes the grow interaction instead when asked for it", () => {
    const { container } = render(<Card interaction="grow">Card</Card>);
    const card = container.firstElementChild!;
    expect(card).toHaveClass("hover-grow");
    expect(card).not.toHaveClass("hover:-translate-y-px");
  });

  // A fill would hide the golden thread where the two overlap; the section
  // underneath already paints the same surface.
  it("is defined by its border, without an opaque fill of its own", () => {
    const { container } = render(<Card>Card</Card>);
    const card = container.firstElementChild!;
    expect(card).toHaveClass("border-ink/10");
    expect(card.className).not.toMatch(/\bbg-/);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Card>
        <p>Grameen Bike</p>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
