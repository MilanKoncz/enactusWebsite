import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { Datenschutz } from "@/components/sections/Datenschutz";
import { org } from "@/content/org";
import { privacyReviewStatus } from "@/content/privacy";

describe("Datenschutz", () => {
  it("renders exactly one h1 titled Datenschutzerklärung", () => {
    renderWithIntl(<Datenschutz />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Datenschutzerklärung");
  });

  it("renders all 18 sections as h2 headings", () => {
    renderWithIntl(<Datenschutz />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(18);
  });

  it("shows the reviewed notice, and never the draft notice", () => {
    expect(privacyReviewStatus.reviewed).toBe(true);
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/^Zuletzt geprüft am/)).toBeInTheDocument();
    expect(screen.queryByText(/^Entwurf\./)).not.toBeInTheDocument();
  });

  it("renders the responsible party's real legal name, address, and register entry", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(org.legalName)).toBeInTheDocument();
    expect(screen.getByText(org.registeredOffice!)).toBeInTheDocument();
    expect(screen.getByText(org.registerEntry!)).toBeInTheDocument();
    expect(screen.getByText(org.legalRepresentatives.names.join(", "))).toBeInTheDocument();
  });

  it("states plainly that no in-house data protection officer is appointed", () => {
    renderWithIntl(<Datenschutz />);
    expect(
      screen.getByText(/Ein betrieblicher Datenschutzbeauftragter ist .* nicht bestellt/),
    ).toBeInTheDocument();
  });

  it("describes Resend as an active processor in the EU-West-1 (Ireland) region, with tracking off", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Irland.*eu-west-1/)).toBeInTheDocument();
    expect(screen.getByText(/kein Öffnungs-Tracking, kein Klick-Tracking/)).toBeInTheDocument();
  });

  it("states the retention periods in the Speicherdauer table", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByRole("heading", { level: 2, name: "Speicherdauer" })).toBeInTheDocument();
    expect(screen.getAllByText(/6 Monate nach Ende des jeweiligen Bewerbungszeitraums/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12 Monate nach abschließender Bearbeitung/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/30 Tage nach Anmeldung/).length).toBeGreaterThan(0);
  });

  it("lists Vercel, Neon, and Resend in the Auftragsverarbeiter table", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByRole("heading", { level: 2, name: "Auftragsverarbeiter und Empfänger" })).toBeInTheDocument();
    expect(screen.getAllByText(/Vercel Inc\., USA/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Neon Inc\., USA/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Plus Five Five, Inc\. \(Resend\), USA/).length).toBeGreaterThan(0);
  });

  it("states IP addresses used for abuse protection are stored only as a hash", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/ausschließlich als kryptografischen Hashwert/)).toBeInTheDocument();
  });

  it("states no CAPTCHA is used and explains why", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Ein Captcha setzen wir bewusst nicht ein/)).toBeInTheDocument();
  });

  it("states the application form has no file upload, only structured fields", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Es gibt keinen Datei-Upload/)).toBeInTheDocument();
  });

  it("lists every application field named in the /mitmachen brief", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Vorname, Nachname, E-Mail-Adresse/)).toBeInTheDocument();
    expect(screen.getByText("gewünschter Einsatzbereich")).toBeInTheDocument();
    expect(screen.getByText(/Verfügbarkeit in Stunden pro Woche/)).toBeInTheDocument();
    expect(screen.getByText(/Zeitpunkt deiner Einwilligung/)).toBeInTheDocument();
  });

  it("describes the reminder list's double opt-in proof of consent", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Double-Opt-in-Verfahren/)).toBeInTheDocument();
    expect(screen.getByText(/als Nachweis deiner Einwilligung; ohne diesen Nachweis/)).toBeInTheDocument();
  });

  it("names the real application recipient, not the outdated it@ address", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/info@unimannheim\.enactus\.team/)).toBeInTheDocument();
    expect(screen.queryByText(/it@unimannheim\.enactus\.team/)).not.toBeInTheDocument();
  });

  it("states the contact form is live and forwards messages, not that it's unconnected", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.queryByText(/noch nicht angebunden/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Noch nicht aktiv/)).not.toBeInTheDocument();
  });

  it("names the supervisory authority for a complaint", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg/)).toBeInTheDocument();
  });

  it("has no PlaceholderMark elements — every fact on this page is confirmed", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.queryByText("Angabe fehlt")).not.toBeInTheDocument();
    expect(screen.queryByText(/Diese Angabe ist noch nicht verfügbar/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Diese Zahl ist noch nicht vom Vorstand bestätigt/)).not.toBeInTheDocument();
  });

  it("has no accessibility violations in German", async () => {
    const { container } = renderWithIntl(<Datenschutz />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations in English", async () => {
    const { container } = renderWithIntl(<Datenschutz />, { locale: "en" });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders a genuine English translation, not a German mirror", () => {
    renderWithIntl(<Datenschutz />, { locale: "en" });
    expect(screen.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeInTheDocument();
    expect(screen.getByText(/no file upload/)).toBeInTheDocument();
  });
});
