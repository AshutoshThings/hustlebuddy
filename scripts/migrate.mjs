// Applies migrations/*.sql in order, each in its own transaction, and records
// them in schema_migrations so each runs once.
//
//   node scripts/migrate.mjs             apply pending migrations
//   node scripts/migrate.mjs --baseline  mark every file as applied without
//                                        running it (for a database that was
//                                        migrated by hand, like production)
//
// Connection: DATABASE_URL, plus DATABASE_CA_CERT for verified TLS, or
// DATABASE_SSL=disable for a Postgres on localhost.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "migrations",
);
const baseline = process.argv.includes("--baseline");

function ssl() {
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (
    process.env.DATABASE_SSL === "disable" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(host)
  )
    return false;
  const ca = process.env.DATABASE_CA_CERT;
  return ca
    ? { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true }
    : { rejectUnauthorized: true };
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: ssl(),
});
await client.connect();

try {
  const {
    rows: [state],
  } = await client.query(`
    SELECT to_regclass('schema_migrations') IS NOT NULL AS tracked,
           to_regclass('users') IS NOT NULL AS has_tables`);

  if (!state.tracked && state.has_tables && !baseline) {
    console.error(
      "This database already has tables but no schema_migrations record.\n" +
        "Running every migration again could change data (015 clears pending codes).\n" +
        "If it is up to date, run once with --baseline, then use this script as usual.",
    );
    process.exit(1);
  }

  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const done = new Set(
    (await client.query("SELECT name FROM schema_migrations")).rows.map(
      (r) => r.name,
    ),
  );
  const files = (await readdir(dir))
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();
  const pending = files.filter((f) => !done.has(f));

  if (pending.length === 0) console.log("Up to date.");

  for (const file of pending) {
    await client.query("BEGIN");
    try {
      if (!baseline)
        await client.query(await readFile(path.join(dir, file), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      console.log(`${baseline ? "marked" : "applied"} ${file}`);
    } catch (e) {
      await client.query("ROLLBACK");
      console.error(`failed ${file}: ${e.message}`);
      process.exit(1);
    }
  }
} finally {
  await client.end();
}
