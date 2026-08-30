// Sends one real mail through Resend, over exactly the path /api/kontakt
// uses — same package, same from/reply-to variables, same verified domain —
// and prints the provider's own answer. Nothing is mocked: if this prints an
// id, mail works; if it prints an error, that error is the reason the contact
// form's messages are not arriving.
//
// Usage: `node --env-file=.env.local scripts/mail-test.mjs [recipient]`
// (`npm run mail:test` wires that up.) Without a recipient it sends to
// RESEND_REPLY_TO_EMAIL — the same inbox /api/kontakt forwards to, so a
// successful run proves the real delivery path end to end.
//
// The preflight runs first and on its own: every variable this needs is
// reported as present or missing before anything is sent, because a missing
// variable is by far the likeliest cause and a stack trace three frames deep
// is a poor way to say "the key isn't set".

import { Resend } from "resend";

// The only domain verified with Resend. A `from` on any other domain is
// rejected by the API, so it is worth catching here rather than as a 403.
const VERIFIED_DOMAIN = "enactus-mannheim.com";

const REQUIRED = ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_REPLY_TO_EMAIL"];

function mask(name, value) {
  if (!value) return "(not set)";
  if (name === "RESEND_API_KEY") {
    return `${value.slice(0, 6)}…${value.slice(-4)} (${value.length} chars)`;
  }
  return value;
}

function preflight() {
  console.log("Environment\n");
  let missing = 0;
  for (const name of REQUIRED) {
    const value = process.env[name];
    if (!value) missing += 1;
    console.log(`  ${value ? "ok  " : "MISS"}  ${name.padEnd(24)} ${mask(name, value)}`);
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (from && !from.trim().toLowerCase().endsWith(`@${VERIFIED_DOMAIN}`)) {
    console.log(
      `\n  WARN  RESEND_FROM_EMAIL is "${from}", which is not on ${VERIFIED_DOMAIN} —` +
        ` the only domain verified with Resend. Resend will reject the send.`,
    );
  }

  // Not required for this script's own test send (it mirrors /api/kontakt,
  // which embeds no link) — reported here anyway, not silently, because the
  // same lib/siteUrl.ts fallback this warns about is what put a real
  // http://localhost:3000 unsubscribe link into a sent mail on 2026-08-30,
  // and this is the one script whoever debugs "mail isn't arriving right"
  // is likely to reach for.
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    console.log(
      "\n  WARN  NEXT_PUBLIC_SITE_URL is not set. lib/siteUrl.ts falls back to" +
        " http://localhost:3000, which would break every link (confirmation," +
        " unsubscribe) in a mail sent from this process.",
    );
  }

  if (missing > 0) {
    console.error(
      `\n${missing} required variable(s) missing. Set them in .env.local for a local run,` +
        `\nand in the Vercel project settings for Preview and Production.` +
        `\nSee .env.example and docs/deployment.md.`,
    );
    process.exit(1);
  }
  console.log();
}

async function listDomains(resend) {
  // Needs a full-access API key; a sending-only key returns 401/403 here
  // while still being able to send, so this is reported, never fatal.
  const { data, error } = await resend.domains.list();
  if (error) {
    console.log(`Verified domains: could not read (${error.message}).`);
    console.log("  A sending-only API key cannot list domains — not a fault on its own.\n");
    return;
  }
  const domains = data?.data ?? [];
  console.log("Verified domains");
  for (const domain of domains) {
    console.log(`  ${domain.status === "verified" ? "ok  " : "    "}  ${domain.name} — ${domain.status} (${domain.region})`);
  }
  if (!domains.some((domain) => domain.name === VERIFIED_DOMAIN && domain.status === "verified")) {
    console.log(`  WARN  ${VERIFIED_DOMAIN} is not listed as verified on this account.`);
  }
  console.log();
}

async function main() {
  preflight();

  const to = process.argv[2] ?? process.env.RESEND_REPLY_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL;
  const resend = new Resend(process.env.RESEND_API_KEY);

  await listDomains(resend);

  const stamp = new Date().toISOString();
  console.log(`Sending\n  from     ${from}\n  reply-to ${replyTo}\n  to       ${to}\n`);

  const { data, error } = await resend.emails.send({
    from,
    replyTo,
    to,
    subject: `Resend-Testmail ${stamp}`,
    text:
      "Testmail von scripts/mail-test.mjs.\n\n" +
      "Sie nimmt denselben Weg wie eine Nachricht aus dem Kontaktformular:\n" +
      "dieselbe Absenderadresse, dieselbe Reply-To-Adresse, derselbe Resend-Account.\n\n" +
      `Zeitstempel: ${stamp}\n`,
  });

  if (error) {
    console.error("Resend rejected the send:\n");
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log(`Accepted. Message id: ${data.id}\n`);

  // Accepted is not delivered. Resend records the outcome a moment later, so
  // the script waits and reads the message back — a bounce or a block shows
  // up here and nowhere else.
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const { data: sent, error: readError } = await resend.emails.get(data.id);
  if (readError) {
    console.log(`Could not read the message back (${readError.message}).`);
    console.log("The send itself was accepted — check the Resend dashboard for its final status.");
    return;
  }
  console.log("Provider status\n");
  console.log(JSON.stringify({ id: sent.id, to: sent.to, from: sent.from, last_event: sent.last_event, created_at: sent.created_at }, null, 2));
  if (sent.last_event && !["delivered", "sent"].includes(sent.last_event)) {
    console.log(`\nWARN  last_event is "${sent.last_event}" — accepted by Resend but not delivered.`);
  }
}

main().catch((error) => {
  console.error("\nUnexpected failure:\n");
  console.error(error);
  process.exit(1);
});
