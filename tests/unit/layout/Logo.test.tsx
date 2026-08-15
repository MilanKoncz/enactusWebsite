import { describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Logo } from "@/components/layout/Logo";
import { Link } from "@/lib/navigation";

describe("Logo", () => {
  it("renders the full variant on paper with the dark-wordmark asset by default", () => {
    const { container } = renderWithIntl(<Logo variant="full" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", expect.stringContaining("enactus-mannheim-logo-full.png"));
  });

  it("renders the full variant on ink with the light-wordmark asset", () => {
    const { container } = renderWithIntl(<Logo variant="full" surface="ink" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining("enactus-mannheim-logo-full-on-dark.png"),
    );
  });

  it("renders the compact variant with the mark asset regardless of surface", () => {
    const { container: paper } = renderWithIntl(<Logo variant="compact" />);
    const { container: ink } = renderWithIntl(<Logo variant="compact" surface="ink" />);
    for (const container of [paper, ink]) {
      const img = container.querySelector("img");
      expect(img).toHaveAttribute("src", expect.stringContaining("enactus-mannheim-logo-mark.png"));
    }
  });

  it("is purely decorative, since the wrapping link carries the accessible name", () => {
    const { container } = renderWithIntl(<Logo variant="full" />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
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
