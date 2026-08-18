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

  it("renders a single 2px non-scaling path, and doesn't render at all below md", () => {
    const { container } = render(<ThreadSegment stop="kpis" />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(1);
    expect(paths[0]).toHaveAttribute("vector-effect", "non-scaling-stroke");
    expect(paths[0]).toHaveAttribute("stroke-width", "2");
    expect(container.querySelector("svg")).toHaveClass("hidden", "md:block");
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
