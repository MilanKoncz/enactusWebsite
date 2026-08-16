import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ReminderSignupForm } from "@/components/sections/ReminderSignupForm";

describe("ReminderSignupForm", () => {
  it("renders an email field, a consent checkbox, and a submit button", () => {
    renderWithIntl(<ReminderSignupForm />);
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Erinnerung aktivieren" })).toBeInTheDocument();
  });

  it("blocks submission and shows errors when email and consent are missing", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ReminderSignupForm />);

    await user.click(screen.getByRole("button", { name: "Erinnerung aktivieren" }));

    expect(await screen.findByText("Bitte gib eine gültige E-Mail-Adresse ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte bestätige die Einwilligung.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows an honest stub notice on a valid submit, not a fake confirmation", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ReminderSignupForm />);

    await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Erinnerung aktivieren" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Diese Anmeldung ist noch nicht angebunden",
    );
  });

  it("links the consent text to the privacy policy", () => {
    renderWithIntl(<ReminderSignupForm />);
    expect(screen.getByRole("link", { name: "Datenschutzerklärung" })).toHaveAttribute(
      "href",
      "/datenschutz",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ReminderSignupForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
