import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { GateDivider } from "@/components/sections/GateDivider";

describe("GateDivider", () => {
  it("renders the given label", () => {
    render(<GateDivider label="Kennzahlen" />);
    expect(screen.getByText("Kennzahlen")).toBeInTheDocument();
  });

  it("renders the label via the divider variant of GateMarker, centered", () => {
    const { container } = render(<GateDivider label="Kennzahlen" />);
    expect(container.querySelector(".mx-auto.flex-col")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<GateDivider label="Kennzahlen" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
