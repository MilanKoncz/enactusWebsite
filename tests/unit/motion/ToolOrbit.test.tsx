import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ToolOrbit } from "@/components/motion/ToolOrbit";
import { tools } from "@/content/tools";

const LABEL = "Unsere Lizenzen";

describe("ToolOrbit", () => {
  it("hides only the orbiting logos from assistive technology, not the whole component", () => {
    const { container } = render(<ToolOrbit label={LABEL} />);
    // The root itself carries real text now (the label) and must not be
    // hidden — only the rotating stage of decorative logos is.
    expect(container.firstElementChild).not.toHaveAttribute("aria-hidden");
    expect(container.querySelector(".animate-orbit-spin")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the caption as real, readable text", () => {
    render(<ToolOrbit label={LABEL} />);
    expect(screen.getByText(LABEL)).toBeInTheDocument();
  });

  it("renders every tool's logo with an empty alt, never a text label", () => {
    const { container } = render(<ToolOrbit label={LABEL} />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(tools.length);
    for (const img of images) {
      expect(img).toHaveAttribute("alt", "");
    }
  });

  it("places each logo at its own point on the circle, by translation only", () => {
    const { container } = render(<ToolOrbit label={LABEL} />);
    // Direct children of the spinning stage only — next/image's `fill` sets
    // its own inset styles further down.
    const placed = Array.from(
      container.querySelectorAll<HTMLElement>(".animate-orbit-spin > [style*='left']"),
    );
    expect(placed).toHaveLength(tools.length);

    const positions = new Set(placed.map((el) => `${el.style.left}|${el.style.top}`));
    expect(positions.size).toBe(tools.length);
  });

  // A logo hung off a rotated arm inherits that arm's angle, which is what
  // used to leave Claude upside down at the far end of the old semicircle
  // and Canva at a slant. Nothing between the stage and a logo may rotate.
  it("never rotates a logo by its position on the circle", () => {
    const { container } = render(<ToolOrbit label={LABEL} />);
    for (const element of container.querySelectorAll<HTMLElement>("[style*='rotate']")) {
      // The stage's transformOrigin is a style too, but no rotate belongs
      // anywhere in this subtree's inline styles.
      expect(element.style.transform).not.toMatch(/rotate/);
    }
  });

  it("keeps every logo upright by cancelling the stage's spin, and nothing else", () => {
    const { container } = render(<ToolOrbit label={LABEL} />);
    const counters = container.querySelectorAll(".animate-orbit-counter-spin");
    expect(counters).toHaveLength(tools.length);
    expect(container.querySelectorAll(".animate-orbit-spin")).toHaveLength(1);
  });

  // Board feedback, 2026-08-19: the circle itself stays invisible, only the
  // logos are visible — unlike the old semicircle, nothing here draws a path.
  it("never draws a visible path for the orbit", () => {
    const { container } = render(<ToolOrbit label={LABEL} />);
    expect(container.querySelectorAll("path, svg")).toHaveLength(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ToolOrbit label={LABEL} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  // Benefits.tsx renders a second, smaller instance below `md` instead of a
  // static grid — scale has to shrink the whole assembly (root box, radius,
  // and logo size together), not just the logos, or the mobile instance
  // either overflows its column or the logos start overlapping mid-orbit.
  it("scales the whole assembly down together, root box included", () => {
    const { container: full } = render(<ToolOrbit label={LABEL} />);
    const { container: compact } = render(<ToolOrbit scale={0.6} label={LABEL} />);
    const fullRoot = full.firstElementChild as HTMLElement;
    const compactRoot = compact.firstElementChild as HTMLElement;
    const fullWidth = Number.parseFloat(fullRoot.style.width);
    const compactWidth = Number.parseFloat(compactRoot.style.width);
    expect(compactWidth).toBeLessThan(fullWidth);
    expect(compactWidth / fullWidth).toBeCloseTo(0.6, 5);
  });

  it("keeps five distinct logo positions at a smaller scale too, same as full size", () => {
    const { container } = render(<ToolOrbit scale={0.6} label={LABEL} />);
    const placed = container.querySelectorAll<HTMLElement>(".animate-orbit-spin > [style*='left']");
    expect(placed).toHaveLength(tools.length);
    const positions = new Set(Array.from(placed).map((el) => `${el.style.left}|${el.style.top}`));
    expect(positions.size).toBe(tools.length);
  });

  // The property the label's own sizing math exists to guarantee: it must
  // never claim more width than the clearance between the circle's centre
  // and the nearest edge a passing logo can reach, at any scale.
  it("keeps the label narrower than the clearance a passing logo leaves at its centre", () => {
    for (const scale of [1, 0.6]) {
      const { container } = render(<ToolOrbit scale={scale} label={LABEL} />);
      const root = container.firstElementChild as HTMLElement;
      const rootWidth = Number.parseFloat(root.style.width);
      const label = screen.getAllByText(LABEL).at(-1) as HTMLElement;
      const labelWidth = Number.parseFloat(label.style.width);
      // rootWidth already includes the full logo width as clearance on
      // each side (WIDTH = RADIUS*2 + LOGO_WIDTH), so half of it is a safe
      // upper bound the label must stay well under.
      expect(labelWidth).toBeLessThan(rootWidth / 2);
    }
  });
});
