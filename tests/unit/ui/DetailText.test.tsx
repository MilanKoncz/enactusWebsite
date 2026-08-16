import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { DetailText } from "@/components/ui/DetailText";

describe("DetailText", () => {
  it("renders its text as a paragraph", () => {
    render(<DetailText>Ein ergänzender Satz.</DetailText>);
    expect(screen.getByText("Ein ergänzender Satz.").tagName).toBe("P");
  });

  // The whole point of replacing HoverDetail: the text is never conditional
  // on a pointer state, on any device or at any width.
  it("carries no hover-conditional visibility class", () => {
    const { container } = render(<DetailText>Detail</DetailText>);
    const paragraph = container.querySelector("p")!;
    expect(paragraph.className).not.toMatch(/opacity-0/);
    expect(paragraph.className).not.toMatch(/hover/);
    expect(paragraph.className).not.toMatch(/desktop-hover/);
  });

  it("keeps the muted styling and accepts extra classes", () => {
    const { container } = render(<DetailText className="mt-2">Detail</DetailText>);
    const paragraph = container.querySelector("p")!;
    expect(paragraph).toHaveClass("opacity-60");
    expect(paragraph).toHaveClass("mt-2");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<DetailText>Detail</DetailText>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
