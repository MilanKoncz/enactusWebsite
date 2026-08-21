import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { org, socialLinks } from "@/content/org";

// Homepage-only structured data (schema.org Organization) — every field
// traces back to content/org.ts / content/navigation.ts, the same facts
// already shown in the footer and /impressum, never invented here.
describe("OrganizationJsonLd", () => {
  function parsedJsonLd(description: string) {
    const { container } = render(<OrganizationJsonLd description={description} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    return JSON.parse(script?.innerHTML ?? "{}");
  }

  it("declares itself as a schema.org Organization, not the more specific NGO type", () => {
    const json = parsedJsonLd("A description.");
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Organization");
  });

  it("uses the real legal name, founding year, and contact email from content/org.ts", () => {
    const json = parsedJsonLd("A description.");
    expect(json.name).toBe(org.legalName);
    expect(json.foundingDate).toBe(String(org.foundingYear.year));
    expect(json.email).toBe(org.contactEmails.board);
  });

  it("passes the description straight through, for locale-aware structured data", () => {
    expect(parsedJsonLd("Deutsche Beschreibung.").description).toBe("Deutsche Beschreibung.");
    expect(parsedJsonLd("English description.").description).toBe("English description.");
  });

  it("lists every real social profile as sameAs, nothing invented", () => {
    const json = parsedJsonLd("A description.");
    expect(json.sameAs).toEqual(socialLinks.map((link) => link.href));
  });

  it("produces valid, parseable JSON with no unescaped script-closing sequence", () => {
    const { container } = render(<OrganizationJsonLd description="A description with </script> in it." />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).not.toContain("</script>");
    expect(() => JSON.parse(script?.innerHTML ?? "")).not.toThrow();
  });
});
