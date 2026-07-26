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

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Card>
        <p>Grameen Bike</p>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
