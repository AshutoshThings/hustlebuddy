"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FadeIn } from "@/app/components/ui/FadeIn";
import { HustleBuddyLogo } from "../ui/HustleBuddyLogo";

export const Hero = () => {
  const router = useRouter();

  return (
    <section className="relative h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 overflow-hidden">
      <nav className="absolute top-0 left-0 w-full px-6 md:px-12 lg:px-24 py-8 flex justify-between items-center z-20">
        <div className="text-2xl font-semibold tracking-[-0.05em] text-white/90">
          <span className="flex items-center justify-center group-hover/logo:scale-110 transition-transform duration-300 text-white">
            <HustleBuddyLogo className="w-5 h-5 mr-2" /> HustleBuddy
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="px-5 py-2.5 text-xs font-semibold tracking-wide uppercase border border-white/10 hover:bg-white/5 rounded-full transition-all text-white/80"
        >
          Sign In
        </button>
      </nav>

      <div className="z-10 max-w-6xl mt-12">
        <FadeIn delay={0.2}>
          <h1 className="text-[4rem] md:text-[7vw] font-medium tracking-[-0.04em] leading-[0.9] mb-8 text-white/90">
            Stop copying the
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-[#555]">
              same information.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.5}>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl leading-relaxed font-light">
            You know the drill - opening Internshala, Unstop, Wellfound,
            LinkedIn… copy-pasting the same stuff 20 times a day, filling the
            same forms again and again. HustleBuddy keeps every application
            organized in one dashboard today - and soon, an extension will fill
            the repetitive fields for you.
          </p>
        </FadeIn>

        <FadeIn>
          <div className="inline-flex items-center gap-3 px-4 mt-4 py-1.5 bg-[#111] border border-white/10 rounded-full text-[11px] font-mono tracking-[0.2em] uppercase mb-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-slate-400">
            One profile. Extension pre-fills for you.
          </div>
        </FadeIn>

        <FadeIn delay={0.8}>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 px-8 py-4 bg-white text-black text-lg font-medium rounded-full hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 shadow-[inset_0_-3px_10px_rgba(0,0,0,0.15),0_10px_30px_rgba(255,255,255,0.1)]"
          >
            Open my dashboard
            <span className="text-xl opacity-50 relative top-[1px]">→</span>
          </button>
        </FadeIn>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center text-[10px] tracking-[0.2em] font-medium text-slate-600 opacity-60">
        <div>SCROLL TO EXPLORE</div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-lg mt-2 font-light"
        >
          ↓
        </motion.div>
      </div>
    </section>
  );
};
