// Applies every file in migrations/ that hasn't run yet, in filename order,
// tracked in a schema_migrations table. No migration framework installed
// (no Drizzle, no node-pg-migrate) — the schema is small enough that plain
// numbered .sql files plus this runner are the whole tool.
//
// Usage: `node --env-file=.env.local scripts/migrate.mjs`
// (`npm run db:migrate` wires that up.) Requires DATABASE_URL; nothing here
// runs against a mock — see docs/deployment.md.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Run with `node --env-file=.env.local scripts/migrate.mjs`.");
  process.exit(1);
}

const sql = neon(connectionString);
const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

// The Neon HTTP driver runs one statement per call — a migration file with
// several `create table`/`create index` statements has to be split before
// each one is sent. Splitting on `;` is safe for the migrations this repo
// writes: no string literal in any of them contains a semicolon.
function splitStatements(fileContents) {
  return fileContents
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.split("\n").every((line) => line.trim().startsWith("--") || line.trim() === ""));
}

async function main() {
  await sql`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const appliedRows = await sql`select name from schema_migrations`;
  const applied = new Set(appliedRows.map((row) => row.name));

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file} (already applied)`);
      continue;
    }

    const statements = splitStatements(readFileSync(join(migrationsDir, file), "utf8"));
    console.log(`apply  ${file} (${statements.length} statement${statements.length === 1 ? "" : "s"})`);
    for (const statement of statements) {
      await sql.query(statement);
    }
    await sql`insert into schema_migrations (name) values (${file})`;
    console.log(`done   ${file}`);
  }

  console.log("Migrations up to date.");
}

await main();
