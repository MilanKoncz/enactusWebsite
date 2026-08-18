import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";

describe("PlaceholderMark", () => {
  it("renders its children as visible text", () => {
    render(<PlaceholderMark hint="Diese Angabe ist noch nicht verfügbar.">PARTNER_1</PlaceholderMark>);
    expect(screen.getByText("PARTNER_1")).toBeInTheDocument();
  });

  it("defaults to the missing variant", () => {
    render(<PlaceholderMark hint="Fehlt">PARTNER_1</PlaceholderMark>);
    expect(screen.getByText("PARTNER_1").closest("span")).toHaveClass("border-dashed");
  });

  it("renders the unverified variant with a dotted underline instead of a dashed box", () => {
    render(
      <PlaceholderMark variant="unverified" hint="Unbestätigt">
        8
      </PlaceholderMark>,
    );
    const mark = screen.getByText("8").closest("span");
    expect(mark).toHaveClass("border-dotted");
    expect(mark).not.toHaveClass("border-dashed");
  });

  it("exposes the hint as a title attribute for a mouse tooltip", () => {
    render(<PlaceholderMark hint="Diese Angabe ist noch nicht verfügbar.">PARTNER_1</PlaceholderMark>);
    expect(screen.getByText("PARTNER_1").closest("span")).toHaveAttribute(
      "title",
      "Diese Angabe ist noch nicht verfügbar.",
    );
  });

  it("appends the hint as visually-hidden text for screen readers", () => {
    render(<PlaceholderMark hint="Diese Angabe ist noch nicht verfügbar.">PARTNER_1</PlaceholderMark>);
    const mark = screen.getByText("PARTNER_1").closest("span")!;
    expect(mark).toHaveTextContent("PARTNER_1. Diese Angabe ist noch nicht verfügbar.");
    expect(mark.querySelector(".sr-only")).toHaveTextContent("Diese Angabe ist noch nicht verfügbar.");
  });

  it("has no accessibility violations in either variant", async () => {
    const { container } = render(
      <>
        <PlaceholderMark hint="Diese Angabe ist noch nicht verfügbar.">PARTNER_1</PlaceholderMark>
        <PlaceholderMark variant="unverified" hint="Unbestätigt">
          8
        </PlaceholderMark>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
