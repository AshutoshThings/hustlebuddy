import { Pool, type PoolConfig } from "pg";

// TLS to the database is verified by default.
// - Supabase (and most managed Postgres) sign certs with their own root CA:
//   download it (Supabase: Project Settings → Database → SSL configuration)
//   and put the PEM in DATABASE_CA_CERT. Literal "\n" sequences are accepted
//   so it can live on one line in an env file.
// - DATABASE_SSL_INSECURE=true turns verification off. Only for local
//   experiments: it lets anyone on the network path read and alter traffic.
// - DATABASE_SSL=disable connects without TLS, for a Postgres on the same
//   machine (tests, CI). Only honored when DATABASE_URL points at localhost.
function isLocalDatabase(): boolean {
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").hostname;
    return ["localhost", "127.0.0.1", "[::1]"].includes(host);
  } catch {
    return false;
  }
}

export function sslConfig(): PoolConfig["ssl"] {
  if (process.env.DATABASE_SSL === "disable") {
    if (isLocalDatabase()) return false;
    console.warn("DATABASE_SSL=disable ignored: database is not on localhost");
  }

  const ca = process.env.DATABASE_CA_CERT;
  if (ca) return { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true };

  if (process.env.DATABASE_SSL_INSECURE === "true") {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "DATABASE_SSL_INSECURE=true in production: database TLS is not verified",
      );
    }
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: true };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
});

export default pool;
