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

// Powers /admin/mails's resend. Reads the whole row, unlike
// ApplicationSummary below: re-rendering the PDF and re-sending the
// notification needs every field the original send had, so this is the one
// query allowed to return an application in full — and it's never used to
// populate a list, only to act on a single record the board picked.
export async function findApplicationById(id: string): Promise<Application | null> {
  const rows = await sql()`select * from applications where id = ${id}`;
  return rows.length > 0 ? toApplication(rows[0] as Record<string, unknown>) : null;
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

export type RecruitingWindowRow = {
  id: string;
  semester: string;
  start: string;
  end: string;
  createdAt: Date;
};

function toRecruitingWindowRow(row: Record<string, unknown>): RecruitingWindowRow {
  return {
    id: row.id as string,
    semester: row.semester as string,
    // Kept as ISO strings, not Date objects: content/recruiting.ts's
    // RecruitingWindow type (still the shared shape every pure function in
    // lib/recruitingStatus.ts and lib/recruitingSemester.ts expects) stores
    // start/end as ISO datetime strings with an explicit UTC offset.
    start: (row.starts_at as Date).toISOString(),
    end: (row.ends_at as Date).toISOString(),
    createdAt: row.created_at as Date,
  };
}

export async function listRecruitingWindows(): Promise<RecruitingWindowRow[]> {
  const rows = await sql()`
    select id, semester, starts_at, ends_at, created_at
    from recruiting_windows
    order by starts_at asc
  `;
  return (rows as Record<string, unknown>[]).map(toRecruitingWindowRow);
}

// Answered by Postgres rather than by comparing dates in the page: reading
// the clock during a server component's render is impure (the
// react-hooks/purity rule rejects it, rightly), and the database's `now()`
// is the same clock /api/cron/cleanup and the window checks already compare
// against — so there's one authoritative answer to "is anything still
// ahead?" instead of one per process.
export async function countFutureRecruitingWindows(): Promise<number> {
  const rows = await sql()`
    select count(*)::int as count from recruiting_windows where ends_at > now()
  `;
  return (rows[0] as Record<string, unknown>).count as number;
}

export async function findOverlappingRecruitingWindows(
  startsAt: Date,
  endsAt: Date,
  excludeId?: string,
): Promise<RecruitingWindowRow[]> {
  const rows = await sql()`
    select id, semester, starts_at, ends_at, created_at
    from recruiting_windows
    where tstzrange(starts_at, ends_at, '[]') && tstzrange(${startsAt.toISOString()}, ${endsAt.toISOString()}, '[]')
      and (${excludeId ?? null}::uuid is null or id != ${excludeId ?? null}::uuid)
  `;
  return (rows as Record<string, unknown>[]).map(toRecruitingWindowRow);
}

export async function insertRecruitingWindow(
  semester: string,
  startsAt: Date,
  endsAt: Date,
): Promise<RecruitingWindowRow> {
  const rows = await sql()`
    insert into recruiting_windows (semester, starts_at, ends_at)
    values (${semester}, ${startsAt.toISOString()}, ${endsAt.toISOString()})
    returning id, semester, starts_at, ends_at, created_at
  `;
  return toRecruitingWindowRow(rows[0] as Record<string, unknown>);
}

export async function updateRecruitingWindow(
  id: string,
  semester: string,
  startsAt: Date,
  endsAt: Date,
): Promise<RecruitingWindowRow | null> {
  const rows = await sql()`
    update recruiting_windows
    set semester = ${semester}, starts_at = ${startsAt.toISOString()}, ends_at = ${endsAt.toISOString()}
    where id = ${id}
    returning id, semester, starts_at, ends_at, created_at
  `;
  return rows.length > 0 ? toRecruitingWindowRow(rows[0] as Record<string, unknown>) : null;
}

/**
 * Everything stored about one email address, across all three form tables —
 * the query behind /admin/loeschanfragen, which exists to answer GDPR
 * Art. 15 (what do you have on me) and Art. 17 (delete it).
 *
 * Unlike every other admin list, this one returns the *full* rows: an
 * access request is precisely a request for all of it, so narrowing the
 * select here would make the answer incomplete. That's also why it's keyed
 * by an exact address the board was given rather than a search — this is a
 * lookup for a named person, not a way to browse applicants.
 *
 * Case-insensitive: addresses are compared with lower(), because someone
 * writing in from Jane@Example.com about the data they submitted as
 * jane@example.com is the same person and would otherwise be told nothing
 * is stored.
 */
export type PersonalDataMatches = {
  applications: Application[];
  contactMessages: ContactMessage[];
  reminderSignups: ReminderSignupSummary[];
};

export async function findPersonalDataByEmail(email: string): Promise<PersonalDataMatches> {
  const needle = email.trim().toLowerCase();

  const applicationRows = await sql()`select * from applications where lower(email) = ${needle}`;
  const contactRows = await sql()`
    select id, created_at, name, email, subject, message, locale from contact_messages
    where lower(email) = ${needle}
  `;
  const reminderRows = await sql()`
    select id, created_at, email, confirmed, confirmed_at, unsubscribed_at, mail_status
    from reminder_signups where lower(email) = ${needle}
  `;

  return {
    applications: (applicationRows as Record<string, unknown>[]).map(toApplication),
    contactMessages: (contactRows as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      createdAt: row.created_at as Date,
      name: row.name as string,
      email: row.email as string,
      subject: (row.subject as string | null) ?? undefined,
      message: row.message as string,
      locale: row.locale as Locale,
    })),
    reminderSignups: (reminderRows as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      createdAt: row.created_at as Date,
      email: row.email as string,
      confirmed: row.confirmed as boolean,
      confirmedAt: (row.confirmed_at as Date | null) ?? null,
      unsubscribedAt: (row.unsubscribed_at as Date | null) ?? null,
      mailStatus: row.mail_status as MailStatus,
    })),
  };
}

export type DeletedCounts = { applications: number; contactMessages: number; reminderSignups: number };

// Three statements rather than one, because they're three tables — but note
// there is no transaction: if the second fails, the first has already
// happened. That's the right failure mode for a deletion request, where
// having deleted *more* than the caller saw confirmed is the safe direction
// and a partial delete can simply be repeated.
export async function deletePersonalDataByEmail(email: string): Promise<DeletedCounts> {
  const needle = email.trim().toLowerCase();

  const applications = await sql()`
    delete from applications where lower(email) = ${needle} returning id
  `;
  const contactMessages = await sql()`
    delete from contact_messages where lower(email) = ${needle} returning id
  `;
  const reminderSignups = await sql()`
    delete from reminder_signups where lower(email) = ${needle} returning id
  `;

  return {
    applications: applications.length,
    contactMessages: contactMessages.length,
    reminderSignups: reminderSignups.length,
  };
}

// Postgres 23505 = unique_violation. Recognised here rather than in a route
// so callers don't have to know the driver's error shape: entering the same
// semester label twice is an ordinary mistake that deserves a clear
// conflict, not a 500 that reads like the site is broken.
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function deleteRecruitingWindow(id: string): Promise<boolean> {
  const rows = await sql()`
    delete from recruiting_windows where id = ${id} returning id
  `;
  return rows.length > 0;
}

export type ReminderSignupResult = {
  id: string;
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
    returning id, confirmed, confirm_token, unsubscribe_token
  `;
  const row = rows[0] as Record<string, unknown>;
  return {
    id: row.id as string,
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

// The same mail bookkeeping applications and contact_messages already had
// (migrations/0004). Without it a subscriber whose double-opt-in link never
// arrived was invisible: /api/reminder logged the failure and moved on, so
// nobody could tell "never confirmed because they chose not to" from
// "never confirmed because the mail never came".
export async function markReminderMailed(id: string): Promise<void> {
  await sql()`
    update reminder_signups set mail_status = 'sent', mailed_at = now(), mail_error = null
    where id = ${id}
  `;
}

export async function markReminderMailFailed(id: string, error: string): Promise<void> {
  await sql()`
    update reminder_signups set mail_status = 'failed', mail_error = ${error}
    where id = ${id}
  `;
}

export type ReminderSignupRecord = {
  id: string;
  createdAt: Date;
  email: string;
  confirmed: boolean;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  locale: Locale;
  confirmToken: string;
  unsubscribeToken: string;
  mailStatus: MailStatus;
};

function toReminderSignupRecord(row: Record<string, unknown>): ReminderSignupRecord {
  return {
    id: row.id as string,
    createdAt: row.created_at as Date,
    email: row.email as string,
    confirmed: row.confirmed as boolean,
    confirmedAt: (row.confirmed_at as Date | null) ?? null,
    unsubscribedAt: (row.unsubscribed_at as Date | null) ?? null,
    locale: row.locale as Locale,
    confirmToken: row.confirm_token as string,
    unsubscribeToken: row.unsubscribe_token as string,
    mailStatus: row.mail_status as MailStatus,
  };
}

/**
 * Powers /admin/erinnerungen and its CSV export. Deliberately narrower than
 * ReminderSignupRecord: the two tokens stay out, because a list rendered in
 * a browser (and exported to a file that gets emailed around) has no
 * business carrying live confirm and unsubscribe links for other people's
 * addresses — anyone holding the export could confirm or unsubscribe them.
 */
export type ReminderSignupSummary = {
  id: string;
  createdAt: Date;
  email: string;
  confirmed: boolean;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  mailStatus: MailStatus;
};

export async function listReminderSignups(): Promise<ReminderSignupSummary[]> {
  const rows = await sql()`
    select id, created_at, email, confirmed, confirmed_at, unsubscribed_at, mail_status
    from reminder_signups
    order by created_at desc
  `;
  return (rows as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as Date,
    email: row.email as string,
    confirmed: row.confirmed as boolean,
    confirmedAt: (row.confirmed_at as Date | null) ?? null,
    unsubscribedAt: (row.unsubscribed_at as Date | null) ?? null,
    mailStatus: row.mail_status as MailStatus,
  }));
}

// Includes both tokens, unlike listReminderSignups above: resending a
// confirmation mail has to rebuild the very links the original contained,
// and those are the tokens. Single-record only, never used for a list.
export async function findReminderSignupById(id: string): Promise<ReminderSignupRecord | null> {
  const rows = await sql()`
    select id, created_at, email, confirmed, confirmed_at, unsubscribed_at, locale,
           confirm_token, unsubscribe_token, mail_status
    from reminder_signups where id = ${id}
  `;
  return rows.length > 0 ? toReminderSignupRecord(rows[0] as Record<string, unknown>) : null;
}

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

/**
 * Powers /admin/kontakt. Carries the subject but not the message body: the
 * board reads the actual enquiry in the mailbox it was forwarded to, so
 * rendering it a second time in a browser tab would copy personal
 * correspondence somewhere it isn't needed. What this page is for is
 * answering "did it arrive, and if not why" — which needs the status, not
 * the content.
 */
export type ContactMessageSummary = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  subject: string | null;
  mailStatus: MailStatus;
};

export async function listContactMessages(): Promise<ContactMessageSummary[]> {
  const rows = await sql()`
    select id, created_at, name, email, subject, mail_status
    from contact_messages
    order by created_at desc
  `;
  return (rows as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as Date,
    name: row.name as string,
    email: row.email as string,
    subject: (row.subject as string | null) ?? null,
    mailStatus: row.mail_status as MailStatus,
  }));
}

export async function findContactMessageById(id: string): Promise<ContactMessage | null> {
  const rows = await sql()`
    select id, created_at, name, email, subject, message, locale from contact_messages where id = ${id}
  `;
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  return {
    id: row.id as string,
    createdAt: row.created_at as Date,
    name: row.name as string,
    email: row.email as string,
    subject: (row.subject as string | null) ?? undefined,
    message: row.message as string,
    locale: row.locale as Locale,
  };
}

/**
 * The three form tables share one question — "whose notification never went
 * out?" — so /admin/mails asks it once, as one UNION ALL, rather than three
 * round trips the page would then have to interleave by date itself.
 *
 * `label` is whatever identifies the record to a human reading the list: an
 * applicant's name, a contact message's subject, and nothing at all for a
 * reminder signup, where the address *is* the record. It's built in SQL so
 * all three branches come back the same shape and a single `order by` can
 * sort across them.
 *
 * Note this is the only place mail_error is read back out. It holds a
 * provider message, never anything a visitor typed, so showing it to the
 * board leaks nothing — and without it the board can only see *that* a send
 * failed, not why, which is the difference between a fixable problem and a
 * mystery.
 */
export type FailedMailSource = "applications" | "contact_messages" | "reminder_signups";

export type FailedMail = {
  source: FailedMailSource;
  id: string;
  createdAt: Date;
  email: string;
  label: string;
  mailError: string | null;
};

export async function listFailedMails(): Promise<FailedMail[]> {
  const rows = await sql()`
    select 'applications' as source, id, created_at, email,
           first_name || ' ' || last_name as label, mail_error
    from applications where mail_status = 'failed'
    union all
    select 'contact_messages' as source, id, created_at, email,
           coalesce(subject, '') as label, mail_error
    from contact_messages where mail_status = 'failed'
    union all
    select 'reminder_signups' as source, id, created_at, email,
           '' as label, mail_error
    from reminder_signups where mail_status = 'failed'
    order by created_at desc
  `;
  return (rows as Record<string, unknown>[]).map((row) => ({
    source: row.source as FailedMailSource,
    id: row.id as string,
    createdAt: row.created_at as Date,
    email: row.email as string,
    label: row.label as string,
    mailError: (row.mail_error as string | null) ?? null,
  }));
}

/**
 * The cron audit trail (migrations/0005). Written by /api/cron/cleanup and
 * read by /admin/system, which is the only reason it exists: Vercel keeps
 * runtime logs for a day on this plan, so "has the retention routine run
 * lately?" was unanswerable after that — and the job has already missed a
 * scheduled slot once without anything noticing.
 */
export type CronRun = {
  id: string;
  job: string;
  startedAt: Date;
  finishedAt: Date | null;
  ok: boolean;
  deletedApplications: number;
  deletedContactMessages: number;
  deletedReminderSignups: number;
  prunedRateLimitHits: number;
  error: string | null;
};

function toCronRun(row: Record<string, unknown>): CronRun {
  return {
    id: row.id as string,
    job: row.job as string,
    startedAt: row.started_at as Date,
    finishedAt: (row.finished_at as Date | null) ?? null,
    ok: row.ok as boolean,
    deletedApplications: row.deleted_applications as number,
    deletedContactMessages: row.deleted_contact_messages as number,
    deletedReminderSignups: row.deleted_reminder_signups as number,
    prunedRateLimitHits: row.pruned_rate_limit_hits as number,
    error: (row.error as string | null) ?? null,
  };
}

// Written before the deletes run, not after: a run that dies partway through
// still leaves a row, with ok = false and no finished_at. Recording only
// completed runs would make a crash look exactly like a run that never
// started, which is the distinction this table exists to make.
export async function startCronRun(job: string): Promise<string> {
  const rows = await sql()`insert into cron_runs (job) values (${job}) returning id`;
  return (rows[0] as Record<string, unknown>).id as string;
}

export async function finishCronRun(
  id: string,
  counts: {
    applications: number | null;
    contactMessages: number | null;
    reminderSignups: number | null;
    rateLimitHits: number | null;
  },
  error: string | null,
): Promise<void> {
  await sql()`
    update cron_runs set
      finished_at = now(),
      ok = ${error === null},
      deleted_applications = ${counts.applications ?? 0},
      deleted_contact_messages = ${counts.contactMessages ?? 0},
      deleted_reminder_signups = ${counts.reminderSignups ?? 0},
      pruned_rate_limit_hits = ${counts.rateLimitHits ?? 0},
      error = ${error}
    where id = ${id}
  `;
}

export async function listCronRuns(limit = 10): Promise<CronRun[]> {
  const rows = await sql()`
    select id, job, started_at, finished_at, ok, deleted_applications,
           deleted_contact_messages, deleted_reminder_signups,
           pruned_rate_limit_hits, error
    from cron_runs
    order by started_at desc
    limit ${limit}
  `;
  return (rows as Record<string, unknown>[]).map(toCronRun);
}

/**
 * Row counts per table, for /admin/system. `count(*)` on tables this size
 * is trivially cheap, and one query keeps it to a single round trip.
 * Doubles as the database reachability check: if this resolves, Neon is
 * answering — no separate ping needed.
 */
export type TableCounts = {
  applications: number;
  contactMessages: number;
  reminderSignups: number;
  recruitingWindows: number;
  rateLimitHits: number;
  cronRuns: number;
};

export async function countRowsPerTable(): Promise<TableCounts> {
  const rows = await sql()`
    select
      (select count(*)::int from applications) as applications,
      (select count(*)::int from contact_messages) as contact_messages,
      (select count(*)::int from reminder_signups) as reminder_signups,
      (select count(*)::int from recruiting_windows) as recruiting_windows,
      (select count(*)::int from rate_limit_hits) as rate_limit_hits,
      (select count(*)::int from cron_runs) as cron_runs
  `;
  const row = rows[0] as Record<string, unknown>;
  return {
    applications: row.applications as number,
    contactMessages: row.contact_messages as number,
    reminderSignups: row.reminder_signups as number,
    recruitingWindows: row.recruiting_windows as number,
    rateLimitHits: row.rate_limit_hits as number,
    cronRuns: row.cron_runs as number,
  };
}

// A plain read, no write — checkRateLimit (rateLimit.ts) calls this first
// so a request that's already over the limit gets rejected without
// touching the database at all. Zero rows means no hit recorded yet this
// window, i.e. a count of 0.
export async function peekRateLimit(bucket: string, windowStart: Date): Promise<number> {
  const rows = await sql()`
    select count from rate_limit_hits where bucket = ${bucket} and window_start = ${windowStart.toISOString()}
  `;
  return rows.length > 0 ? ((rows[0] as Record<string, unknown>).count as number) : 0;
}

// One roundtrip, not a read followed by a write: ON CONFLICT DO UPDATE
// increments and returns the new count atomically, so two concurrent
// requests from the same bucket can't both read the same stale count and
// both decide they're still under the limit. Only called once
// peekRateLimit has already confirmed the request is under the limit —
// this is the write that actually counts the request, not the check.
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
