"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AuthSuccessPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // When landing here, cookies are already set by the server.
    // We can fetch a quick session check or directly transition to dashboard
    // since the accessToken cookie and refreshToken cookie are present.
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center text-slate-400 text-sm">
      Authenticating with Google...
    </div>
  );
}
