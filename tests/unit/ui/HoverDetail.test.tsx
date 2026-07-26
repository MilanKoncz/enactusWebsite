import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { HoverDetail } from "@/components/ui/HoverDetail";

describe("HoverDetail", () => {
  it("renders its children as visible text", () => {
    render(<HoverDetail>Ein erklärender Detailtext.</HoverDetail>);
    expect(screen.getByText("Ein erklärender Detailtext.")).toBeInTheDocument();
  });

  it("is visible by default (opacity-60), not hidden", () => {
    render(<HoverDetail>Detail</HoverDetail>);
    expect(screen.getByText("Detail")).toHaveClass("opacity-60");
  });

  it("only hides behind the desktop-hover variant, never unconditionally", () => {
    render(<HoverDetail>Detail</HoverDetail>);
    const el = screen.getByText("Detail");
    expect(el.className).toContain("desktop-hover:opacity-0");
    expect(el.className).toContain("desktop-hover:group-hover:opacity-100");
    expect(el.className).toContain("desktop-hover:group-focus-within:opacity-100");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<HoverDetail>Detail</HoverDetail>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
