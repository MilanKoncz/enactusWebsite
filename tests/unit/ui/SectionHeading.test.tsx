import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { SectionHeading } from "@/components/ui/SectionHeading";

describe("SectionHeading", () => {
  it("renders the eyebrow and title", () => {
    render(<SectionHeading eyebrow="Prozess" title="Was uns einzigartig macht" />);
    expect(screen.getByText("Prozess")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Was uns einzigartig macht" })).toBeInTheDocument();
  });

  it("renders as h2 by default", () => {
    render(<SectionHeading eyebrow="Prozess" title="Titel" />);
    expect(screen.getByRole("heading", { level: 2, name: "Titel" })).toBeInTheDocument();
  });

  it("renders as h1 when as='h1' is given", () => {
    render(<SectionHeading eyebrow="Prozess" title="Titel" as="h1" />);
    expect(screen.getByRole("heading", { level: 1, name: "Titel" })).toBeInTheDocument();
  });

  it("renders the lead sentence when given", () => {
    render(<SectionHeading eyebrow="Prozess" title="Titel" lead="Ein erklärender Satz." />);
    expect(screen.getByText("Ein erklärender Satz.")).toBeInTheDocument();
  });

  it("renders without a lead sentence when none is given", () => {
    const { container } = render(<SectionHeading eyebrow="Prozess" title="Titel" />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SectionHeading eyebrow="Prozess" title="Titel" lead="Ein erklärender Satz." />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
