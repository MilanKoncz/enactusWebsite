import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabSteps } from "@/components/sections/InnoLabSteps";

describe("InnoLabSteps", () => {
  it("renders all five steps as headings, in order", () => {
    renderWithIntl(<InnoLabSteps />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "Inspiration",
      "Problem-Verständnis",
      "Ideation und Marktanalyse",
      "Business Model Outline",
      "Pitch und Inno Gate",
    ]);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabSteps />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
