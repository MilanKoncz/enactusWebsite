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

  it("shows the draft notice while unreviewed, and never a reviewed notice", () => {
    expect(privacyReviewStatus.reviewed).toBe(false);
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/^Entwurf —/)).toBeInTheDocument();
    expect(screen.queryByText(/Zuletzt geprüft am/)).not.toBeInTheDocument();
  });

  it("renders the responsible party's real legal name and address", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(org.legalName)).toBeInTheDocument();
    expect(screen.getByText(org.registeredOffice!)).toBeInTheDocument();
  });

  it("states plainly that no in-house data protection officer is appointed", () => {
    renderWithIntl(<Datenschutz />);
    expect(
      screen.getByText(/Ein betrieblicher Datenschutzbeauftragter ist .* nicht bestellt/),
    ).toBeInTheDocument();
  });

  it("marks the Resend email section as not yet active", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText("Noch nicht aktiv")).toBeInTheDocument();
  });

  it("states the application form has no file upload, only structured fields", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Es gibt keinen Datei-Upload/)).toBeInTheDocument();
  });

  it("lists every application field named in the /mitmachen brief", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Vorname, Nachname, E-Mail-Adresse/)).toBeInTheDocument();
    expect(screen.getByText(/Wunschbereich/)).toBeInTheDocument();
    expect(screen.getByText(/Verfügbarkeit in Stunden pro Woche/)).toBeInTheDocument();
  });

  it("describes the reminder list's double opt-in proof of consent", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/Double-Opt-in/)).toBeInTheDocument();
    expect(screen.getByText(/deine IP-Adresse als Nachweis deiner Einwilligung/)).toBeInTheDocument();
  });

  it("names the supervisory authority for a complaint", () => {
    renderWithIntl(<Datenschutz />);
    expect(screen.getByText(/LfDI Baden-Württemberg/)).toBeInTheDocument();
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
