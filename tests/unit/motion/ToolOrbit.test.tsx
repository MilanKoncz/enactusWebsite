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

  it("places each logo at its own fixed angle along the arc", () => {
    const { container } = render(<ToolOrbit />);
    const arms = container.querySelectorAll("[style*='rotate']");
    expect(arms).toHaveLength(tools.length);
    const angles = new Set(Array.from(arms).map((el) => (el as HTMLElement).style.transform));
    expect(angles.size).toBe(tools.length);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ToolOrbit />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
