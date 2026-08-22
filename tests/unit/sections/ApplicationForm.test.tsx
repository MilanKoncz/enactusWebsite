import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { ApplicationForm, MIN_FILL_MS } from "@/components/sections/ApplicationForm";
import type { PublicProjectArea } from "@/lib/projectAreas";

const TOKEN_ISSUED_AT = 1_700_000_000_000;
const TOKEN = `${TOKEN_ISSUED_AT}.test-signature`;

const PROJECT_AREAS: PublicProjectArea[] = [
  { id: "area-1", labelDe: "SmileGreen", labelEn: "SmileGreen" },
  { id: "area-2", labelDe: "Finance-Lead", labelEn: "Finance-Lead" },
];

function renderForm(projectAreas: PublicProjectArea[] = PROJECT_AREAS) {
  return renderWithIntl(<ApplicationForm projectAreas={projectAreas} />);
}

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

// Every render of ApplicationForm now fetches a timing token AND the
// project-areas list on mount (GET /api/bewerbung/token,
// GET /api/project-areas), so every test needs *some* fetch stub in place
// — this branches on URL, so tests that only care about the eventual POST
// don't have to know or care that two GETs happen first.
function stubFetch(handlePost: () => Response | Promise<Response>, projectAreas: PublicProjectArea[] = PROJECT_AREAS) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (typeof url === "string" && url.endsWith("/api/bewerbung/token")) {
        return Promise.resolve(new Response(JSON.stringify({ token: TOKEN }), { status: 200 }));
      }
      if (typeof url === "string" && url.endsWith("/api/project-areas")) {
        return Promise.resolve(new Response(JSON.stringify({ areas: projectAreas }), { status: 200 }));
      }
      return Promise.resolve(handlePost());
    }),
  );
}

function mockFetchOk() {
  stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
}

function mockFetchFailure() {
  stubFetch(() => new Response(null, { status: 500 }));
}

function mockFetchWindowClosed() {
  stubFetch(() => new Response(JSON.stringify({ ok: false, error: "window_closed" }), { status: 409 }));
}

function postCallBody() {
  const call = vi.mocked(fetch).mock.calls.find(([url]) => url === "/api/bewerbung");
  return call ? JSON.parse((call[1] as RequestInit).body as string) : null;
}

describe("ApplicationForm", () => {
  beforeEach(() => {
    // Default stub so tests that don't care about submission behavior still
    // have a token to fetch on mount — overridden by mockFetch* where a
    // test needs specific POST behavior.
    mockFetchOk();
    // jsdom has no matchMedia; ApplicationForm now reads
    // prefers-reduced-motion for the confetti burst below, so every test
    // needs some stub in place — the reduced-motion test overrides this
    // itself.
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders every field named in the /mitmachen brief", () => {
    renderForm();
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
    renderForm();
    expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it("lists the desired-area options passed in via projectAreas", () => {
    renderForm();
    expect(screen.getByRole("checkbox", { name: "SmileGreen" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Finance-Lead" })).toBeInTheDocument();
  });

  it("prefers a fresher project-areas list from GET /api/project-areas over the initial prop", async () => {
    stubFetch(
      () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      [{ id: "area-3", labelDe: "ReSoap", labelEn: "ReSoap" }],
    );
    renderForm([{ id: "area-1", labelDe: "SmileGreen", labelEn: "SmileGreen" }]);

    expect(await screen.findByRole("checkbox", { name: "ReSoap" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "SmileGreen" })).not.toBeInTheDocument();
  });

  it("blocks submission and shows errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    expect(await screen.findByText("Bitte gib deinen Vornamen ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte gib eine gültige E-Mail-Adresse ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte wähle mindestens einen Bereich aus.")).toBeInTheDocument();
    expect(screen.getByText("Bitte bestätige die Einwilligung.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("silently blocks a submission that arrives faster than a human could fill it in", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    // Time barely moves — well under MIN_FILL_MS since the token was issued.
    now += 200;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bewerbung absenden" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith("/api/bewerbung", expect.anything());
  });

  it("posts to /api/bewerbung and shows a real success notice on a valid, sufficiently-timed submit", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Danke für deine Bewerbung");
    const body = postCallBody();
    expect(body).toMatchObject({ firstName: "Jane", locale: "de", formToken: TOKEN });
  });

  it("shows an error and keeps the form filled in when the request fails", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockFetchFailure();
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("teamvorstand@unimannheim.enactus.team");
    expect(screen.getByLabelText("Vorname")).toHaveValue("Jane");
  });

  it("shows a dedicated message, not the generic error, when the window closed mid-submit", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockFetchWindowClosed();
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Das Bewerbungsfenster wurde gerade eben geschlossen");
    expect(alert).not.toHaveTextContent("teamvorstand@unimannheim.enactus.team");
  });

  /**
   * Easter egg 4/7 (docs/eastereggs.md) — standard behavior on both forms
   * as of 2026-08-22, not exclusive to the contact form. jsdom has no real
   * Canvas 2D context, so this stops at "does the burst mount", same limit
   * ContactForm.test.tsx documents for the same reason — the actual
   * particle animation was verified by hand in a real browser.
   */
  it("bursts confetti on a real success submit", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const user = userEvent.setup();
    const { container } = renderForm();

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));
    await screen.findByRole("status");

    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("never bursts confetti on a failed submit", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockFetchFailure();
    const user = userEvent.setup();
    const { container } = renderForm();

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));
    await screen.findByRole("alert");

    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("never bursts confetti on success under prefers-reduced-motion", async () => {
    mockMatchMedia(true);
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const user = userEvent.setup();
    const { container } = renderForm();

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));
    await screen.findByRole("status");

    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderForm();
    expect(await axe(container)).toHaveNoViolations();
  });
});
