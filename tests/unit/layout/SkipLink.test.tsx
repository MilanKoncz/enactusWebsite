import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { SkipLink } from "@/components/layout/SkipLink";

describe("SkipLink", () => {
  it("renders the German label", () => {
    renderWithIntl(<SkipLink />);
    expect(screen.getByRole("link", { name: "Zum Inhalt springen" })).toBeInTheDocument();
  });

  it("points at the default main-content id", () => {
    renderWithIntl(<SkipLink />);
    expect(screen.getByRole("link", { name: "Zum Inhalt springen" })).toHaveAttribute(
      "href",
      "#inhalt",
    );
  });

  it("points at a custom target id when given one", () => {
    renderWithIntl(<SkipLink targetId="hauptinhalt" />);
    expect(screen.getByRole("link", { name: "Zum Inhalt springen" })).toHaveAttribute(
      "href",
      "#hauptinhalt",
    );
  });

  it("is the first element reached by tabbing from a fresh page", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <SkipLink />
        <button type="button">Menü öffnen</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Zum Inhalt springen" })).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<SkipLink />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
