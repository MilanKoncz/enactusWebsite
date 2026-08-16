import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Faq } from "@/components/sections/Faq";
import { faqEntries } from "@/content/faq";

describe("Faq", () => {
  it("groups every question under its category", () => {
    renderWithIntl(<Faq />);
    expect(screen.getByText("Allgemein")).toBeInTheDocument();
    expect(screen.getByText("Projekte")).toBeInTheDocument();
    expect(screen.getByText("Bewerbung")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(faqEntries.length);
  });

  it("orders the categories Allgemein, Projekte, Bewerbung", () => {
    renderWithIntl(<Faq />);
    const allgemein = screen.getByText("Allgemein");
    const projekte = screen.getByText("Projekte");
    const bewerbung = screen.getByText("Bewerbung");

    expect(allgemein.compareDocumentPosition(projekte) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(projekte.compareDocumentPosition(bewerbung) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders every question as a closed accordion trigger", () => {
    renderWithIntl(<Faq />);
    const first = screen.getByRole("button", { name: /Was ist Enactus Mannheim e\.V\./ });
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("opens an answer on click", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Faq />);

    const button = screen.getByRole("button", { name: /Was ist Enactus Mannheim e\.V\./ });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/eingetragener Verein von Student\*innen/)).toBeInTheDocument();
  });

  it("states plainly that the working language is German", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Faq />);

    await user.click(screen.getByRole("button", { name: /Muss ich eine bestimmte Sprache sprechen/ }));
    expect(screen.getByText(/sprechen wir Deutsch/)).toBeInTheDocument();
  });

  it("closes the previous question when a new one in the same category is opened", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Faq />);

    const first = screen.getByRole("button", { name: /Was ist Enactus Mannheim e\.V\./ });
    const second = screen.getByRole("button", { name: /Was sind Social Start-ups/ });

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
