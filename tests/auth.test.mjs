import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import {
  BASE,
  Jar,
  call,
  createUser,
  deleteUser,
  login,
  pool,
  setOtp,
} from "./helpers.mjs";

const PASSWORD = "Testpass#2026";
const NEW_PASSWORD = "Newpass#2026x";

const verify = (user, otp, password = PASSWORD) =>
  call("/api/auth/verify", {
    method: "POST",
    body: { email: user.email, otp, password },
  });

describe("email verification", () => {
  let user;
  before(async () => {
    user = await createUser({
      password: PASSWORD,
      verified: false,
      tag: "verify",
    });
  });
  after(() => deleteUser(user?.id));

  test("correct code with the wrong password is rejected", async () => {
    await setOtp(user.id, "123456", "verify");
    const r = await verify(user, "123456", "Wrong#Pass123");
    assert.equal(r.status, 400);
  });

  test("the 5th wrong attempt locks the code, even the right one stops working", async () => {
    await setOtp(user.id, "123456", "verify");
    for (let i = 0; i < 4; i++) await verify(user, String(100000 + i));
    const fifth = await verify(user, "000001");
    assert.match(fifth.data?.response?.[0] ?? "", /Too many/);
    assert.equal((await verify(user, "123456")).status, 400);
  });

  test("20 parallel guesses all fail and the code is wiped", async () => {
    await setOtp(user.id, "654321", "verify");
    const burst = await Promise.all(
      Array.from({ length: 20 }, (_, i) => verify(user, String(100000 + i))),
    );
    assert.ok(burst.every((b) => b.status === 400));
    const { rows } = await pool.query("SELECT otp FROM users WHERE id = $1", [
      user.id,
    ]);
    assert.equal(rows[0].otp, null);
  });

  test("a password-reset code can't verify an account", async () => {
    await setOtp(user.id, "222222", "reset");
    assert.equal((await verify(user, "222222")).status, 400);
  });

  test("an expired code is rejected as expired", async () => {
    await setOtp(user.id, "777777", "verify", new Date(Date.now() - 60 * 1000));
    const r = await verify(user, "777777");
    assert.match(r.data?.response?.[0] ?? "", /expired/i);
  });

  test("expiry is stored time-zone correct", async () => {
    await setOtp(user.id, "888888", "verify");
    const { rows } = await pool.query(
      "SELECT extract(epoch FROM otp_expiry - now())::int s FROM users WHERE id = $1",
      [user.id],
    );
    assert.ok(rows[0].s > 590 && rows[0].s <= 600, `${rows[0].s}s`);
  });

  test("correct code and password verify the account", async () => {
    await setOtp(user.id, "333333", "verify");
    assert.equal((await verify(user, "333333")).status, 200);
    const { rows } = await pool.query(
      "SELECT is_verified, otp FROM users WHERE id = $1",
      [user.id],
    );
    assert.equal(rows[0].is_verified, true);
    assert.equal(rows[0].otp, null);
  });
});

describe("sessions and password reset", () => {
  let user;
  before(async () => {
    user = await createUser({ password: PASSWORD, tag: "session" });
  });
  after(() => deleteUser(user?.id));

  test("login sets access and refresh cookies", async () => {
    const jar = new Jar();
    const r = await call("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: PASSWORD },
      jar,
    });
    assert.equal(r.status, 200);
    assert.ok(jar.c.accessToken && jar.c.refreshToken);
  });

  test("login is case-insensitive on email", async () => {
    const r = await call("/api/auth/login", {
      method: "POST",
      body: { email: user.email.toUpperCase(), password: PASSWORD },
    });
    assert.equal(r.status, 200);
  });

  test("an older password that breaks today's rules still logs in", async () => {
    const legacy = await createUser({ password: "simple", tag: "legacy" });
    try {
      const r = await call("/api/auth/login", {
        method: "POST",
        body: { email: legacy.email, password: "simple" },
      });
      assert.equal(r.status, 200);
    } finally {
      await deleteUser(legacy.id);
    }
  });

  test("refresh rotates the token and sets a new access cookie", async () => {
    const jar = await login(user);
    const oldRefresh = jar.c.refreshToken;
    delete jar.c.accessToken;
    const r = await call("/api/auth/refresh", { method: "POST", jar });
    assert.equal(r.status, 200);
    assert.ok(jar.c.accessToken);
    assert.notEqual(jar.c.refreshToken, oldRefresh);
    const reuse = await call("/api/auth/refresh", {
      method: "POST",
      cookie: `refreshToken=${oldRefresh}`,
    });
    assert.equal(reuse.status, 401);
  });

  test("the event stream needs the access-token cookie", async () => {
    const jar = await login(user);
    const ctl = new AbortController();
    const ok = await fetch(BASE + "/api/applications/stream", {
      headers: { Cookie: jar.header(["accessToken"]) },
      signal: ctl.signal,
    });
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get("content-type"), /event-stream/);
    ctl.abort();
    const inUrl = await fetch(
      BASE + "/api/applications/stream?token=" + jar.c.accessToken,
    );
    assert.equal(inUrl.status, 401);
    const refreshOnly = await fetch(BASE + "/api/applications/stream", {
      headers: { Cookie: jar.header(["refreshToken"]) },
    });
    assert.equal(refreshOnly.status, 401);
  });

  test("reset needs a reset code, signs out other sessions, keeps this one", async () => {
    const mine = await login(user);
    const other = await login(user);

    await setOtp(user.id, "444444", "verify");
    let r = await call("/api/auth/reset-password", {
      method: "POST",
      body: { email: user.email, otp: "444444", newPassword: NEW_PASSWORD },
      jar: mine,
    });
    assert.equal(r.status, 400, "verify-purpose code must not reset");

    await setOtp(user.id, "555555", "reset");
    r = await call("/api/auth/reset-password", {
      method: "POST",
      body: { email: user.email, otp: "555555", newPassword: NEW_PASSWORD },
      jar: mine,
    });
    assert.equal(r.status, 200);

    assert.equal(
      (await call("/api/auth/refresh", { method: "POST", jar: other })).status,
      401,
    );
    assert.equal(
      (await call("/api/auth/refresh", { method: "POST", jar: mine })).status,
      200,
    );
    r = await call("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: PASSWORD },
    });
    assert.equal(r.status, 401, "old password must stop working");
    user.password = NEW_PASSWORD;
  });

  test("reset rejects a weak new password", async () => {
    await setOtp(user.id, "666666", "reset");
    const r = await call("/api/auth/reset-password", {
      method: "POST",
      body: { email: user.email, otp: "666666", newPassword: "weak" },
    });
    assert.equal(r.status, 400);
  });

  test("a dead session's refresh clears the auth cookies", async () => {
    const jar = await login(user);
    await pool.query(
      "UPDATE refresh_tokens SET revoked = true, created_at = now() - interval '1 hour' WHERE user_id = $1",
      [user.id],
    );
    const r = await call("/api/auth/refresh", { method: "POST", jar });
    assert.equal(r.status, 401);
    // Otherwise /auth and /dashboard redirect into each other.
    assert.equal(jar.c.accessToken, undefined);
    assert.equal(jar.c.refreshToken, undefined);
  });

  test("the losing tab of a refresh race keeps the winner's cookies", async () => {
    const jar = await login(user);
    const stale = jar.c.refreshToken;
    assert.equal(
      (await call("/api/auth/refresh", { method: "POST", jar })).status,
      200,
    );
    const loser = await call("/api/auth/refresh", {
      method: "POST",
      cookie: `refreshToken=${stale}`,
    });
    assert.equal(loser.status, 401);
    assert.equal(loser.res.headers.getSetCookie().length, 0);
  });

  test("logout revokes the refresh token", async () => {
    const jar = await login(user);
    const token = jar.c.refreshToken;
    await call("/api/auth/logout", { method: "POST", jar });
    const r = await call("/api/auth/refresh", {
      method: "POST",
      cookie: `refreshToken=${token}`,
    });
    assert.equal(r.status, 401);
  });

  test("/api/user returns the profile", async () => {
    const jar = await login(user);
    const r = await call("/api/user", { jar });
    assert.equal(r.status, 200);
    assert.equal(r.data.user.email, user.email);
    assert.ok(r.data.user.created_at);
    assert.equal(r.data.user.password_hash, undefined);
  });

  test("/auth?next= sends a logged-in user to safe paths only", async () => {
    const jar = await login(user);
    let r = await call("/auth?next=/extension-auth", {
      redirect: "manual",
      jar,
    });
    assert.match(r.res.headers.get("location") || "", /\/extension-auth$/);
    r = await call("/auth?next=//evil.example", { redirect: "manual", jar });
    assert.match(r.res.headers.get("location") || "", /\/dashboard$/);
  });
});

describe("signup validation", () => {
  const signup = (body) => call("/api/auth/signup", { method: "POST", body });

  test("rejects names over 100 characters", async () => {
    const r = await signup({
      name: "x".repeat(101),
      email: "nobody@example.invalid",
      password: PASSWORD,
    });
    assert.equal(r.status, 400);
  });

  test("enforces password rules", async () => {
    const r = await signup({
      name: "Test",
      email: "nobody2@example.invalid",
      password: "simple",
    });
    assert.equal(r.status, 400);
  });

  test("rejects passwords bcrypt would truncate", async () => {
    const r = await signup({
      name: "Test",
      email: "nobody3@example.invalid",
      password: "Aa1!" + "x".repeat(70),
    });
    assert.equal(r.status, 400);
  });
});

describe("Google sign-in", () => {
  const start = (next = "") =>
    call(`/api/auth/google${next}`, { redirect: "manual" });
  const cookieFrom = (r, name) =>
    r.res.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));

  test("redirect carries a state that matches a cookie", async () => {
    const r = await start();
    const loc = r.res.headers.get("location") || "";
    assert.match(loc, /[?&]state=/);
    assert.ok(cookieFrom(r, "google_oauth_state"));
  });

  test("callback rejects a missing, forged, or cookie-less state", async () => {
    const r = await start();
    const state = new URL(r.res.headers.get("location")).searchParams.get(
      "state",
    );
    const cookie = cookieFrom(r, "google_oauth_state").split(";")[0];
    for (const [query, ck] of [
      ["code=x", cookie],
      ["code=x&state=forged", cookie],
      [`code=x&state=${state}`, undefined],
    ]) {
      const cb = await call(`/api/auth/google/callback?${query}`, {
        redirect: "manual",
        cookie: ck,
      });
      assert.match(
        cb.res.headers.get("location") || "",
        /error=GoogleAuthFailed/,
        query,
      );
    }
  });

  test("remembers an on-site next and ignores an off-site one", async () => {
    let r = await start("?next=/extension-auth");
    assert.match(
      cookieFrom(r, "google_oauth_next") || "",
      /google_oauth_next=(%2F|\/)extension-auth/,
    );
    r = await start("?next=https://evil.example");
    assert.match(
      cookieFrom(r, "google_oauth_next") || "",
      /google_oauth_next=(%2F|\/)dashboard/,
    );
  });
});
