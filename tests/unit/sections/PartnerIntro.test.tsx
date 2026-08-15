import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { PartnerIntro } from "@/components/sections/PartnerIntro";

describe("PartnerIntro", () => {
  it("renders the page heading and the four partner benefits", () => {
    renderWithIntl(<PartnerIntro />);
    expect(screen.getByRole("heading", { level: 1, name: "Ein Netzwerk. Eine Vision." })).toBeInTheDocument();
    for (const title of ["Recruiting", "Image", "Publicity", "Philanthropie"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("pulls the real benefit copy from the old site, not placeholder text", () => {
    renderWithIntl(<PartnerIntro />);
    expect(
      screen.getByText(/Unser Verein besteht aus hochqualifizierten Studierenden/),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PartnerIntro />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
