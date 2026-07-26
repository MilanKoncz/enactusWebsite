import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Logo } from "@/components/layout/Logo";
import { Link } from "@/lib/navigation";

describe("Logo", () => {
  it("renders the full variant", () => {
    renderWithIntl(<Logo variant="full" />);
    expect(screen.getByText("Enactus Mannheim")).toBeInTheDocument();
  });

  it("renders the compact variant", () => {
    renderWithIntl(<Logo variant="compact" />);
    expect(screen.getByText("EM")).toBeInTheDocument();
  });

  it("is hidden from assistive technology, since the wrapping link carries the accessible name", () => {
    const { container } = renderWithIntl(<Logo variant="full" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("has no accessibility violations inside a labelled link", async () => {
    const { container } = renderWithIntl(
      <Link href="/" aria-label="Zur Startseite">
        <Logo variant="full" />
      </Link>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
