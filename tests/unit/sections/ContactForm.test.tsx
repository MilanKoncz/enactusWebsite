import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ContactForm } from "@/components/sections/ContactForm";

function mockFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
}

function mockFetchFailure() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
}

describe("ContactForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders name, email, subject, and message fields plus a submit button", () => {
    renderWithIntl(<ContactForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Betreff")).toBeInTheDocument();
    expect(screen.getByLabelText("Nachricht")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nachricht senden" })).toBeInTheDocument();
  });

  it("blocks submission and shows errors when required fields are empty, including the subject", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));

    expect(await screen.findByText("Bitte gib deinen Namen ein (mindestens 2 Zeichen).")).toBeInTheDocument();
    expect(screen.getByText("Bitte gib eine gültige E-Mail-Adresse ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte gib einen Betreff ein (2 bis 150 Zeichen).")).toBeInTheDocument();
    expect(screen.getByText("Bitte schreib uns mindestens 10 Zeichen.")).toBeInTheDocument();
    // Nothing was sent — validation failed before any request went out.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("posts to /api/kontakt and shows a real success notice on a valid submit", async () => {
    mockFetchOk();
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
    await user.type(screen.getByLabelText("Betreff"), "Partnerschaft");
    await user.type(screen.getByLabelText("Nachricht"), "Wir würden gerne mit euch sprechen.");
    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Danke für deine Nachricht");
    expect(fetch).toHaveBeenCalledWith("/api/kontakt", expect.objectContaining({ method: "POST" }));
    const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
    const body = JSON.parse(requestInit?.body as string);
    expect(body).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
      subject: "Partnerschaft",
      locale: "de",
    });
  });

  it("shows an error and keeps the form filled in when the request fails", async () => {
    mockFetchFailure();
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
    await user.type(screen.getByLabelText("Betreff"), "Partnerschaft");
    await user.type(screen.getByLabelText("Nachricht"), "Wir würden gerne mit euch sprechen.");
    await user.click(screen.getByRole("button", { name: "Nachricht senden" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("teamvorstand@unimannheim.enactus.team");
    expect(screen.getByLabelText("Name")).toHaveValue("Jane Doe");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ContactForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
