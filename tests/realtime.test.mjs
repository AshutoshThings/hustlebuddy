import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import jwt from "jsonwebtoken";
import { BASE, call, createUser, deleteUser, login } from "./helpers.mjs";

// Opens the event stream and collects events until `until` matches one or
// the timeout passes. A second server can be given with STREAM_BASE_URL, to
// check that events cross instances.
async function collect(
  cookie,
  until,
  { timeout = 10_000, base = process.env.STREAM_BASE_URL || BASE, onOpen } = {},
) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  const events = [];
  let raw = "";
  try {
    const res = await fetch(base + "/api/applications/stream", {
      headers: { Cookie: cookie },
      signal: ctl.signal,
    });
    assert.equal(res.status, 200);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let opened = false;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      raw += text;
      buf += text;
      let i;
      while ((i = buf.indexOf("\n\n")) !== -1) {
        const block = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (!opened) {
          opened = true;
          await onOpen?.();
        }
        const ev = { event: "message", data: "" };
        for (const line of block.split("\n")) {
          if (line.startsWith("event: ")) ev.event = line.slice(7);
          if (line.startsWith("data: ")) ev.data += line.slice(6);
        }
        if (ev.data) {
          events.push(ev);
          if (until(ev)) return { events, raw, ended: false };
        }
      }
    }
    return { events, raw, ended: true };
  } catch (e) {
    if (e.name === "AbortError")
      return { events, raw, ended: false, timedOut: true };
    throw e;
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

describe("live updates", () => {
  let user, jar;
  before(async () => {
    user = await createUser({ password: "Testpass#2026", tag: "live" });
    jar = await login(user);
  });
  after(() => deleteUser(user?.id));

  test("a new application reaches the user's open stream", async () => {
    const r = await collect(
      jar.header(["accessToken"]),
      (e) => e.event === "message",
      {
        onOpen: () =>
          call("/api/applications", {
            method: "POST",
            jar,
            body: { company: "Live Co", role: "Streamer", status: "applied" },
          }),
      },
    );
    assert.ok(!r.timedOut, "no event arrived");
    const row = JSON.parse(r.events[0].data);
    assert.equal(row.company, "Live Co");
    assert.equal(row.user_id, user.id);
  });

  test("other users' streams don't get it", async () => {
    const other = await createUser({
      password: "Testpass#2026",
      tag: "live-other",
    });
    try {
      const otherJar = await login(other);
      const r = await collect(
        otherJar.header(["accessToken"]),
        (e) => e.event === "message",
        {
          timeout: 3000,
          onOpen: () =>
            call("/api/applications", {
              method: "POST",
              jar,
              body: {
                company: "Private Co",
                role: "Secret",
                status: "applied",
              },
            }),
        },
      );
      assert.equal(r.events.length, 0);
    } finally {
      await deleteUser(other.id);
    }
  });

  test(
    "the stream ends before the access token expires and asks for a refresh",
    {
      skip:
        !process.env.JWT_SECRET &&
        "needs JWT_SECRET to mint a short-lived token",
    },
    async () => {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: 22,
      });
      const started = Date.now();
      const r = await collect(
        `accessToken=${token}`,
        (e) => e.event === "reconnect",
        { timeout: 15_000 },
      );
      assert.ok(!r.timedOut, "stream did not end in time");
      assert.deepEqual(JSON.parse(r.events.at(-1).data), { refresh: true });
      assert.ok(Date.now() - started < 12_000);
      assert.match(r.raw, /^retry: \d+/);
    },
  );
});
