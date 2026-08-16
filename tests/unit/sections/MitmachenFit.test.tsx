import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { MitmachenFit } from "@/components/sections/MitmachenFit";

describe("MitmachenFit", () => {
  it("renders exactly one h1", () => {
    renderWithIntl(<MitmachenFit />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("defines Agency inline, not as a link", () => {
    renderWithIntl(<MitmachenFit />);
    expect(screen.getByRole("heading", { level: 3, name: "Agency" })).toBeInTheDocument();
    expect(
      screen.getByText("Die Fähigkeit, eine Situation einzuschätzen, zu entscheiden und zu handeln."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Agency/ })).not.toBeInTheDocument();
  });

  it("renders four expectations and four offers", () => {
    renderWithIntl(<MitmachenFit />);
    expect(screen.getByText("Was wir von dir erwarten")).toBeInTheDocument();
    expect(screen.getByText("Was du bekommst")).toBeInTheDocument();
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(8);
  });

  it("shows the 80% fit note prominently, not as a footnote", () => {
    renderWithIntl(<MitmachenFit />);
    expect(screen.getByText("Du musst nicht alles davon mitbringen.")).toBeInTheDocument();
    expect(screen.getByText(/Rund 80 % Übereinstimmung/)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<MitmachenFit />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
