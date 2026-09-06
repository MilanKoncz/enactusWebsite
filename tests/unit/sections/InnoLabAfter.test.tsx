import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabAfter } from "@/components/sections/InnoLabAfter";

describe("InnoLabAfter", () => {
  it("links to the process page", () => {
    renderWithIntl(<InnoLabAfter />);
    expect(screen.getByRole("link", { name: "Prozess-Seite" })).toHaveAttribute("href", "/prozess");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabAfter />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
