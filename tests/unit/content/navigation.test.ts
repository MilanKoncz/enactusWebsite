import { describe, expect, it } from "vitest";
import { footerColumns, mainNav, networkLinks, routes, socialLinks } from "@/content/navigation";

describe("content/navigation", () => {
  it("has no home entry in the main nav — the logo is the home link", () => {
    expect(mainNav.some((item) => item.key === "home")).toBe(false);
  });

  it("lists exactly the six header nav items in order", () => {
    expect(mainNav.map((item) => item.key)).toEqual([
      "prozess",
      "projekte",
      "events",
      "termine",
      "partner",
      "kontakt",
    ]);
  });

  it("every nav item's href matches the canonical routes map", () => {
    for (const item of mainNav) {
      expect(item.href).toBe(routes[item.key]);
    }
  });

  it("lists Partner, Prozess and Termine under the footer's association column — no dedicated team route", () => {
    expect(footerColumns.association.map((item) => item.key)).toEqual(["partner", "prozess", "termine"]);
  });

  it("lists Impressum and Datenschutz under the legal column", () => {
    expect(footerColumns.legal.map((item) => item.key)).toEqual([
      "impressum",
      "datenschutz",
    ]);
  });

  it("has the three confirmed social links and both network links, all with real URLs", () => {
    expect(socialLinks.map((link) => link.key)).toEqual(["instagram", "linkedin", "facebook"]);
    expect(socialLinks.every((link) => link.href !== null)).toBe(true);
    expect(networkLinks.map((link) => link.key)).toEqual(["enactusGermany", "enactusGlobal"]);
    expect(networkLinks.every((link) => link.href !== null)).toBe(true);
  });
});
