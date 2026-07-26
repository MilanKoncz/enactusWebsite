import { describe, expect, it } from "vitest";
import { footerColumns, mainNav, networkLinks, routes, socialLinks } from "@/content/navigation";

describe("content/navigation", () => {
  it("has no home entry in the main nav — the logo is the home link", () => {
    expect(mainNav.some((item) => item.key === "home")).toBe(false);
  });

  it("lists exactly the five header nav items in order", () => {
    expect(mainNav.map((item) => item.key)).toEqual([
      "prozess",
      "projekte",
      "events",
      "partner",
      "kontakt",
    ]);
  });

  it("every nav item's href matches the canonical routes map", () => {
    for (const item of mainNav) {
      expect(item.href).toBe(routes[item.key]);
    }
  });

  it("links Team from the footer's Verein column, not the header nav", () => {
    expect(mainNav.some((item) => item.key === "team")).toBe(false);
    expect(footerColumns.verein.some((item) => item.key === "team")).toBe(true);
  });

  it("lists Impressum and Datenschutz under Rechtliches", () => {
    expect(footerColumns.rechtliches.map((item) => item.key)).toEqual([
      "impressum",
      "datenschutz",
    ]);
  });

  it("has all four social links and both network links unconfirmed (href null)", () => {
    expect(socialLinks.map((link) => link.key)).toEqual([
      "instagram",
      "linkedin",
      "facebook",
      "spotify",
    ]);
    expect(socialLinks.every((link) => link.href === null)).toBe(true);
    expect(networkLinks.map((link) => link.key)).toEqual(["enactusGermany", "enactusGlobal"]);
    expect(networkLinks.every((link) => link.href === null)).toBe(true);
  });
});
