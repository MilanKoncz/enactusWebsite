import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Faq } from "@/components/sections/Faq";
import { faqEntries } from "@/content/faq";

describe("Faq", () => {
  it("groups the eight questions under their three categories", () => {
    renderWithIntl(<Faq />);
    expect(screen.getByText("Allgemein")).toBeInTheDocument();
    expect(screen.getByText("Bewerbung")).toBeInTheDocument();
    expect(screen.getByText("Projekte")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(faqEntries.length);
  });

  it("renders every question as a closed accordion trigger", () => {
    renderWithIntl(<Faq />);
    const first = screen.getByRole("button", { name: /Was ist Enactus Mannheim eigentlich/ });
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("opens an answer on click and marks it as unverified, not missing", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Faq />);

    const button = screen.getByRole("button", { name: /Was ist Enactus Mannheim eigentlich/ });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Enactus Mannheim ist ein studentischer Verein/)).toBeInTheDocument();
  });

  it("closes the previous question when a new one in the same category is opened", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Faq />);

    const first = screen.getByRole("button", { name: /Was ist Enactus Mannheim eigentlich/ });
    const second = screen.getByRole("button", { name: /Wie viel Zeit sollte ich/ });

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Faq />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
