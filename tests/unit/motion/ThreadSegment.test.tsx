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

  it("renders a wide path at 2px and a narrow (mobile) path at 1px, both non-scaling", () => {
    const { container } = render(<ThreadSegment stop="kpis" />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    for (const path of paths) {
      expect(path).toHaveAttribute("vector-effect", "non-scaling-stroke");
    }
    const widePath = container.querySelector("path.hidden.md\\:block");
    const narrowPath = container.querySelector("path.md\\:hidden");
    expect(widePath).toHaveAttribute("stroke-width", "2");
    expect(narrowPath).toHaveAttribute("stroke-width", "1");
  });

  // The reveal has to clip the svg box, not dash the path: non-scaling-stroke
  // resolves stroke-dasharray in screen pixels, which broke every segment
  // longer than the dash into fragments. See .thread-reveal in globals.css.
  it("carries the scroll reveal on the svg box rather than on the paths", () => {
    const { container } = render(<ThreadSegment stop="kpis" />);
    expect(container.querySelector("svg")).toHaveClass("thread-reveal");
    for (const path of container.querySelectorAll("path")) {
      expect(path).not.toHaveAttribute("pathLength");
      expect(path).not.toHaveClass("thread-reveal");
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ThreadSegment stop="board" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
