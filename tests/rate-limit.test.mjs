import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";
import { call, freshIp, pool, uniqueEmail } from "./helpers.mjs";

// Every key these tests touch, so they can be removed afterwards.
const keys = [];
const keyOf = (name, id) => {
  const k = createHash("sha256").update(`${name}:${id}`).digest("hex");
  keys.push(k);
  return k;
};
after(() => pool.query("DELETE FROM rate_limits WHERE key = ANY($1)", [keys]));

const post = (path, body, ip) => call(path, { method: "POST", body, ip });
const inOrder = async (n, fn) => {
  const out = [];
  for (let i = 0; i < n; i++) out.push(await fn(i));
  return out;
};
const wrong = "Wrong#Pass123";

test("login: 10 tries per IP and email, then 429 with Retry-After", async () => {
  const ip = freshIp();
  const email = uniqueEmail("rl");
  keyOf("login:ip", ip);
  keyOf("login:ip-email", `${ip}:${email}`);
  const rs = await inOrder(11, () =>
    post("/api/auth/login", { email, password: wrong }, ip),
  );
  assert.ok(rs.slice(0, 10).every((r) => r.status === 401));
  assert.equal(rs[10].status, 429);
  assert.ok(Number(rs[10].res.headers.get("retry-after")) > 800);

  keyOf("login:ip-email", `${ip}:other-${email}`);
  assert.equal(
    (
      await post(
        "/api/auth/login",
        { email: `other-${email}`, password: wrong },
        ip,
      )
    ).status,
    401,
    "other emails on the same IP still allowed",
  );
  const ip2 = freshIp();
  keyOf("login:ip", ip2);
  keyOf("login:ip-email", `${ip2}:${email}`);
  assert.equal(
    (await post("/api/auth/login", { email, password: wrong }, ip2)).status,
    401,
    "the account isn't locked for other IPs",
  );
});

test("login: 30 per IP across emails", async () => {
  const ip = freshIp();
  keyOf("login:ip", ip);
  const rs = await inOrder(31, (i) => {
    const email = uniqueEmail(`rl${i}`);
    keyOf("login:ip-email", `${ip}:${email}`);
    return post("/api/auth/login", { email, password: wrong }, ip);
  });
  assert.ok(rs.slice(0, 30).every((r) => r.status === 401));
  assert.equal(rs[30].status, 429);
});

test("login: 40 parallel requests let exactly 10 through, and the window resets", async () => {
  const ip = freshIp();
  const email = uniqueEmail("rlpar");
  const ipKey = keyOf("login:ip", ip);
  const pairKey = keyOf("login:ip-email", `${ip}:${email}`);
  const rs = await Promise.all(
    Array.from({ length: 40 }, () =>
      post("/api/auth/login", { email, password: wrong }, ip),
    ),
  );
  assert.equal(rs.filter((r) => r.status !== 429).length, 10);

  await pool.query(
    "UPDATE rate_limits SET window_start = now() - interval '16 minutes' WHERE key = ANY($1)",
    [[ipKey, pairKey]],
  );
  assert.equal(
    (await post("/api/auth/login", { email, password: wrong }, ip)).status,
    401,
  );
});

test("signup: 10 per IP per hour", async () => {
  const ip = freshIp();
  keyOf("signup:ip", ip);
  const rs = await inOrder(11, () =>
    post("/api/auth/signup", { name: "x" }, ip),
  );
  assert.ok(rs.slice(0, 10).every((r) => r.status === 400));
  assert.equal(rs[10].status, 429);
});

for (const [path, name] of [
  ["/api/auth/verify", "verify:ip"],
  ["/api/auth/reset-password", "reset:ip"],
]) {
  test(`${path}: 30 per IP`, async () => {
    const ip = freshIp();
    keyOf(name, ip);
    const body = {
      email: uniqueEmail("rlotp"),
      otp: "000000",
      password: "x",
      newPassword: "x",
    };
    const rs = await inOrder(31, () => post(path, body, ip));
    assert.ok(rs.slice(0, 30).every((r) => r.status === 400));
    assert.equal(rs[30].status, 429);
  });
}

test("reset request: 5 per email across IPs, 10 per IP", async () => {
  const victim = uniqueEmail("victim");
  keyOf("reset-request:email", victim);
  let rs = await inOrder(6, () => {
    const ip = freshIp();
    keyOf("reset-request:ip", ip);
    return post("/api/auth/request-password-reset", { email: victim }, ip);
  });
  assert.ok(rs.slice(0, 5).every((r) => r.status === 200));
  assert.equal(rs[5].status, 429);

  const ip = freshIp();
  keyOf("reset-request:ip", ip);
  rs = await inOrder(11, (i) => {
    keyOf("reset-request:email", `r${i}-${victim}`);
    return post(
      "/api/auth/request-password-reset",
      { email: `r${i}-${victim}` },
      ip,
    );
  });
  assert.ok(rs.slice(0, 10).every((r) => r.status === 200));
  assert.equal(rs[10].status, 429);
});

test("stored keys are hashes, not emails or IPs", async () => {
  const { rows } = await pool.query(
    "SELECT key FROM rate_limits WHERE key = ANY($1)",
    [keys],
  );
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => /^[0-9a-f]{64}$/.test(r.key)));
});
