import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Container } from "@/components/ui/Container";

describe("Container", () => {
  it("renders its children", () => {
    render(
      <Container>
        <p>Enactus Mannheim</p>
      </Container>,
    );
    expect(screen.getByText("Enactus Mannheim")).toBeInTheDocument();
  });

  it("forwards native div props", () => {
    render(
      <Container id="hauptinhalt">
        <p>Inhalt</p>
      </Container>,
    );
    expect(screen.getByText("Inhalt").parentElement).toHaveAttribute("id", "hauptinhalt");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Container>
        <p>Enactus Mannheim</p>
      </Container>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
