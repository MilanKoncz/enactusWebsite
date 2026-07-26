import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

function SmokeComponent() {
  return <p>Vitest and Testing Library are wired up.</p>;
}

describe("test setup", () => {
  it("renders with Testing Library under jsdom", () => {
    render(<SmokeComponent />);
    expect(screen.getByText(/wired up/i)).toBeInTheDocument();
  });

  it("runs axe accessibility checks", async () => {
    const { container } = render(<SmokeComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
