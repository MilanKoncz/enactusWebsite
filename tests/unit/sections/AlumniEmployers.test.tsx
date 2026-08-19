import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { AlumniEmployers } from "@/components/sections/AlumniEmployers";
import { alumniEmployers } from "@/content/alumniEmployers";

describe("AlumniEmployers", () => {
  it("renders the heading", () => {
    renderWithIntl(<AlumniEmployers />);
    expect(screen.getByRole("heading", { name: "Wo unsere Alumni heute arbeiten" })).toBeInTheDocument();
  });

  it("renders every employer's logo once, labeled with its company name", () => {
    renderWithIntl(<AlumniEmployers />);
    for (const employer of alumniEmployers) {
      expect(screen.getByAltText(employer.name)).toBeInTheDocument();
    }
  });

  it("never links a logo anywhere — this is a fact, not a partnership claim", () => {
    const { container } = renderWithIntl(<AlumniEmployers />);
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<AlumniEmployers />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
