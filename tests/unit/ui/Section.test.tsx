import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Section } from "@/components/ui/Section";

describe("Section", () => {
  it("defaults to the paper surface without a data-surface attribute", () => {
    render(
      <Section>
        <p>Inhalt</p>
      </Section>,
    );
    expect(screen.getByText("Inhalt").closest("section")).not.toHaveAttribute("data-surface");
  });

  it('sets data-surface="ink" on the ink surface, which globals.css keys the focus ring off of', () => {
    render(
      <Section surface="ink">
        <p>Inhalt</p>
      </Section>,
    );
    expect(screen.getByText("Inhalt").closest("section")).toHaveAttribute("data-surface", "ink");
  });

  it("has no accessibility violations on either surface", async () => {
    const { container } = render(
      <>
        <Section surface="paper">
          <p>Paper</p>
        </Section>
        <Section surface="ink">
          <p>Ink</p>
        </Section>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
