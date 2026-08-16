import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ApplicationForm, MIN_FILL_MS } from "@/components/sections/ApplicationForm";

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Vorname"), "Jane");
  await user.type(screen.getByLabelText("Nachname"), "Doe");
  await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
  await user.type(screen.getByLabelText("Studiengang"), "BWL");
  await user.type(screen.getByLabelText("Fachsemester"), "3");
  await user.type(screen.getByLabelText("Hochschule"), "Universität Mannheim");
  await user.type(
    screen.getByLabelText("Motivation"),
    "Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.",
  );
  await user.click(screen.getByRole("checkbox", { name: "SmileGreen" }));
  await user.type(screen.getByLabelText("Verfügbarkeit in Stunden pro Woche"), "10");
  await user.click(screen.getByRole("checkbox", { name: /Datenschutzerklärung/ }));
}

function mockFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
}

function mockFetchFailure() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
}

describe("ApplicationForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders every field named in the /mitmachen brief", () => {
    renderWithIntl(<ApplicationForm />);
    expect(screen.getByLabelText("Vorname")).toBeInTheDocument();
    expect(screen.getByLabelText("Nachname")).toBeInTheDocument();
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Studiengang")).toBeInTheDocument();
    expect(screen.getByLabelText("Fachsemester")).toBeInTheDocument();
    expect(screen.getByLabelText("Hochschule")).toBeInTheDocument();
    expect(screen.getByLabelText("Bisheriges Engagement / Berufserfahrung")).toBeInTheDocument();
    expect(screen.getByLabelText("Sprachen und weitere Kenntnisse")).toBeInTheDocument();
    expect(screen.getByLabelText("Motivation")).toBeInTheDocument();
    expect(screen.getByText("Wunschbereich")).toBeInTheDocument();
    expect(screen.getByLabelText("Verfügbarkeit in Stunden pro Woche")).toBeInTheDocument();
    expect(screen.getByLabelText("Wie bist du auf uns aufmerksam geworden?")).toBeInTheDocument();
  });

  it("has no file upload input anywhere in the form", () => {
    renderWithIntl(<ApplicationForm />);
    expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it("lists active projects and board departments as desired-area options", () => {
    renderWithIntl(<ApplicationForm />);
    expect(screen.getByRole("checkbox", { name: "SmileGreen" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Finance-Lead" })).toBeInTheDocument();
  });

  it("blocks submission and shows errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ApplicationForm />);

    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    expect(await screen.findByText("Bitte gib deinen Vornamen ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte gib eine gültige E-Mail-Adresse ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte wähle mindestens einen Bereich aus.")).toBeInTheDocument();
    expect(screen.getByText("Bitte bestätige die Einwilligung.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("silently blocks a submission that arrives faster than a human could fill it in", async () => {
    let now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockFetchOk();
    const user = userEvent.setup();
    renderWithIntl(<ApplicationForm />);

    await fillRequiredFields(user);
    // Time barely moves — well under MIN_FILL_MS since mount.
    now += 200;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts to /api/bewerbung and shows a real success notice on a valid, sufficiently-timed submit", async () => {
    let now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockFetchOk();
    const user = userEvent.setup();
    renderWithIntl(<ApplicationForm />);

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Danke für deine Bewerbung");
    expect(fetch).toHaveBeenCalledWith(
      "/api/bewerbung",
      expect.objectContaining({ method: "POST" }),
    );
    const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
    const body = JSON.parse(requestInit?.body as string);
    expect(body).toMatchObject({ firstName: "Jane", locale: "de" });
    expect(typeof body.formRenderedAt).toBe("number");
  });

  it("shows an error and keeps the form filled in when the request fails", async () => {
    let now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockFetchFailure();
    const user = userEvent.setup();
    renderWithIntl(<ApplicationForm />);

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("teamvorstand@unimannheim.enactus.team");
    expect(screen.getByLabelText("Vorname")).toHaveValue("Jane");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ApplicationForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
