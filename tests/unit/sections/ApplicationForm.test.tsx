import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { ApplicationForm, MIN_FILL_MS } from "@/components/sections/ApplicationForm";
import type { PublicProjectArea } from "@/lib/projectAreas";
import type { PublicDepartment } from "@/lib/departments";

const TOKEN_ISSUED_AT = 1_700_000_000_000;
const TOKEN = `${TOKEN_ISSUED_AT}.test-signature`;

const PROJECT_AREAS: PublicProjectArea[] = [
  { id: "area-1", labelDe: "SmileGreen", labelEn: "SmileGreen" },
  { id: "area-2", labelDe: "Finance-Lead", labelEn: "Finance-Lead" },
];

const DEPARTMENTS: PublicDepartment[] = [
  { id: "dept-1", labelDe: "Team-Lead", labelEn: "Team-Lead" },
  { id: "dept-2", labelDe: "Finance-Lead", labelEn: "Finance-Lead" },
  { id: "dept-3", labelDe: "Operations-Lead", labelEn: "Operations-Lead" },
  { id: "dept-4", labelDe: "Inno-Lead", labelEn: "Inno-Lead" },
];

const UPLOADED_BLOB = {
  url: "https://example-store.private.blob.vercel-storage.com/bewerbungen/lebenslauf-abc123.pdf",
  pathname: "bewerbungen/lebenslauf-abc123.pdf",
  contentType: "application/pdf",
  contentDisposition: "attachment",
};

const uploadMock = vi.fn();
vi.mock("@vercel/blob/client", () => ({
  upload: (...args: unknown[]) => uploadMock(...args),
}));

function renderForm(projectAreas: PublicProjectArea[] = PROJECT_AREAS, departments: PublicDepartment[] = DEPARTMENTS) {
  return renderWithIntl(<ApplicationForm projectAreas={projectAreas} departments={departments} />);
}

function pdfFile(name = "lebenslauf.pdf") {
  return new File(["%PDF-1.4 test content"], name, { type: "application/pdf" });
}

async function uploadCv(user: ReturnType<typeof userEvent.setup>, file: File = pdfFile()) {
  await user.upload(screen.getByLabelText("Lebenslauf"), file);
  await screen.findByText(`${file.name} hochgeladen`);
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Vorname"), "Jane");
  await user.type(screen.getByLabelText("Nachname"), "Doe");
  await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
  await user.type(screen.getByLabelText("Studiengang"), "BWL");
  await user.type(screen.getByLabelText("Fachsemester"), "3");
  await user.type(screen.getByLabelText("Verfügbarkeit in Stunden pro Woche"), "10");
  await user.selectOptions(screen.getByLabelText("1. Wahl"), "SmileGreen");
  await user.type(screen.getByLabelText("Warum dieser Bereich?"), "Weil ich dort am meisten bewirken kann.");
  await uploadCv(user);
  await user.type(
    screen.getByLabelText("Motivation"),
    "Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.",
  );
  await user.click(screen.getByRole("checkbox", { name: /Datenschutzerklärung/ }));
}

// Every render of ApplicationForm now fetches a timing token AND the
// project-areas AND departments lists on mount (GET /api/bewerbung/token,
// GET /api/project-areas, GET /api/departments), so every test needs *some*
// fetch stub in place — this branches on URL, so tests that only care about
// the eventual POST don't have to know or care that three GETs happen first.
function stubFetch(
  handlePost: () => Response | Promise<Response>,
  projectAreas: PublicProjectArea[] = PROJECT_AREAS,
  departments: PublicDepartment[] = DEPARTMENTS,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (typeof url === "string" && url.endsWith("/api/bewerbung/token")) {
        return Promise.resolve(new Response(JSON.stringify({ token: TOKEN }), { status: 200 }));
      }
      if (typeof url === "string" && url.endsWith("/api/project-areas")) {
        return Promise.resolve(new Response(JSON.stringify({ areas: projectAreas }), { status: 200 }));
      }
      if (typeof url === "string" && url.endsWith("/api/departments")) {
        return Promise.resolve(new Response(JSON.stringify({ departments }), { status: 200 }));
      }
      return Promise.resolve(handlePost());
    }),
  );
}

function stubFetchTokenRateLimited(projectAreas: PublicProjectArea[] = PROJECT_AREAS) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (typeof url === "string" && url.endsWith("/api/bewerbung/token")) {
        return Promise.resolve(new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 }));
      }
      if (typeof url === "string" && url.endsWith("/api/project-areas")) {
        return Promise.resolve(new Response(JSON.stringify({ areas: projectAreas }), { status: 200 }));
      }
      if (typeof url === "string" && url.endsWith("/api/departments")) {
        return Promise.resolve(new Response(JSON.stringify({ departments: DEPARTMENTS }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
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
    // .mockReset(), not just a fresh resolved value: uploadMock is a plain
    // vi.fn(), created once at module scope — afterEach's
    // vi.restoreAllMocks() only restores vi.spyOn mocks to their original
    // implementation, and is documented to leave a plain vi.fn()'s call
    // history untouched. Without this, "not.toHaveBeenCalled()" assertions
    // below see calls left over from earlier tests in the same file.
    uploadMock.mockReset();
    uploadMock.mockResolvedValue(UPLOADED_BLOB);
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
    expect(screen.getByLabelText("Verfügbarkeit in Stunden pro Woche")).toBeInTheDocument();
    expect(screen.getByLabelText("1. Wahl")).toBeInTheDocument();
    expect(screen.getByLabelText("2. Wahl")).toBeInTheDocument();
    expect(screen.getByLabelText("3. Wahl")).toBeInTheDocument();
    expect(screen.getByLabelText("Lebenslauf")).toBeInTheDocument();
    expect(screen.getByLabelText("Motivation")).toBeInTheDocument();
    expect(screen.getByLabelText("(Optional) Bisheriges Engagement")).toBeInTheDocument();
    expect(screen.getByLabelText("(Optional) Relevante Skills")).toBeInTheDocument();
    expect(
      screen.getByLabelText("(Optional) Was möchtest du aus deiner Zeit bei Enactus mitnehmen?"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("(Optional) Wie bist du auf uns aufmerksam geworden?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Hochschule")).not.toBeInTheDocument();
  });

  it("links the areas notice's Ideathon mention to the Ideathon page", () => {
    renderForm();
    const link = screen.getByRole("link", { name: "hier" });
    expect(link).toHaveAttribute("href", "/ideathon");
  });

  it("has exactly one file upload input, wired to the CV field", () => {
    renderForm();
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs).toHaveLength(1);
    expect(fileInputs[0]).toHaveAttribute("accept", "application/pdf");
    expect(screen.getByLabelText("Lebenslauf")).toBe(fileInputs[0]);
  });

  it("lists the desired-area options passed in via projectAreas, in every dropdown", () => {
    renderForm();
    for (const label of ["1. Wahl", "2. Wahl", "3. Wahl"]) {
      const select = screen.getByLabelText(label);
      expect(within(select).getByRole("option", { name: "SmileGreen" })).toBeInTheDocument();
      expect(within(select).getByRole("option", { name: "Finance-Lead" })).toBeInTheDocument();
    }
  });

  it("hides an area already chosen in one dropdown from the other two", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText("1. Wahl"), "SmileGreen");

    const secondChoice = screen.getByLabelText("2. Wahl");
    const thirdChoice = screen.getByLabelText("3. Wahl");
    expect(within(secondChoice).queryByRole("option", { name: "SmileGreen" })).not.toBeInTheDocument();
    expect(within(thirdChoice).queryByRole("option", { name: "SmileGreen" })).not.toBeInTheDocument();
    expect(within(secondChoice).getByRole("option", { name: "Finance-Lead" })).toBeInTheDocument();
  });

  it("reveals the reason field only once its own dropdown has a value", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.queryAllByLabelText("Warum dieser Bereich?")).toHaveLength(0);
    await user.selectOptions(screen.getByLabelText("2. Wahl"), "Finance-Lead");
    expect(screen.getAllByLabelText("Warum dieser Bereich?")).toHaveLength(1);
  });

  it("shows a live character count for the area reason", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText("1. Wahl"), "SmileGreen");
    expect(screen.getByText("0 / 300")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Warum dieser Bereich?"), "Hallo");
    expect(screen.getByText("5 / 300")).toBeInTheDocument();
  });

  it("lists the departments passed in via departments, as an optional checkbox group", () => {
    renderForm();
    const group = screen.getByRole("group", { name: "(Optional) Ressorts" });
    expect(within(group).getByRole("checkbox", { name: "Team-Lead" })).toBeInTheDocument();
    expect(within(group).getByRole("checkbox", { name: "Finance-Lead" })).toBeInTheDocument();
    expect(within(group).getByRole("checkbox", { name: "Operations-Lead" })).toBeInTheDocument();
    expect(within(group).getByRole("checkbox", { name: "Inno-Lead" })).toBeInTheDocument();
  });

  it("only shows the departments GET /api/departments actually returns, not a deactivated one", async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }), PROJECT_AREAS, [
      { id: "dept-1", labelDe: "Team-Lead", labelEn: "Team-Lead" },
    ]);
    renderForm();

    const group = screen.getByRole("group", { name: "(Optional) Ressorts" });
    await waitFor(() => {
      expect(within(group).queryByRole("checkbox", { name: "Finance-Lead" })).not.toBeInTheDocument();
    });
    expect(within(group).getByRole("checkbox", { name: "Team-Lead" })).toBeInTheDocument();
  });

  it("lets a visitor check up to three departments, disabling the rest once the cap is reached", async () => {
    const user = userEvent.setup();
    renderForm();

    const group = screen.getByRole("group", { name: "(Optional) Ressorts" });
    await user.click(within(group).getByRole("checkbox", { name: "Team-Lead" }));
    await user.click(within(group).getByRole("checkbox", { name: "Finance-Lead" }));
    await user.click(within(group).getByRole("checkbox", { name: "Operations-Lead" }));

    expect(within(group).getByRole("checkbox", { name: "Inno-Lead" })).toBeDisabled();
    expect(within(group).getByRole("checkbox", { name: "Team-Lead" })).toBeEnabled();
    expect(screen.getByText("3 von 3 ausgewählt")).toBeInTheDocument();
  });

  it("re-enables a department once one of the three checked ones is unchecked", async () => {
    const user = userEvent.setup();
    renderForm();

    const group = screen.getByRole("group", { name: "(Optional) Ressorts" });
    await user.click(within(group).getByRole("checkbox", { name: "Team-Lead" }));
    await user.click(within(group).getByRole("checkbox", { name: "Finance-Lead" }));
    await user.click(within(group).getByRole("checkbox", { name: "Operations-Lead" }));
    await user.click(within(group).getByRole("checkbox", { name: "Team-Lead" }));

    expect(within(group).getByRole("checkbox", { name: "Inno-Lead" })).toBeEnabled();
    expect(screen.getByText("2 von 3 ausgewählt")).toBeInTheDocument();
  });

  it("lets a keyboard user tab to a department checkbox and toggle it with Space", async () => {
    const user = userEvent.setup();
    renderForm();

    const checkbox = screen.getByRole("checkbox", { name: "Team-Lead" });
    checkbox.focus();
    expect(checkbox).toHaveFocus();
    await user.keyboard(" ");

    expect(checkbox).toBeChecked();
  });

  it("submits successfully with no department checked, since Ressorts are optional", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Danke für deine Bewerbung");
    expect(postCallBody()).toMatchObject({ departments: [] });
  });

  it("submits the checked departments alongside the rest of the application", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const user = userEvent.setup();
    renderForm();

    await fillRequiredFields(user);
    await user.click(screen.getByRole("checkbox", { name: "Team-Lead" }));
    await user.click(screen.getByRole("checkbox", { name: "Inno-Lead" }));
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    await screen.findByRole("status");
    expect(postCallBody()).toMatchObject({ departments: ["Team-Lead", "Inno-Lead"] });
  });

  it("shows a visible notice when a pasted motivation text is longer than the limit and gets cut", async () => {
    const user = userEvent.setup();
    renderForm();

    const longText = "x".repeat(2100);
    const motivation = screen.getByLabelText("Motivation");
    motivation.focus();
    await user.paste(longText);

    expect(motivation).toHaveValue("x".repeat(2000));
    expect(
      await screen.findByText("Dein eingefügter Text war länger als 2000 Zeichen und wurde gekürzt."),
    ).toBeInTheDocument();
  });

  it("prefers a fresher project-areas list from GET /api/project-areas over the initial prop", async () => {
    stubFetch(
      () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      [{ id: "area-3", labelDe: "ReSoap", labelEn: "ReSoap" }],
    );
    renderForm([{ id: "area-1", labelDe: "SmileGreen", labelEn: "SmileGreen" }]);

    const firstChoice = screen.getByLabelText("1. Wahl");
    expect(await within(firstChoice).findByRole("option", { name: "ReSoap" })).toBeInTheDocument();
    expect(within(firstChoice).queryByRole("option", { name: "SmileGreen" })).not.toBeInTheDocument();
  });

  it("submits successfully after choosing an area that only appeared once the live fetch resolved", async () => {
    let now = TOKEN_ISSUED_AT;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const user = userEvent.setup();
    renderForm([]);

    const firstChoice = screen.getByLabelText("1. Wahl");
    await within(firstChoice).findByRole("option", { name: "SmileGreen" });
    await user.type(screen.getByLabelText("Vorname"), "Jane");
    await user.type(screen.getByLabelText("Nachname"), "Doe");
    await user.type(screen.getByLabelText("E-Mail"), "jane@example.com");
    await user.type(screen.getByLabelText("Studiengang"), "BWL");
    await user.type(screen.getByLabelText("Fachsemester"), "3");
    await user.type(screen.getByLabelText("Verfügbarkeit in Stunden pro Woche"), "10");
    await user.selectOptions(firstChoice, "SmileGreen");
    await user.type(screen.getByLabelText("Warum dieser Bereich?"), "Weil ich dort am meisten bewirken kann.");
    await uploadCv(user);
    await user.type(
      screen.getByLabelText("Motivation"),
      "Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.",
    );
    await user.click(screen.getByRole("checkbox", { name: /Datenschutzerklärung/ }));
    now += MIN_FILL_MS + 500;
    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Danke für deine Bewerbung");
    expect(postCallBody()).toMatchObject({ area1: "SmileGreen" });
  });

  it("blocks submission and shows errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Bewerbung absenden" }));

    expect(await screen.findByText("Bitte gib deinen Vornamen ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte gib eine gültige E-Mail-Adresse ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte wähle deinen Wunschbereich.")).toBeInTheDocument();
    expect(screen.getByText("Bitte lade deinen Lebenslauf als PDF-Datei hoch.")).toBeInTheDocument();
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
    expect(body).toMatchObject({
      firstName: "Jane",
      locale: "de",
      formToken: TOKEN,
      area1: "SmileGreen",
      cvPathname: UPLOADED_BLOB.pathname,
      cvBlobUrl: UPLOADED_BLOB.url,
      cvOriginalFilename: "lebenslauf.pdf",
    });
  });

  it("uploads to a fixed, neutral pathname, never the applicant's own filename", async () => {
    const user = userEvent.setup();
    renderForm();

    await uploadCv(user, pdfFile("Max Mustermann Lebenslauf.pdf"));

    expect(uploadMock).toHaveBeenCalledWith(
      "bewerbungen/lebenslauf.pdf",
      expect.anything(),
      expect.objectContaining({ access: "private", handleUploadUrl: "/api/bewerbung/cv-upload" }),
    );
  });

  it("shows a dedicated error for a non-PDF file, without uploading it", async () => {
    // applyAccept: false — user-event otherwise emulates the OS file
    // picker's own accept="application/pdf" filtering and silently drops a
    // non-matching file before it ever reaches our onChange handler, which
    // would make this test pass for the wrong reason (nothing happening at
    // all) instead of exercising the component's own type check.
    const user = userEvent.setup({ applyAccept: false });
    renderForm();

    await user.upload(screen.getByLabelText("Lebenslauf"), new File(["x"], "lebenslauf.docx", { type: "application/msword" }));

    expect(await screen.findByText("Bitte lade deinen Lebenslauf als PDF-Datei hoch.")).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("shows a dedicated error for a file over 4 MB, without uploading it", async () => {
    const user = userEvent.setup();
    renderForm();

    const oversized = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "lebenslauf.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Lebenslauf"), oversized);

    expect(await screen.findByText("Die Datei ist größer als 4 MB. Bitte wähle eine kleinere PDF-Datei.")).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("shows an upload-failed error when upload() itself rejects", async () => {
    uploadMock.mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();
    renderForm();

    await user.upload(screen.getByLabelText("Lebenslauf"), pdfFile());

    expect(await screen.findByText("Der Upload ist fehlgeschlagen. Bitte versuch es noch einmal.")).toBeInTheDocument();
  });

  it("lets the visitor remove an uploaded CV and see the required-field state return", async () => {
    const user = userEvent.setup();
    renderForm();

    await uploadCv(user);
    await user.click(screen.getByRole("button", { name: "Entfernen" }));

    expect(screen.queryByText("lebenslauf.pdf hochgeladen")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Datei auswählen" })).toBeInTheDocument();
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

  // /api/bewerbung/token is now the front door to the CV-upload token too
  // (lib/rateLimit.ts's "bewerbung-token" bucket) — a 429 there is a real,
  // visible problem for a genuine applicant, not an anti-spam signal, so it
  // must surface as a real error rather than a silent no-op. It has to
  // surface right at the CV upload attempt, not only at final submit: with
  // CV_REQUIRED, a missing token blocks the upload itself, so a rate-limited
  // applicant can never reach a valid submission to begin with.
  it("shows a real, distinguishable error at the CV upload step when the token route itself was rate-limited", async () => {
    stubFetchTokenRateLimited();
    const user = userEvent.setup();
    renderForm();
    // Both mount-effect fetches (token, project-areas) resolve as
    // microtasks; waiting for the project-areas one to land in the DOM
    // first guarantees the token one has too, since both are triggered by
    // the same render and mocked to resolve near-instantly — otherwise
    // uploading immediately can race the token fetch's own state update.
    // Scoped to one select: the same option text appears in all three.
    await within(screen.getByLabelText("1. Wahl")).findByRole("option", { name: "SmileGreen" });

    await user.upload(screen.getByLabelText("Lebenslauf"), pdfFile());

    expect(
      await screen.findByText("Gerade sind zu viele Anfragen aus deinem Netzwerk eingegangen.", { exact: false }),
    ).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
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
