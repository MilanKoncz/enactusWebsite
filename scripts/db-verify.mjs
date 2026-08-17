// Writes one throwaway row to each table, reads it back, checks the values
// round-tripped, then deletes it — against the real Neon database, not a
// mock. This is the check to run before trusting any schema change: proof
// the schema and the driver actually work together, not just that the SQL
// parses.
//
// Usage: `node --env-file=.env.local scripts/db-verify.mjs`
// (`npm run db:verify` wires that up.) Run `npm run db:migrate` first.

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Run with `node --env-file=.env.local scripts/db-verify.mjs`.");
  process.exit(1);
}

const sql = neon(connectionString);
const MARKER = `db-verify-${Date.now()}`;
let failures = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`);
  if (!ok) failures += 1;
}

async function verifyApplications() {
  console.log("\napplications");
  const email = `${MARKER}@example.invalid`;
  const [inserted] = await sql`
    insert into applications (
      first_name, last_name, email, study_program, semester, university,
      motivation, desired_areas, availability_hours, consent_at, locale, recruiting_semester
    ) values (
      'Verify', 'Script', ${email}, 'Testfach', 3, 'Testuniversität',
      'Verification run, not a real application.', ${["SmileGreen", "Team-Lead"]}, 5, now(), 'de', 'HWS26'
    )
    returning *
  `;
  check("insert returns an id", typeof inserted.id, "string");

  const [read] = await sql`select * from applications where id = ${inserted.id}`;
  check("email round-trips", read.email, email);
  check("desired_areas round-trips as an array", read.desired_areas, ["SmileGreen", "Team-Lead"]);
  check("mail_status defaults to pending", read.mail_status, "pending");
  check("recruiting_semester round-trips", read.recruiting_semester, "HWS26");

  await sql`update applications set mail_status = 'sent', mailed_at = now() where id = ${inserted.id}`;
  const [afterUpdate] = await sql`select mail_status from applications where id = ${inserted.id}`;
  check("mail_status updates", afterUpdate.mail_status, "sent");

  const deleted = await sql`delete from applications where id = ${inserted.id} returning id`;
  check("delete removes exactly one row", deleted.length, 1);
  const afterDelete = await sql`select id from applications where id = ${inserted.id}`;
  check("row is gone after delete", afterDelete.length, 0);
}

async function verifyReminderSignups() {
  console.log("\nreminder_signups");
  const email = `${MARKER}-reminder@example.invalid`;
  const [inserted] = await sql`
    insert into reminder_signups (email, confirm_token, unsubscribe_token, locale)
    values (${email}, ${`${MARKER}-confirm`}, ${`${MARKER}-unsub`}, 'de')
    returning *
  `;
  check("confirmed defaults to false", inserted.confirmed, false);

  const [confirmed] = await sql`
    update reminder_signups set confirmed = true, confirmed_at = now(), confirmation_ip = '203.0.113.1'
    where id = ${inserted.id} and confirmed = false
    returning confirmed, confirmation_ip
  `;
  check("confirmation updates confirmed and stores the IP", confirmed?.confirmation_ip, "203.0.113.1");

  const repeatConfirm = await sql`
    update reminder_signups set confirmed = true where id = ${inserted.id} and confirmed = false returning id
  `;
  check("re-confirming an already-confirmed row matches zero rows", repeatConfirm.length, 0);

  const deleted = await sql`delete from reminder_signups where id = ${inserted.id} returning id`;
  check("delete removes exactly one row", deleted.length, 1);
}

// This is the check that matters most in this file: it runs the exact
// query lib/db.ts's findConfirmedReminderSignups uses (confirmed = true
// and unsubscribed_at is null) against three real rows in three real
// states, and asserts only the one that should be mailed comes back. A
// mocked test can only assert "the function returns what I told it to" —
// this is the one place the actual filtering logic, running on the actual
// database, gets checked.
async function verifyReminderFiltering() {
  console.log("\nreminder_signups filtering (findConfirmedReminderSignups)");
  const unconfirmedEmail = `${MARKER}-unconfirmed@example.invalid`;
  const confirmedEmail = `${MARKER}-confirmed@example.invalid`;
  const unsubscribedEmail = `${MARKER}-unsubscribed@example.invalid`;

  await sql`
    insert into reminder_signups (email, confirm_token, unsubscribe_token, locale)
    values (${unconfirmedEmail}, ${`${MARKER}-t1`}, ${`${MARKER}-u1`}, 'de')
  `;
  await sql`
    insert into reminder_signups (email, confirm_token, unsubscribe_token, confirmed, confirmed_at, locale)
    values (${confirmedEmail}, ${`${MARKER}-t2`}, ${`${MARKER}-u2`}, true, now(), 'de')
  `;
  await sql`
    insert into reminder_signups (
      email, confirm_token, unsubscribe_token, confirmed, confirmed_at, unsubscribed_at, locale
    )
    values (${unsubscribedEmail}, ${`${MARKER}-t3`}, ${`${MARKER}-u3`}, true, now(), now(), 'de')
  `;

  const mailable = await sql`
    select email from reminder_signups
    where confirmed = true and unsubscribed_at is null and email like ${`${MARKER}-%@example.invalid`}
    order by email
  `;
  check("only the confirmed, still-subscribed row is returned", mailable.map((row) => row.email), [
    confirmedEmail,
  ]);

  const deleted = await sql`
    delete from reminder_signups where email like ${`${MARKER}-%@example.invalid`} returning id
  `;
  check("cleans up all three rows", deleted.length, 3);
}

async function verifyRecruitingWindows() {
  console.log("\nrecruiting_windows");
  const semester = `ZZ${String(Date.now()).slice(-2)}`; // doesn't match HWS/FSS on purpose, see below
  const startsAt = "2099-01-01T00:00:00+01:00";
  const endsAt = "2099-01-14T00:00:00+01:00";

  let rejected = false;
  try {
    await sql`
      insert into recruiting_windows (semester, starts_at, ends_at)
      values (${semester}, ${startsAt}, ${endsAt})
    `;
  } catch {
    rejected = true;
  }
  check("semester format check rejects a non-HWS/FSS label", rejected, true);

  const validSemester = `HWS${String(Date.now()).slice(-2)}`;
  const [inserted] = await sql`
    insert into recruiting_windows (semester, starts_at, ends_at)
    values (${validSemester}, ${startsAt}, ${endsAt})
    returning *
  `;
  check("insert returns an id", typeof inserted.id, "string");

  let endBeforeStartRejected = false;
  try {
    await sql`
      insert into recruiting_windows (semester, starts_at, ends_at)
      values (${`FSS${String(Date.now()).slice(-2)}`}, ${endsAt}, ${startsAt})
    `;
  } catch {
    endBeforeStartRejected = true;
  }
  check("end-after-start check rejects an inverted window", endBeforeStartRejected, true);

  const deleted = await sql`delete from recruiting_windows where id = ${inserted.id} returning id`;
  check("delete removes exactly one row", deleted.length, 1);
}

async function verifyContactMessages() {
  console.log("\ncontact_messages");
  const email = `${MARKER}-contact@example.invalid`;
  const [inserted] = await sql`
    insert into contact_messages (name, email, subject, message, locale)
    values ('Verify Script', ${email}, 'DB verify', 'Verification run, not a real message.', 'de')
    returning *
  `;
  check("mail_status defaults to pending", inserted.mail_status, "pending");

  const deleted = await sql`delete from contact_messages where id = ${inserted.id} returning id`;
  check("delete removes exactly one row", deleted.length, 1);
}

async function verifyRateLimitHits() {
  console.log("\nrate_limit_hits");
  const bucket = MARKER;
  const windowStart = new Date(0).toISOString();

  const [first] = await sql`
    insert into rate_limit_hits (bucket, window_start, count)
    values (${bucket}, ${windowStart}, 1)
    on conflict (bucket, window_start) do update set count = rate_limit_hits.count + 1
    returning count
  `;
  check("first hit has count 1", first.count, 1);

  const [second] = await sql`
    insert into rate_limit_hits (bucket, window_start, count)
    values (${bucket}, ${windowStart}, 1)
    on conflict (bucket, window_start) do update set count = rate_limit_hits.count + 1
    returning count
  `;
  check("second hit increments to count 2", second.count, 2);

  const deleted = await sql`delete from rate_limit_hits where bucket = ${bucket} returning bucket`;
  check("delete removes exactly one row", deleted.length, 1);
}

await verifyApplications();
await verifyReminderSignups();
await verifyReminderFiltering();
await verifyRecruitingWindows();
await verifyContactMessages();
await verifyRateLimitHits();

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
