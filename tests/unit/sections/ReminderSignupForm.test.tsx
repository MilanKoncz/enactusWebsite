import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ReminderSignupForm } from "@/components/sections/ReminderSignupForm";

function mockFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
}

function mockFetchFailure() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
}

describe("ReminderSignupForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  it("posts to /api/reminder and shows a real confirmation notice on a valid submit", async () => {
    mockFetchOk();
    const user = userEvent.setup();
    renderWithIntl(<ReminderSignupForm />);

    await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Erinnerung aktivieren" }));

    expect(await screen.findByRole("status")).toHaveTextContent("bestätige die E-Mail");
    expect(fetch).toHaveBeenCalledWith("/api/reminder", expect.objectContaining({ method: "POST" }));
    const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
    const body = JSON.parse(requestInit?.body as string);
    expect(body).toMatchObject({ email: "jane@example.com", consent: true, locale: "de" });
  });

  it("shows an error and does not reset the form when the request fails", async () => {
    mockFetchFailure();
    const user = userEvent.setup();
    renderWithIntl(<ReminderSignupForm />);

    await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Erinnerung aktivieren" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("hat nicht geklappt");
    expect(screen.getByLabelText("E-Mail")).toHaveValue("jane@example.com");
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
