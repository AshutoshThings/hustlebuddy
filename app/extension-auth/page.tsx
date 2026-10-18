"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type Status = "checking" | "linking" | "linked" | "no-extension";

const MESSAGES: Record<Status, string> = {
  checking: "Checking your session…",
  linking: "Linking the extension…",
  linked: "Connected. This tab will close in a moment.",
  "no-extension":
    "Couldn't reach the HustleBuddy extension. Make sure it's installed and enabled, then reload this page.",
};

export default function ExtensionAuthPage() {
  const router = useRouter();
  const { accessToken, loading } = useAuth();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.replace("/auth?next=/extension-auth");
      return;
    }

    setStatus("linking");
    let acked = false;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin)
        return;
      if (
        event.data?.source === "hustlebuddy-extension" &&
        event.data?.type === "EXT_ACK"
      ) {
        acked = true;
        setStatus("linked");
      }
    };
    window.addEventListener("message", onMessage);

    // Re-post until the extension acknowledges, so it doesn't matter whether
    // the content script finished loading before the token became available.
    const send = () =>
      window.postMessage(
        { source: "hustlebuddy-web", type: "EXT_AUTH", accessToken },
        window.location.origin,
      );
    send();
    const interval = setInterval(() => {
      if (!acked) send();
    }, 500);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!acked) setStatus("no-extension");
    }, 10000);

    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [loading, accessToken, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-slate-300 px-6">
      <p className="max-w-sm text-center text-sm">{MESSAGES[status]}</p>
    </main>
  );
}
