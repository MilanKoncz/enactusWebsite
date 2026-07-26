import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Eyebrow } from "@/components/ui/Eyebrow";

describe("Eyebrow", () => {
  it("renders its text", () => {
    render(<Eyebrow>Inno Gating</Eyebrow>);
    expect(screen.getByText("Inno Gating")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Eyebrow>Inno Gating</Eyebrow>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
