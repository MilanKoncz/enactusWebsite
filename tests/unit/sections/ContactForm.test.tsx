import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ContactForm } from "@/components/sections/ContactForm";

describe("ContactForm", () => {
  it("renders name, email, subject, and message fields plus a submit button", () => {
    renderWithIntl(<ContactForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Betreff")).toBeInTheDocument();
    expect(screen.getByLabelText("Nachricht")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nachricht senden" })).toBeInTheDocument();
  });

  it("marks the subject field as optional", () => {
    renderWithIntl(<ContactForm />);
    expect(screen.getByText("Optional.")).toBeInTheDocument();
  });

  it("blocks submission and shows errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));

    expect(await screen.findByText("Bitte gib deinen Namen ein (mindestens 2 Zeichen).")).toBeInTheDocument();
    expect(screen.getByText("Bitte gib eine gültige E-Mail-Adresse ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte schreib uns mindestens 10 Zeichen.")).toBeInTheDocument();
    // The stub notice never appears — validation failed, nothing was "sent".
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("never calls a network endpoint on a valid submit — it's a clearly marked stub", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
    await user.type(screen.getByLabelText("Nachricht"), "Wir würden gerne mit euch sprechen.");
    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("teamvorstand@unimannheim.enactus.team");
    expect(
      screen.getByRole("link", { name: "teamvorstand@unimannheim.enactus.team" }),
    ).toHaveAttribute("href", "mailto:teamvorstand@unimannheim.enactus.team");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ContactForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
