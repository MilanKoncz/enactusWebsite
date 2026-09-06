import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { InnoLabFaq } from "@/components/sections/InnoLabFaq";

describe("InnoLabFaq", () => {
  it("renders all five questions, collapsed by default", () => {
    renderWithIntl(<InnoLabFaq />);
    const trigger = screen.getByRole("button", { name: /Muss ich schon eine fertige Idee/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("expands an entry's answer on click", async () => {
    const user = userEvent.setup();
    renderWithIntl(<InnoLabFaq />);
    const trigger = screen.getByRole("button", { name: /Kostet das etwas/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Die Teilnahme am InnoLab/)).toBeVisible();
  });

  it("names Philip Strobl as the direct contact", () => {
    renderWithIntl(<InnoLabFaq />);
    expect(screen.getByText("Philip Strobl")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nachricht schreiben" })).toHaveAttribute(
      "href",
      "mailto:philip.strobl@unimannheim.enactus.team",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<InnoLabFaq />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
