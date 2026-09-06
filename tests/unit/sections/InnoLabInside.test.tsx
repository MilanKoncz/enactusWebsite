import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabInside } from "@/components/sections/InnoLabInside";

describe("InnoLabInside", () => {
  it("renders all three items", () => {
    renderWithIntl(<InnoLabInside />);
    expect(screen.getByRole("heading", { level: 3, name: "Wöchentliche Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Advisor-Zugang" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Inno Gating" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabInside />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
