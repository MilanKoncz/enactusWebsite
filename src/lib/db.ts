import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * The only file in this codebase that writes SQL. Every route in app/api/
 * goes through the typed functions below, never through a raw `sql`
 * handle — that boundary is what keeps a future column rename or query
 * change a one-file diff.
 *
 * No multi-statement transactions anywhere here, on purpose: every
 * function below is exactly one atomic SQL statement (an INSERT, a
 * conditional UPDATE, or an upsert with RETURNING), so there is nothing
 * for a transaction to coordinate. See migrations/0001_init.sql and
 * docs/deployment.md for why that's sufficient — the short version is that
 * every race this schema cares about (double-clicking a confirmation link,
 * a concurrent rate-limit hit) is resolved by a single statement's own
 * WHERE clause or ON CONFLICT clause, not by wrapping several statements
 * together.
 *
 * The Neon client is created lazily, on first use, not at module load —
 * `next build` collects route metadata for every API route without
 * running any request handler, so a client built at import time would
 * make DATABASE_URL a build-time requirement instead of a runtime one.
 */

let cachedSql: NeonQueryFunction<false, false> | null = null;

function sql(): NeonQueryFunction<false, false> {
  if (cachedSql) return cachedSql;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see .env.example and docs/deployment.md.");
  }
  cachedSql = neon(connectionString);
  return cachedSql;
}

export type Locale = "de" | "en";
export type MailStatus = "pending" | "sent" | "failed";

export type ApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
  studyProgram: string;
  semester: number;
  university: string;
  priorInvolvement?: string;
  languagesSkills?: string;
  motivation: string;
  desiredAreas: string[];
  availabilityHours: number;
  heardAboutUs?: string;
  locale: Locale;
  // The recruiting cycle (content/recruiting.ts) this application belongs
  // to — see lib/recruitingSemester.ts. Distinct from `semester` above,
  // which is the applicant's own semester of study.
  recruitingSemester: string;
};

export type Application = ApplicationInput & {
  id: string;
  createdAt: Date;
  consentAt: Date;
  mailStatus: MailStatus;
  mailError: string | null;
  mailedAt: Date | null;
};

function toApplication(row: Record<string, unknown>): Application {
  return {
    id: row.id as string,
    createdAt: row.created_at as Date,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    studyProgram: row.study_program as string,
    semester: row.semester as number,
    university: row.university as string,
    priorInvolvement: (row.prior_involvement as string | null) ?? undefined,
    languagesSkills: (row.languages_skills as string | null) ?? undefined,
    motivation: row.motivation as string,
    desiredAreas: row.desired_areas as string[],
    availabilityHours: row.availability_hours as number,
    heardAboutUs: (row.heard_about_us as string | null) ?? undefined,
    consentAt: row.consent_at as Date,
    locale: row.locale as Locale,
    mailStatus: row.mail_status as MailStatus,
    mailError: (row.mail_error as string | null) ?? null,
    mailedAt: (row.mailed_at as Date | null) ?? null,
    recruitingSemester: row.recruiting_semester as string,
  };
}

// consent_at is set from the database's own clock (now()), not a
// client-supplied timestamp — it's the proof of consent, so it has to be
// the moment the server actually received and stored the request, not
// whatever a request body claims.
export async function insertApplication(input: ApplicationInput): Promise<Application> {
  const rows = await sql()`
    insert into applications (
      first_name, last_name, email, study_program, semester, university,
      prior_involvement, languages_skills, motivation, desired_areas,
      availability_hours, heard_about_us, consent_at, locale, recruiting_semester
    ) values (
      ${input.firstName}, ${input.lastName}, ${input.email}, ${input.studyProgram},
      ${input.semester}, ${input.university}, ${input.priorInvolvement ?? null},
      ${input.languagesSkills ?? null}, ${input.motivation}, ${input.desiredAreas},
      ${input.availabilityHours}, ${input.heardAboutUs ?? null}, now(), ${input.locale},
      ${input.recruitingSemester}
    )
    returning *
  `;
  return toApplication(rows[0] as Record<string, unknown>);
}

export async function markApplicationMailed(id: string): Promise<void> {
  await sql()`
    update applications set mail_status = 'sent', mailed_at = now(), mail_error = null
    where id = ${id}
  `;
}

export async function markApplicationMailFailed(id: string, error: string): Promise<void> {
  await sql()`
    update applications set mail_status = 'failed', mail_error = ${error}
    where id = ${id}
  `;
}

// Powers /admin/bewerbungen. Every field the admin list and CSV export need
// and nothing else the board doesn't ask to see there (motivation, desired
// areas, etc. stay out of both) — data minimisation applies to internal
// tooling too, not just what's collected from a visitor.
export type ApplicationSummary = {
  id: string;
  createdAt: Date;
  firstName: string;
  lastName: string;
  email: string;
  studyProgram: string;
  mailStatus: MailStatus;
  recruitingSemester: string;
};

function toApplicationSummary(row: Record<string, unknown>): ApplicationSummary {
  return {
    id: row.id as string,
    createdAt: row.created_at as Date,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    studyProgram: row.study_program as string,
    mailStatus: row.mail_status as MailStatus,
    recruitingSemester: row.recruiting_semester as string,
  };
}

export async function listApplications(): Promise<ApplicationSummary[]> {
  const rows = await sql()`
    select id, created_at, first_name, last_name, email, study_program, mail_status, recruiting_semester
    from applications
    order by created_at desc
  `;
  return (rows as Record<string, unknown>[]).map(toApplicationSummary);
}

export async function listApplicationsBySemester(recruitingSemester: string): Promise<ApplicationSummary[]> {
  const rows = await sql()`
    select id, created_at, first_name, last_name, email, study_program, mail_status, recruiting_semester
    from applications
    where recruiting_semester = ${recruitingSemester}
    order by created_at desc
  `;
  return (rows as Record<string, unknown>[]).map(toApplicationSummary);
}

export async function deleteExpiredApplications(cutoff: Date): Promise<number> {
  const rows = await sql()`
    delete from applications where created_at <= ${cutoff.toISOString()} returning id
  `;
  return rows.length;
}

export type ReminderSignupResult = {
  confirmed: boolean;
  confirmToken: string;
  unsubscribeToken: string;
};

// A single upsert, not a read-then-write: on a repeat signup for an
// already-confirmed address, the CASE keeps the existing tokens instead of
// minting new ones, so a confirmed subscriber's unsubscribe link never
// changes underneath them just because they filled the form in twice.
export async function upsertReminderSignup(
  email: string,
  confirmToken: string,
  unsubscribeToken: string,
  locale: Locale,
): Promise<ReminderSignupResult> {
  const rows = await sql()`
    insert into reminder_signups (email, confirm_token, unsubscribe_token, locale)
    values (${email}, ${confirmToken}, ${unsubscribeToken}, ${locale})
    on conflict (email) do update set
      confirm_token = case
        when reminder_signups.confirmed then reminder_signups.confirm_token
        else excluded.confirm_token
      end,
      unsubscribe_token = case
        when reminder_signups.confirmed then reminder_signups.unsubscribe_token
        else excluded.unsubscribe_token
      end,
      locale = excluded.locale
    returning confirmed, confirm_token, unsubscribe_token
  `;
  const row = rows[0] as Record<string, unknown>;
  return {
    confirmed: row.confirmed as boolean,
    confirmToken: row.confirm_token as string,
    unsubscribeToken: row.unsubscribe_token as string,
  };
}

export type ConfirmedReminderSignup = {
  id: string;
  email: string;
  locale: Locale;
};

// The WHERE clause is the entire race guard: a second click on the same
// confirmation link (or two concurrent clicks) finds zero rows the second
// time, because `confirmed` is already true — no read-then-write gap to
// double-confirm through.
export async function confirmReminderSignup(
  token: string,
  confirmationIp: string,
): Promise<ConfirmedReminderSignup | null> {
  const rows = await sql()`
    update reminder_signups
    set confirmed = true, confirmed_at = now(), confirmation_ip = ${confirmationIp}
    where confirm_token = ${token} and confirmed = false
    returning id, email, locale
  `;
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  return { id: row.id as string, email: row.email as string, locale: row.locale as Locale };
}

export type UnsubscribeResult = { id: string; locale: Locale } | null;

export async function unsubscribeReminder(token: string): Promise<UnsubscribeResult> {
  const rows = await sql()`
    update reminder_signups
    set unsubscribed_at = now()
    where unsubscribe_token = ${token} and unsubscribed_at is null
    returning id, locale
  `;
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  return { id: row.id as string, locale: row.locale as Locale };
}

// The query the "unconfirmed rows are never mailed" guarantee rests on:
// both conditions are enforced here, in the query itself, rather than left
// to a caller to remember to filter for.
export async function findConfirmedReminderSignups(): Promise<ConfirmedReminderSignup[]> {
  const rows = await sql()`
    select id, email, locale from reminder_signups
    where confirmed = true and unsubscribed_at is null
  `;
  return (rows as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    locale: row.locale as Locale,
  }));
}

// Deletes two disjoint groups in one statement: unconfirmed rows nobody
// ever completed the double opt-in for (once stale), and confirmed rows
// whose subscriber has since unsubscribed (kept only long enough for the
// unsubscribe itself to be recorded, then swept on the next run).
export async function deleteExpiredReminderSignups(unconfirmedCutoff: Date): Promise<number> {
  const rows = await sql()`
    delete from reminder_signups
    where (confirmed = false and created_at < ${unconfirmedCutoff.toISOString()})
       or unsubscribed_at is not null
    returning id
  `;
  return rows.length;
}

export type ContactMessageInput = {
  name: string;
  email: string;
  subject?: string;
  message: string;
  locale: Locale;
};

export type ContactMessage = ContactMessageInput & { id: string; createdAt: Date };

export async function insertContactMessage(input: ContactMessageInput): Promise<ContactMessage> {
  const rows = await sql()`
    insert into contact_messages (name, email, subject, message, locale)
    values (${input.name}, ${input.email}, ${input.subject ?? null}, ${input.message}, ${input.locale})
    returning id, created_at
  `;
  const row = rows[0] as Record<string, unknown>;
  return { ...input, id: row.id as string, createdAt: row.created_at as Date };
}

export async function markContactMessageMailed(id: string): Promise<void> {
  await sql()`
    update contact_messages set mail_status = 'sent', mail_error = null where id = ${id}
  `;
}

export async function markContactMessageMailFailed(id: string, error: string): Promise<void> {
  await sql()`
    update contact_messages set mail_status = 'failed', mail_error = ${error} where id = ${id}
  `;
}

export async function deleteExpiredContactMessages(cutoff: Date): Promise<number> {
  const rows = await sql()`
    delete from contact_messages where created_at < ${cutoff.toISOString()} returning id
  `;
  return rows.length;
}

// One roundtrip, not a read followed by a write: ON CONFLICT DO UPDATE
// increments and returns the new count atomically, so two concurrent
// requests from the same bucket can't both read the same stale count and
// both decide they're still under the limit.
export async function consumeRateLimit(bucket: string, windowStart: Date): Promise<number> {
  const rows = await sql()`
    insert into rate_limit_hits (bucket, window_start, count)
    values (${bucket}, ${windowStart.toISOString()}, 1)
    on conflict (bucket, window_start) do update set count = rate_limit_hits.count + 1
    returning count
  `;
  return (rows[0] as Record<string, unknown>).count as number;
}

export async function pruneRateLimitHits(olderThan: Date): Promise<number> {
  const rows = await sql()`
    delete from rate_limit_hits where window_start < ${olderThan.toISOString()} returning bucket
  `;
  return rows.length;
}
