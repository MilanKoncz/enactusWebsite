import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { ThreadSegment } from "@/components/motion/ThreadSegment";

describe("ThreadSegment", () => {
  it("is decorative: aria-hidden and outside the tab order", () => {
    const { container } = render(<ThreadSegment stop="kpis" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
    expect(container.querySelectorAll("a, button, input, select, textarea")).toHaveLength(0);
  });

  it("never intercepts pointer events meant for the section's real content", () => {
    const { container } = render(<ThreadSegment stop="kpis" />);
    expect(container.querySelector("svg")).toHaveClass("pointer-events-none");
  });

  it("normalizes both the wide and narrow paths to the same length for the dash animation", () => {
    const { container } = render(<ThreadSegment stop="kpis" />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    for (const path of paths) {
      expect(path).toHaveAttribute("pathLength", "100");
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ThreadSegment stop="board" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
