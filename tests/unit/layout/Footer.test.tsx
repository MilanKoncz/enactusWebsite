import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";

vi.mock("@/content/navigation", async () => {
  const actual = await vi.importActual<typeof import("@/content/navigation")>(
    "@/content/navigation",
  );
  return {
    ...actual,
    networkLinks: [
      { key: "enactusGermany", href: "https://www.enactus.de" },
      { key: "enactusGlobal", href: null },
    ],
  };
});

const { Footer } = await import("@/components/layout/Footer");

describe("Footer", () => {
  it("exposes a contentinfo landmark containing the claim", () => {
    renderWithIntl(<Footer />);
    expect(
      within(screen.getByRole("contentinfo")).getByText("Entrepreneurial. Action. Us."),
    ).toBeInTheDocument();
  });

  it("renders all three columns with correct internal hrefs", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole("link", { name: "Partner" })).toHaveAttribute("href", "/partner");
    expect(screen.getByRole("link", { name: "Prozess" })).toHaveAttribute("href", "/prozess");
    expect(screen.getByRole("link", { name: "Impressum" })).toHaveAttribute("href", "/impressum");
    expect(screen.getByRole("link", { name: "Datenschutz" })).toHaveAttribute(
      "href",
      "/datenschutz",
    );
  });

  it("renders a confirmed external link as a real link, target=_blank", () => {
    renderWithIntl(<Footer />);
    const link = screen.getByRole("link", { name: "Enactus Germany" });
    expect(link).toHaveAttribute("href", "https://www.enactus.de");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders an unconfirmed external link as a Placeholder, not a dead link", () => {
    renderWithIntl(<Footer />);
    expect(screen.queryByRole("link", { name: "Enactus Global" })).not.toBeInTheDocument();
    expect(screen.getByText("Enactus Global")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Footer />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
