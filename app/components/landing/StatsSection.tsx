"use client";

import { FadeIn } from "@/app/components/ui/FadeIn";
import { TiltCard } from "@/app/components/ui/TiltCard";
import { CountUp } from "@/app/components/ui/CountUp";

const stats = [
  {
    end: 10,
    suffix: "+",
    decimals: 0,
    label: "Portals you juggle",
    note: "Internshala, Unstop, Wellfound, LinkedIn and more",
  },
  {
    end: 4,
    suffix: "-6 hrs",
    decimals: 0,
    label: "Wasted every week",
    note: "Retyping the same details and tracking applications",
  },
  {
    end: 0,
    suffix: "",
    decimals: 0,
    label: "Applications lost",
    note: "When everything lives in one place",
  },
];

export const StatsSection = () => {
  return (
    <section className="relative py-28 px-6 md:px-12 lg:px-24 max-w-6xl mx-auto border-t border-white/5">
      <div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-start">
        {/* Left Sticky Header Column */}
        <div className="lg:w-5/12 lg:sticky lg:top-32 self-start">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#111] border border-white/10 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400 mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              The Reality
            </div>

            <h2 className="text-4xl md:text-5xl font-medium tracking-[-0.03em] leading-[1.05] mb-6 text-white/90">
              The job hunt is <br className="hidden md:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-[#666]">
                broken.
              </span>
            </h2>

            <p className="text-slate-400 text-base md:text-lg leading-relaxed font-light">
              It&apos;s not just the applying - it&apos;s retyping the same
              details on every portal, losing track of what you sent where, and
              starting from scratch every time.
            </p>
          </FadeIn>
        </div>

        {/* Right Cards Grid Column */}
        <div className="lg:w-7/12 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
            {stats.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.15} className="h-full">
                <TiltCard className="group relative bg-[#0A0A0C] border border-white/10 hover:border-white/20 rounded-2xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] h-full transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="text-4xl lg:text-5xl font-light tracking-[-0.03em] text-white/90 mb-4 font-mono">
                      <CountUp
                        end={stat.end}
                        suffix={stat.suffix}
                        decimals={stat.decimals}
                      />
                    </div>
                    <div className="text-slate-200 text-sm font-medium leading-snug mb-2">
                      {stat.label}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed font-light mt-4">
                    {stat.note}
                  </p>
                </TiltCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
