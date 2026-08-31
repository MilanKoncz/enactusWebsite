import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../fixtures/intl";
import { TestSendMailButton } from "@/components/admin/TestSendMailButton";

describe("TestSendMailButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("disables the send button until an address is entered", () => {
    renderWithIntl(<TestSendMailButton />);
    expect(screen.getByRole("button", { name: "Testversand starten" })).toBeDisabled();
  });

  it("posts the entered address and renders one result row per template", async () => {
    const results = [
      { key: "applicationNotificationWithCv", label: "Bewerbungs-Benachrichtigung (mit Lebenslauf)", ok: true },
      { key: "contactNotification", label: "Kontaktformular-Weiterleitung", ok: false, error: "Resend is down" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, results }), { status: 200 })),
    );
    const user = userEvent.setup();

    renderWithIntl(<TestSendMailButton />);
    await user.type(screen.getByLabelText("Test-Adresse"), "vorstand@example.invalid");
    await user.click(screen.getByRole("button", { name: "Testversand starten" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/mails/testversand",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ to: "vorstand@example.invalid" }),
      }),
    );
    expect(await screen.findByText("Bewerbungs-Benachrichtigung (mit Lebenslauf)")).toBeInTheDocument();
    expect(screen.getByText(/Kontaktformular-Weiterleitung.*fehlgeschlagen/)).toBeInTheDocument();
    expect(screen.getByText("Resend is down")).toBeInTheDocument();
  });

  it("shows a visible error, not a silent failure, when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const user = userEvent.setup();

    renderWithIntl(<TestSendMailButton />);
    await user.type(screen.getByLabelText("Test-Adresse"), "vorstand@example.invalid");
    await user.click(screen.getByRole("button", { name: "Testversand starten" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Der Testversand hat nicht geklappt");
  });
});
