"use client";

import { Reveal } from "@/app/components/ui/Reveal";

export const FeaturesSection = () => {
  return (
    <section className="py-32 px-6 md:px-12 lg:px-24 max-w-6xl mx-auto">
      <Reveal>
        <div className="flex flex-col items-center text-center mb-16">
          <div className="px-3 py-1 bg-[#111] border border-white/10 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase text-slate-300 mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            The Workspace
          </div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white/90 mb-4">
            Everything you actually need. <br />
            <span className="text-slate-500">Nothing extra.</span>
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Kanban Board Feature (Spans 2 columns) */}
        <Reveal delay={0.1}>
          <div className="md:col-span-2 bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 h-[360px] flex flex-col relative overflow-hidden group">
            <h3 className="text-xl font-medium text-white mb-2 z-10">
              Kanban Tracking
            </h3>
            <p className="text-slate-500 text-sm max-w-sm z-10">
              Move applications from Applied → Interviewing → Offer. See your
              whole pipeline in one place instead of digging through tabs and
              notes.
            </p>
            {/* Mock UI */}
            <div className="absolute -bottom-12 -right-4 w-[110%] h-[240px] bg-[#111] border border-white/5 rounded-t-xl flex gap-3 p-4 shadow-2xl rotate-2 group-hover:-translate-y-2 transition-transform duration-500">
              {["Applied", "Interviewing", "Offered"].map((col, i) => (
                <div
                  key={col}
                  className="flex-1 bg-black/40 border border-white/5 rounded-lg p-3"
                >
                  <div className="text-[10px] uppercase font-mono text-slate-500 mb-3">
                    {col}
                  </div>
                  <div className="h-16 bg-white/5 rounded border border-white/5 mb-2" />
                  {i === 0 && (
                    <div className="h-16 bg-white/5 rounded border border-white/5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Browser Extension Feature */}
        <Reveal delay={0.2}>
          <div className="bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 h-[360px] flex flex-col relative overflow-hidden group">
            <h3 className="text-xl font-medium text-white mb-2 z-10">
              The Extension
            </h3>
            <p className="text-slate-500 text-sm z-10">
              Fills the boring, repetitive fields for you. Coming soon for
              Chrome and Edge.
            </p>
            {/* Mock UI */}
            <div className="absolute -bottom-8 right-8 w-48 h-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col group-hover:scale-105 transition-transform duration-500">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
                <div className="w-6 h-6 bg-white rounded text-[10px] font-bold flex items-center justify-center text-black">
                  H
                </div>
                <div className="text-xs font-medium text-white">
                  HustleBuddy
                </div>
              </div>
              <div className="h-6 bg-white/5 rounded w-full mb-2" />
              <div className="h-6 bg-white/5 rounded w-3/4 mb-4" />
              <div className="mt-auto h-8 bg-white rounded flex items-center justify-center text-[10px] font-bold text-black uppercase tracking-wider">
                Auto-fill
              </div>
            </div>
          </div>
        </Reveal>

        {/* Analytics Feature */}
        <Reveal delay={0.3}>
          <div className="bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 h-[360px] flex flex-col relative overflow-hidden group">
            <h3 className="text-xl font-medium text-white mb-2 z-10">
              Insights
            </h3>
            <p className="text-slate-500 text-sm z-10">
              See which portals actually give you replies and which ones just
              waste your time.
            </p>
            {/* Mock UI */}
            <div className="absolute -bottom-6 left-8 right-8 h-32 flex items-end gap-2 group-hover:opacity-80 transition-opacity">
              {[40, 70, 45, 90, 65, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-white/5 to-white/40 border-t border-white/20 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* Deadline Reminders */}
        <Reveal delay={0.4}>
          <div className="md:col-span-2 bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 h-[360px] flex flex-col justify-center items-start relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-xl font-medium text-white mb-2 z-10">
              Don’t miss another test link
            </h3>
            <p className="text-slate-500 text-sm max-w-sm z-10 mb-6">
              Log OA deadlines and interview slots so you don’t wake up to an
              expired link.
            </p>
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-xs font-mono z-10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Flipkart OA due in 12 hours
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
