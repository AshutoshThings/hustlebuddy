"use client";

import { useRouter } from "next/navigation";
import { FadeIn } from "@/app/components/ui/FadeIn";
import { HustleBuddyLogo } from "../ui/HustleBuddyLogo";
import { StatusLabel } from "../ui/StatusLabel";

export const Hero = () => {
  const router = useRouter();

  const handleOpenDashboard = async () => {
    try {
      const res = await fetch("/api/auth/session", { method: "GET" });
      router.push(res.ok ? "/dashboard" : "/auth");
    } catch {
      router.push("/auth");
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 pt-32 pb-20 overflow-hidden">
      <nav className="absolute top-0 left-0 w-full px-6 md:px-12 lg:px-24 py-8 flex justify-between items-center z-20">
        <div className="flex items-center text-xl font-semibold tracking-[-0.03em] text-white/90">
          <HustleBuddyLogo className="w-5 h-5 mr-2" />
          HustleBuddy
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#roadmap"
            className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors"
          >
            Roadmap
          </a>
          <a
            href="#faq"
            className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors"
          >
            FAQ
          </a>
          <button
            onClick={() => router.push("/auth")}
            className="px-5 py-2 text-sm font-medium border border-white/10 hover:bg-white/5 rounded-full transition-colors text-white/80"
          >
            Sign in
          </button>
        </div>
      </nav>

      <div className="z-10 max-w-6xl">
        <FadeIn delay={0.2}>
          <h1 className="text-[3.5rem] md:text-[7vw] font-medium tracking-[-0.04em] leading-[0.95] mb-8 text-white/90">
            Stop copying the
            <br />
            same information.
          </h1>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Internshala, Unstop, Wellfound, LinkedIn: every one asks for the
            same details again. Keep all your applications in one dashboard
            today. The browser extension and Gmail tracking are what we’re
            building next.
          </p>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button
              onClick={handleOpenDashboard}
              className="px-7 py-3.5 bg-white text-black text-base font-medium rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[inset_0_-3px_10px_rgba(0,0,0,0.15),0_10px_30px_rgba(255,255,255,0.1)]"
            >
              Open my dashboard
            </button>
            <a
              href="#roadmap"
              className="text-sm text-slate-400 hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white/60 transition-colors"
            >
              See what’s coming
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.8}>
          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <StatusLabel status="live" label="Dashboard" />
            </span>
            <StatusLabel status="testing" label="Extension" />
            <StatusLabel status="soon" label="Gmail sync" />
            <StatusLabel status="research" label="Auto-submit" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
