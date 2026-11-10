"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/app/lib/safeNext";

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<Message />}>
      <Redirect />
    </Suspense>
  );
}

// Cookies are already set by the Google callback; just move on.
function Redirect() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  useEffect(() => {
    router.replace(next);
  }, [router, next]);

  return <Message />;
}

function Message() {
  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center text-slate-400 text-sm">
      Authenticating with Google...
    </div>
  );
}
