import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mailHtml, mailLogoAttachment } from "@/lib/mailLayout";

describe("mailLogoAttachment", () => {
  it("reads the real logo file and returns it as an inline, cid-referenced attachment", () => {
    const attachment = mailLogoAttachment();
    const onDisk = readFileSync(join(process.cwd(), "public/brand/enactus-mannheim-logo-full-on-dark.png"));

    expect(attachment.filename).toBe("enactus-mannheim-logo.png");
    expect(attachment.contentId).toBe("enactus-mannheim-logo");
    expect(Buffer.compare(attachment.content, onDisk)).toBe(0);
  });

  it("returns the same content on repeated calls, not a fresh disk read each time", () => {
    const first = mailLogoAttachment();
    const second = mailLogoAttachment();
    expect(first.content).toBe(second.content);
  });
});

describe("mailHtml", () => {
  it("wraps a single paragraph", () => {
    const html = mailHtml("Hallo, das ist eine Testnachricht.");
    expect(html).toContain("<p style=\"margin:0 0 16px;\">Hallo, das ist eine Testnachricht.</p>");
  });

  it("splits a blank line into two paragraphs, and a single newline into a line break", () => {
    const html = mailHtml("Erster Absatz.\n\nZweiter Absatz,\nzweite Zeile.");
    expect(html).toContain("<p style=\"margin:0 0 16px;\">Erster Absatz.</p>");
    expect(html).toContain("<p style=\"margin:0 0 16px;\">Zweiter Absatz,<br>zweite Zeile.</p>");
  });

  it("escapes HTML special characters so plaintext content can never inject markup", () => {
    const html = mailHtml(`<script>alert("hi")</script> & 'quoted'`);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    expect(html).toContain("&#39;");
  });

  it("turns a bare URL into a real link", () => {
    const html = mailHtml("Bitte bestätigen: https://www.enactus-mannheim.com/api/reminder/bestaetigen?token=abc");
    expect(html).toContain(
      '<a href="https://www.enactus-mannheim.com/api/reminder/bestaetigen?token=abc" style=',
    );
  });

  // The URL pattern runs after escaping (mailLayout.ts's own comment on
  // why) — a query string's "&" is escaped to "&amp;" first, and the link
  // still has to come out pointing at the real, unescaped URL a mail
  // client will actually follow.
  it("still finds a URL whose query string contains an ampersand", () => {
    const html = mailHtml("Fenster: https://www.enactus-mannheim.com/mitmachen?utm_source=mail&utm_medium=email");
    expect(html).toContain(
      '<a href="https://www.enactus-mannheim.com/mitmachen?utm_source=mail&amp;utm_medium=email" style=',
    );
  });

  it("references the logo attachment's own content id via cid:", () => {
    const html = mailHtml("Hallo.");
    const { contentId } = mailLogoAttachment();
    expect(html).toContain(`src="cid:${contentId}"`);
  });

  it("is a complete HTML document with a charset and viewport meta", () => {
    const html = mailHtml("Hallo.");
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain("</html>");
  });
});
