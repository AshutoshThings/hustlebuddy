import { Client } from "pg";
import pool, { sslConfig } from "./db";

// Live updates for open dashboards, across any number of server instances.
//
// Writers call publish(), which sends a Postgres NOTIFY. Every instance that
// has open streams keeps one LISTEN connection, and passes events on to the
// streams of the user they belong to. An instance with no open streams holds
// no connection.
//
// LISTEN needs a session-level connection. Supabase's transaction pooler
// (port 6543) can't hold one, so DATABASE_LISTEN_URL can name a direct or
// session-pooler URL; for a Supabase pooler URL on 6543 the session pooler
// (same host, port 5432) is used automatically.

const CHANNEL = "hb_events";

export type AppEvent = { type: "application_created"; application: unknown };
type Send = (event: AppEvent) => void;

type State = {
  subscribers: Map<number, Set<Send>>;
  listener: Client | null;
  connecting: Promise<void> | null;
  retry: ReturnType<typeof setTimeout> | null;
  failures: number;
};

// Kept on globalThis so dev hot reloads, which can load this module twice,
// share one listener.
const g = globalThis as typeof globalThis & { __hbRealtime?: State };
const state = (g.__hbRealtime ??= {
  subscribers: new Map(),
  listener: null,
  connecting: null,
  retry: null,
  failures: 0,
});

function listenUrl(): string | undefined {
  if (process.env.DATABASE_LISTEN_URL) return process.env.DATABASE_LISTEN_URL;
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "6543") {
      u.port = "5432";
      return u.toString();
    }
  } catch {}
  return url;
}

function subscriberCount() {
  let n = 0;
  for (const set of state.subscribers.values()) n += set.size;
  return n;
}

async function deliver(payload: string) {
  let msg: { u: number; id: number };
  try {
    msg = JSON.parse(payload);
  } catch {
    return;
  }
  const targets = state.subscribers.get(msg.u);
  if (!targets?.size) return;
  // The notification only carries ids (NOTIFY payloads are capped at 8 KB);
  // the row is read here, and only by an instance that has a viewer for it.
  const { rows } = await pool.query(
    "SELECT * FROM applications WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
    [msg.id, msg.u],
  );
  if (!rows[0]) return;
  for (const send of targets)
    send({ type: "application_created", application: rows[0] });
}

function scheduleReconnect() {
  if (state.retry || subscriberCount() === 0) return;
  const delay = Math.min(30_000, 1000 * 2 ** state.failures++);
  state.retry = setTimeout(() => {
    state.retry = null;
    void ensureListener();
  }, delay);
}

async function ensureListener() {
  if (state.listener || state.connecting || subscriberCount() === 0) return;
  state.connecting = (async () => {
    const client = new Client({
      connectionString: listenUrl(),
      ssl: sslConfig(),
    });
    client.on("notification", (n) => {
      if (n.channel === CHANNEL && n.payload) {
        deliver(n.payload).catch((e) =>
          console.error("realtime: deliver failed", e),
        );
      }
    });
    const drop = (e?: unknown) => {
      if (state.listener !== client) return;
      if (e) console.error("realtime: listener connection lost", e);
      state.listener = null;
      client.end().catch(() => {});
      scheduleReconnect();
    };
    client.on("error", drop);
    client.on("end", () => drop());
    try {
      await client.connect();
      await client.query(`LISTEN ${CHANNEL}`);
      state.listener = client;
      state.failures = 0;
      // Everyone may have left while we were connecting.
      if (subscriberCount() === 0) stopListener();
    } catch (e) {
      console.error("realtime: could not start listener", e);
      client.end().catch(() => {});
      scheduleReconnect();
    }
  })().finally(() => {
    state.connecting = null;
  });
  await state.connecting;
}

function stopListener() {
  if (state.retry) clearTimeout(state.retry);
  state.retry = null;
  const client = state.listener;
  state.listener = null;
  client?.end().catch(() => {});
}

export function subscribe(userId: number, send: Send): () => void {
  let set = state.subscribers.get(userId);
  if (!set) state.subscribers.set(userId, (set = new Set<Send>()));
  set.add(send);
  void ensureListener();
  return () => {
    set.delete(send);
    if (set.size === 0) state.subscribers.delete(userId);
    if (subscriberCount() === 0) stopListener();
  };
}

// Resolves once this instance is listening (or after the timeout), so a
// stream can wait before telling the browser it is live. Otherwise anything
// saved while LISTEN is still connecting would be missed.
export async function whenListening(timeoutMs = 5000): Promise<boolean> {
  if (state.listener) return true;
  if (state.connecting) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      state.connecting,
      new Promise((resolve) => (timer = setTimeout(resolve, timeoutMs))),
    ]);
    clearTimeout(timer);
  }
  return Boolean(state.listener);
}

export async function publishApplicationCreated(
  userId: number,
  applicationId: number,
) {
  try {
    await pool.query("SELECT pg_notify($1, $2)", [
      CHANNEL,
      JSON.stringify({ u: userId, id: applicationId }),
    ]);
  } catch (e) {
    // Live updates are best effort: the dashboard resyncs when it reconnects.
    console.error("realtime: publish failed", e);
  }
}
