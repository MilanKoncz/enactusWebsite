import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { ToolOrbit } from "@/components/motion/ToolOrbit";
import { tools } from "@/content/tools";

describe("ToolOrbit", () => {
  it("is hidden from assistive technology — purely decorative", () => {
    const { container } = render(<ToolOrbit />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders every tool's logo with an empty alt, never a text label", () => {
    const { container } = render(<ToolOrbit />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(tools.length);
    for (const img of images) {
      expect(img).toHaveAttribute("alt", "");
    }
  });

  it("places each logo at its own point on the arc, by translation only", () => {
    const { container } = render(<ToolOrbit />);
    // Direct children of the swaying stage only — next/image's `fill` sets
    // its own inset styles further down.
    const placed = Array.from(
      container.querySelectorAll<HTMLElement>(".animate-orbit-sway > [style*='left']"),
    );
    expect(placed).toHaveLength(tools.length);

    const positions = new Set(placed.map((el) => `${el.style.left}|${el.style.top}`));
    expect(positions.size).toBe(tools.length);
  });

  // A logo hung off a rotated arm inherits that arm's angle, which is what
  // used to leave Claude upside down at the far end of the arc and Canva at
  // a slant. Nothing between the stage and a logo may rotate.
  it("never rotates a logo by its position on the arc", () => {
    const { container } = render(<ToolOrbit />);
    for (const element of container.querySelectorAll<HTMLElement>("[style*='rotate']")) {
      // The stage's transformOrigin is a style too, but no rotate belongs
      // anywhere in this subtree's inline styles.
      expect(element.style.transform).not.toMatch(/rotate/);
    }
  });

  it("keeps every logo upright by cancelling the stage's sway, and nothing else", () => {
    const { container } = render(<ToolOrbit />);
    const counters = container.querySelectorAll(".animate-orbit-counter-sway");
    expect(counters).toHaveLength(tools.length);
    expect(container.querySelectorAll(".animate-orbit-sway")).toHaveLength(1);
  });

  // "Nur zwei gelbe Striche im Nichts" was the arc not being drawn at all.
  it("draws the semicircle itself as one unbroken gold path", () => {
    const { container } = render(<ToolOrbit />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(1);
    const path = paths[0];
    // A single elliptical arc command, so the curve can never be segmented.
    expect(path.getAttribute("d")).toMatch(/^M [\d.]+,[\d.]+ A [\d.]+,[\d.]+ 0 0 1 [\d.]+,[\d.]+$/);
    expect(path).toHaveAttribute("stroke", "var(--color-gold)");
    expect(path).toHaveAttribute("stroke-width", "2");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ToolOrbit />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
