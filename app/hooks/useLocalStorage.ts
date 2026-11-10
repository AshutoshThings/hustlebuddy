"use client";

import { useCallback, useSyncExternalStore } from "react";

// Same-tab writes don't fire the "storage" event, so announce them ourselves.
const LOCAL_EVENT = "hb-local-storage";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode, policies)
  }
}

// A localStorage entry as React state. Renders null on the server and during
// hydration, then the stored value, so server and client HTML match.
// Pass null to remove the entry.
export function useLocalStorage(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const setValue = useCallback(
    (next: string | null) => {
      try {
        if (next === null) localStorage.removeItem(key);
        else localStorage.setItem(key, next);
      } catch {}
      window.dispatchEvent(new Event(LOCAL_EVENT));
    },
    [key],
  );

  return [value, setValue] as const;
}
