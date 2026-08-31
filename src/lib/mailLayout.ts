import { readFileSync } from "node:fs";
import { join } from "node:path";
import { colorTokens } from "./design-tokens";

/**
 * The one place every outgoing mail's shell — the logo header and the HTML
 * wrapper around the plaintext body — is built. Before this, every send was
 * plaintext only (lib/mail.ts had no `html` field at all); this is what lets
 * lib/mail.ts's `send()` add both to every mail from a single call site,
 * rather than each dispatch function building its own copy.
 *
 * The logo is read from the local filesystem and sent as an inline
 * attachment referenced by `cid:`, exactly like applicationPdf.tsx's own
 * logo — never fetched over the network at send time (that would be the
 * external-image/tracking-pixel problem CLAUDE.md rules out for the site
 * itself, and most mail clients block a remote image by default anyway,
 * which would just show a broken image instead of the logo).
 */

const LOGO_PATH = join(process.cwd(), "public/brand/enactus-mannheim-logo-full-on-dark.png");
const LOGO_CONTENT_ID = "enactus-mannheim-logo";

// Source file is 1736x1036 (public/brand/enactus-mannheim-logo-full-on-dark.png).
// A fixed display width keeps the header identical across mail clients
// regardless of how each one would otherwise scale the source image.
const LOGO_DISPLAY_WIDTH = 180;
const LOGO_DISPLAY_HEIGHT = 108;

// Read once per process, not once per mail — every send calls
// mailLogoAttachment(), and the file never changes while the process runs.
let cachedLogoBuffer: Buffer | null = null;
function logoBuffer(): Buffer {
  if (!cachedLogoBuffer) cachedLogoBuffer = readFileSync(LOGO_PATH);
  return cachedLogoBuffer;
}

export function mailLogoAttachment(): { filename: string; content: Buffer; contentId: string } {
  return { filename: "enactus-mannheim-logo.png", content: logoBuffer(), contentId: LOGO_CONTENT_ID };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Applied after escaping, so a URL containing "&" (a query string) is
// matched against its already-escaped form ("&amp;") — this still finds
// real URLs, since "&amp;" itself contains none of \s or <.
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

function linkify(escapedText: string): string {
  return escapedText.replace(URL_PATTERN, (url) => `<a href="${url}" style="color:${colorTokens.ink};">${url}</a>`);
}

/**
 * Derives the HTML body from the plain-text body every dispatch function
 * already builds — the plaintext stays the one source of copy, this only
 * wraps it, so the two variants can never drift apart the way two
 * hand-maintained copies would. A blank line becomes a paragraph break, a
 * single newline becomes a line break, and a bare URL becomes a link;
 * nothing else is inferred, so a plain paragraph of prose renders exactly
 * as plainly as it reads in the plaintext version.
 */
export function mailHtml(text: string): string {
  const paragraphsHtml = text
    .split(/\n{2,}/)
    .map((paragraph) => linkify(escapeHtml(paragraph)).replace(/\n/g, "<br>"))
    .map((paragraph) => `<p style="margin:0 0 16px;">${paragraph}</p>`)
    .join("");

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>Enactus Mannheim</title>
  </head>
  <body style="margin:0;padding:0;background:${colorTokens.paper};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colorTokens.paper};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">
            <tr>
              <td style="background:${colorTokens.ink};padding:20px 24px;">
                <img src="cid:${LOGO_CONTENT_ID}" width="${LOGO_DISPLAY_WIDTH}" height="${LOGO_DISPLAY_HEIGHT}" alt="Enactus Mannheim" style="display:block;border:0;">
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-size:14px;line-height:1.6;color:${colorTokens.ink};">
                ${paragraphsHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
