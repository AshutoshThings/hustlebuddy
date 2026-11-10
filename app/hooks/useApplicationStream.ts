"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { refreshSession } from "@/app/lib/refreshSession";

type Handlers = {
  // An application was created (on another device, or by the extension).
  onApplication: (row: Record<string, unknown>) => void;
  // The stream came back after a gap: events may have been missed, reload.
  onResync: () => void;
};

const MAX_BACKOFF_MS = 30_000;

// Keeps one live-update stream open while signed in. The server ends each
// stream after a few minutes (or just before the access token expires) with
// a "reconnect" event; dropped connections are retried with backoff,
// refreshing the session first since an expired token is the usual cause.
export function useApplicationStream(enabled: boolean, handlers: Handlers) {
  const { login } = useAuth();
  const latest = useRef({ handlers, login });
  useEffect(() => {
    latest.current = { handlers, login };
  });

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let failures = 0;
    let connectedBefore = false;

    const refresh = async () => {
      const token = await refreshSession();
      if (token) latest.current.login(token);
      return Boolean(token);
    };

    const connect = () => {
      if (stopped) return;
      source = new EventSource("/api/applications/stream");

      source.onopen = () => {
        failures = 0;
        if (connectedBefore) latest.current.handlers.onResync();
        connectedBefore = true;
      };

      source.onmessage = (event) => {
        try {
          latest.current.handlers.onApplication(JSON.parse(event.data));
        } catch (err) {
          console.error("Bad live-update event", err);
        }
      };

      source.addEventListener("reconnect", async (event) => {
        source?.close();
        let needsRefresh = false;
        try {
          needsRefresh = JSON.parse((event as MessageEvent).data).refresh;
        } catch {}
        if (needsRefresh && !(await refresh())) return;
        connect();
      });

      source.onerror = () => {
        // Take over from EventSource's own retry: it can't refresh the token.
        source?.close();
        const delay =
          Math.min(MAX_BACKOFF_MS, 1000 * 2 ** failures++) *
          (0.75 + Math.random() / 2);
        timer = setTimeout(async () => {
          timer = null;
          if (stopped) return;
          if (!(await refresh())) return; // signed out: stop
          connect();
        }, delay);
      };
    };

    // Coming back to the tab or online: don't wait out a long backoff.
    const wake = () => {
      if (document.visibilityState !== "visible" || !timer) return;
      clearTimeout(timer);
      timer = null;
      failures = 0;
      refresh().then((ok) => ok && connect());
    };

    connect();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);

    return () => {
      stopped = true;
      source?.close();
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [enabled]);
}
