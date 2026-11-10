// Shared setup for the API tests. They talk to a running server (BASE_URL)
// and to the same database it uses (DATABASE_URL), to arrange state such as
// OTP codes and to check what landed.
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

export const BASE = process.env.BASE_URL || "http://localhost:3000";

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const host = new URL(url).hostname;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(host);
  // Tests create and delete users. Keep them off shared databases unless
  // someone opts in on purpose.
  if (!local && process.env.ALLOW_REMOTE_TEST_DB !== "1") {
    throw new Error(
      `Refusing to run tests against ${host}. Use a local Postgres, or set ALLOW_REMOTE_TEST_DB=1.`,
    );
  }
  return { url, local };
}

function ssl(local) {
  if (local && process.env.DATABASE_SSL === "disable") return false;
  const ca = process.env.DATABASE_CA_CERT;
  return ca
    ? { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true }
    : { rejectUnauthorized: true };
}

const { url, local } = databaseUrl();
export const pool = new pg.Pool({
  connectionString: url,
  ssl: ssl(local),
  max: 5,
});

// Each call gets its own fake client IP so rate-limit counters start fresh.
export const freshIp = () =>
  `10.${randomInt(250)}.${randomInt(250)}.${randomInt(1, 250)}`;

export const uniqueEmail = (tag) =>
  `hb-test-${tag}-${Date.now().toString(36)}${randomInt(1e6)}@example.invalid`;

// Minimal cookie jar: keeps what the server sets, drops what it clears.
export class Jar {
  constructor() {
    this.c = {};
  }
  take(res) {
    for (const sc of res.headers.getSetCookie()) {
      const [kv, ...attrs] = sc.split(";");
      const i = kv.indexOf("=");
      const k = kv.slice(0, i).trim();
      const v = kv.slice(i + 1);
      const cleared =
        v === "" || attrs.some((a) => /max-age=0\b/i.test(a.trim()));
      if (cleared) delete this.c[k];
      else this.c[k] = v;
    }
  }
  header(only) {
    return Object.entries(this.c)
      .filter(([k]) => !only || only.includes(k))
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

export async function call(
  path,
  {
    method = "GET",
    body,
    jar,
    cookie,
    ip,
    headers = {},
    redirect = "follow",
    form,
  } = {},
) {
  const h = { "X-Forwarded-For": ip ?? freshIp(), ...headers };
  if (body) h["Content-Type"] = "application/json";
  const ck = cookie ?? jar?.header();
  if (ck) h.Cookie = ck;
  const res = await fetch(BASE + path, {
    method,
    headers: h,
    body: form ?? (body ? JSON.stringify(body) : undefined),
    redirect,
  });
  jar?.take(res);
  let data = null;
  if ((res.headers.get("content-type") || "").includes("json")) {
    data = await res.json().catch(() => null);
  }
  return { res, status: res.status, data };
}

export async function createUser({ password, verified = true, tag = "user" }) {
  const email = uniqueEmail(tag);
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password_hash, is_verified) VALUES ('Test User', $1, $2, $3) RETURNING id",
    [email, hash, verified],
  );
  return { id: rows[0].id, email, password };
}

export async function deleteUser(id) {
  // Applications and sessions cascade (migration 016); resumes always did.
  if (id) await pool.query("DELETE FROM users WHERE id = $1", [id]);
}

export async function setOtp(
  userId,
  code,
  purpose,
  expiresAt = new Date(Date.now() + 10 * 60 * 1000),
) {
  await pool.query(
    "UPDATE users SET otp = $1, otp_expiry = $2, otp_purpose = $3, otp_attempts = 0 WHERE id = $4",
    [code, expiresAt, purpose, userId],
  );
}

export async function login(user, password = user.password) {
  const jar = new Jar();
  const r = await call("/api/auth/login", {
    method: "POST",
    body: { email: user.email, password },
    jar,
  });
  if (r.status !== 200) throw new Error(`login failed: ${r.status}`);
  return jar;
}
