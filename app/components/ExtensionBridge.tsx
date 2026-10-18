"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";

// Pushes the access token to the extension whenever it changes, and tells it
// to disconnect on logout. If the extension isn't installed, nothing listens
// and nothing happens.
export function ExtensionBridge() {
  const { accessToken, loading } = useAuth();
  const hadToken = useRef(false);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = accessToken;

  useEffect(() => {
    if (loading) return;
    if (accessToken) {
      hadToken.current = true;
      window.postMessage(
        { source: "hustlebuddy-web", type: "EXT_AUTH", accessToken },
        window.location.origin,
      );
    } else if (hadToken.current) {
      hadToken.current = false;
      window.postMessage(
        { source: "hustlebuddy-web", type: "EXT_LOGOUT" },
        window.location.origin,
      );
    }
  }, [accessToken, loading]);

  // The extension's relay may finish loading after the token arrived.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      if (
        e.data?.source === "hustlebuddy-extension" &&
        e.data?.type === "EXT_READY" &&
        tokenRef.current
      ) {
        window.postMessage(
          {
            source: "hustlebuddy-web",
            type: "EXT_AUTH",
            accessToken: tokenRef.current,
          },
          window.location.origin,
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
