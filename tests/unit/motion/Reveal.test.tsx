import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Reveal } from "@/components/motion/Reveal";

describe("Reveal", () => {
  it("renders its children", () => {
    render(
      <Reveal>
        <p>ESG-Charakter</p>
      </Reveal>,
    );
    expect(screen.getByText("ESG-Charakter")).toBeInTheDocument();
  });

  it("applies the reveal utility class, not an inline style", () => {
    render(
      <Reveal>
        <p>Inhalt</p>
      </Reveal>,
    );
    expect(screen.getByText("Inhalt").parentElement).toHaveClass("reveal");
  });

  it("renders children visible regardless of scroll-driven animation support", () => {
    // jsdom has no layout/animation engine, so this only proves the markup
    // never hides content itself — the base rule in globals.css (not
    // reproduced here) is what keeps it visible without @supports.
    const { container } = render(
      <Reveal>
        <p>Inhalt</p>
      </Reveal>,
    );
    expect(container.querySelector(".reveal")).not.toHaveAttribute("hidden");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Reveal>
        <p>Inhalt</p>
      </Reveal>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
