import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Placeholder } from "@/components/ui/Placeholder";

describe("Placeholder", () => {
  it("renders kind, label and note as visible text", () => {
    render(
      <Placeholder kind="Foto" label="Team-Gruppenfoto" note="Warten auf Fotografen, Stand Juli 2026" />,
    );
    expect(screen.getByText("Foto")).toBeInTheDocument();
    expect(screen.getByText("Team-Gruppenfoto")).toBeInTheDocument();
    expect(screen.getByText("Warten auf Fotografen, Stand Juli 2026")).toBeInTheDocument();
  });

  it("renders without a note when none is given", () => {
    render(<Placeholder kind="Video" label="Hero-Video" />);
    expect(screen.getByText("Hero-Video")).toBeInTheDocument();
  });

  it("applies the target aspect ratio as an inline style", () => {
    render(<Placeholder kind="Video" label="Hero-Video" ratio="16 / 9" />);
    expect(screen.getByText("Hero-Video").closest("div")).toHaveStyle({ aspectRatio: "16 / 9" });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Placeholder kind="Foto" label="Team-Gruppenfoto" ratio="1 / 1" note="Platzhalter" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
