"use client";

import { useRouter } from "next/navigation";
import { Reveal } from "@/app/components/ui/Reveal";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { MouseEvent } from "react";
import { HustleBuddyLogo } from "../ui/HustleBuddyLogo";

export const CTAFooterSection = () => {
  const router = useRouter();

  // Motion values to track the cursor's X and Y coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <footer
      onMouseMove={handleMouseMove}
      className="relative border-t border-white/5 bg-[#050505] overflow-hidden group"
    >
      {/* 1. Cursor-following soft silver spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.03),
              transparent 80%
            )
          `,
        }}
      />

      {/* 2. Interactive Dot Grid (Only visible where the cursor shines) */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage: useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent 80%)`,
          WebkitMaskImage: useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent 80%)`,
        }}
      />

      {/* Huge CTA Content */}
      <div className="py-32 px-6 md:px-12 lg:px-24 text-center max-w-4xl mx-auto relative z-10">
        <Reveal>
          <h2 className="text-5xl md:text-7xl font-medium tracking-tight text-white mb-6">
            Stop retyping.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500">
              Start tracking.
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-light">
            Join the students and developers who are organizing their job hunt
            in one unified workspace.
          </p>

          {/* 3. Interactive Shimmer Button */}
          <div className="relative inline-block group/btn">
            {/* Outer blur glow that activates on hover */}
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />

            <button
              onClick={() => router.push("/login")}
              className="relative overflow-hidden px-8 py-4 bg-white text-black text-lg font-medium rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              <span className="relative z-10">Get started for free</span>

              {/* Metallic sweeping highlight on hover */}
              <motion.div
                className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-black/10 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
              />
            </button>
          </div>
        </Reveal>
      </div>

      {/* Standard Links Footer */}
      <div className="border-t border-white/5 px-6 md:px-12 lg:px-24 py-8 flex flex-col md:flex-row items-center justify-between gap-4 z-10 relative bg-[#050505]">
        {/* Interactive Logo */}
        <div className="flex items-center gap-2 text-white font-semibold tracking-tight group/logo cursor-pointer">
          <div className="flex items-center justify-center group-hover/logo:scale-110 transition-transform duration-300 text-white">
            <HustleBuddyLogo className="w-5 h-5" />
          </div>
          <span className="group-hover/logo:text-slate-300 transition-colors duration-300">
            HustleBuddy
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
          <a href="#" className="hover:text-white transition-colors">
            Twitter
          </a>
          <a href="#" className="hover:text-white transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
};
