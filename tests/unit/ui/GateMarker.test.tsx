import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { GateMarker } from "@/components/ui/GateMarker";

describe("GateMarker", () => {
  it("renders the label as visible text by default (milestone variant)", () => {
    render(<GateMarker label="Inno Gating" />);
    expect(screen.getByText("Inno Gating")).toBeInTheDocument();
  });

  it("renders the label as visible text in the divider variant", () => {
    render(<GateMarker label="Operations Gating" variant="divider" />);
    expect(screen.getByText("Operations Gating")).toBeInTheDocument();
  });

  it("hides the decorative gold rule from assistive technology in both variants", () => {
    const { container: milestone } = render(<GateMarker label="Inno Gating" variant="milestone" />);
    expect(milestone.querySelector('[aria-hidden="true"]')).toBeInTheDocument();

    const { container: divider } = render(<GateMarker label="Operations Gating" variant="divider" />);
    expect(divider.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("exposes only the label as accessible content, not the decorative rule", () => {
    render(<GateMarker label="Inno Gating" />);
    // The label is the only text a screen reader encounters here.
    expect(screen.getByText("Inno Gating").textContent).toBe("Inno Gating");
  });

  it("renders as a plain div by default", () => {
    const { container } = render(<GateMarker label="Inno Gating" />);
    expect(container.querySelector("div")?.tagName).toBe("DIV");
    expect(container.querySelector("h3")).not.toBeInTheDocument();
  });

  it("renders as the given heading level when as is set, so it can double as a section heading", () => {
    render(<GateMarker label="Was uns einzigartig macht" as="h3" />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Was uns einzigartig macht" }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations in either variant", async () => {
    const { container } = render(
      <>
        <GateMarker label="Inno Gating" variant="milestone" />
        <GateMarker label="Operations Gating" variant="divider" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
