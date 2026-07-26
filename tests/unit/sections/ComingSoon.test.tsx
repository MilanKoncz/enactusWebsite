import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ComingSoon } from "@/components/sections/ComingSoon";

describe("ComingSoon", () => {
  it("renders exactly one h1 with the given title", () => {
    renderWithIntl(<ComingSoon title="Prozess" />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Prozess");
  });

  it("renders the shared coming-soon note when no description is given", () => {
    renderWithIntl(<ComingSoon title="Prozess" />);
    expect(
      screen.getByText("Diese Seite entsteht gerade. Bald steht hier mehr."),
    ).toBeInTheDocument();
  });

  it("renders a custom description instead of the shared note when given one", () => {
    renderWithIntl(<ComingSoon title="Startseite" description="Individueller Hinweistext" />);
    expect(screen.getByText("Individueller Hinweistext")).toBeInTheDocument();
    expect(
      screen.queryByText("Diese Seite entsteht gerade. Bald steht hier mehr."),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ComingSoon title="Prozess" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
