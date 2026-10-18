"use client";

import { Reveal } from "@/app/components/ui/Reveal";
import { StatusLabel } from "../ui/StatusLabel";
import { HustleBuddyLogo } from "../ui/HustleBuddyLogo";

const card =
  "h-[380px] bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group";

export const FeaturesSection = () => {
  return (
    <section className="py-32 px-6 md:px-12 lg:px-24 max-w-6xl mx-auto">
      <Reveal>
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white/90 mb-4">
            What’s in the dashboard
          </h2>
          <p className="text-slate-400 text-lg">
            Everything here works today unless it says otherwise. Screens below
            use sample data.
          </p>
        </div>
      </Reveal>

      {/* The col-span lives on a plain wrapper so Reveal can't break the grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Kanban */}
        <div className="md:col-span-2">
          <Reveal>
            <div className={card}>
              <div className="flex items-start justify-between z-10">
                <h3 className="text-xl font-medium text-white">
                  Track every application
                </h3>
                <StatusLabel status="live" />
              </div>
              <p className="text-slate-400 text-sm max-w-sm mt-2 z-10">
                Drag applications from Applied to Interviewing to Offer, and see
                your whole pipeline without digging through tabs.
              </p>
              <div className="absolute -bottom-12 -right-4 w-[110%] h-[240px] bg-[#111] border border-white/5 rounded-t-xl flex gap-3 p-4 shadow-2xl rotate-2 group-hover:-translate-y-2 transition-transform duration-500">
                {[
                  {
                    name: "Applied",
                    items: [
                      ["Razorpay", "Backend Intern · Internshala"],
                      ["Zepto", "Frontend Intern · LinkedIn"],
                    ],
                  },
                  {
                    name: "Interviewing",
                    items: [["Google", "SDE Intern · LinkedIn"]],
                  },
                  { name: "Offer", items: [] as string[][] },
                ].map((col) => (
                  <div
                    key={col.name}
                    className="flex-1 bg-black/40 border border-white/5 rounded-lg p-3"
                  >
                    <div className="flex justify-between text-[11px] text-slate-500 mb-3">
                      <span>{col.name}</span>
                      <span>{col.items.length}</span>
                    </div>
                    {col.items.map(([co, role]) => (
                      <div
                        key={co}
                        className="bg-white/5 rounded border border-white/5 px-2.5 py-2 mb-2"
                      >
                        <div className="text-[11px] text-white/80">{co}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {role}
                        </div>
                      </div>
                    ))}
                    {col.items.length === 0 && (
                      <div className="h-12 rounded border border-dashed border-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Extension */}
        <div>
          <Reveal>
            <div className={card}>
              <div className="flex items-start justify-between z-10">
                <h3 className="text-xl font-medium text-white">
                  Autofill extension
                </h3>
              </div>
              <StatusLabel status="testing" className="mt-2 z-10" />
              <p className="text-slate-400 text-sm mt-3 z-10">
                Fills application forms from your profile. Planned for Chrome
                and Edge.
              </p>
              <div className="absolute -bottom-6 right-6 w-52 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col group-hover:scale-105 transition-transform duration-500">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
                  <div className="w-6 h-6 bg-black border border-white/10 rounded-md flex items-center justify-center p-1">
                    <HustleBuddyLogo className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-xs font-medium text-white">
                    HustleBuddy
                  </div>
                </div>
                {[
                  ["Name", "Ashutosh Vishwakarma"],
                  ["Email", "ashutoshvish2024@gmail.com"],
                  ["College", "JIIT Noida"],
                ].map(([k, v]) => (
                  <div key={k} className="mb-2">
                    <div className="text-[10px] text-slate-500">{k}</div>
                    <div className="text-[11px] text-white/80 bg-white/5 rounded px-2 py-1 truncate">
                      {v}
                    </div>
                  </div>
                ))}
                <div className="mt-2 h-8 bg-white rounded flex items-center justify-center text-xs font-medium text-black">
                  Save to HustleBuddy
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Insights */}
        <div>
          <Reveal>
            <div className={card}>
              <div className="flex items-start justify-between z-10">
                <h3 className="text-xl font-medium text-white">
                  See what gets replies
                </h3>
              </div>
              <StatusLabel status="live" className="mt-2 z-10" />
              <p className="text-slate-400 text-sm mt-3 z-10">
                Compare portals by how many applications turned into a response.
              </p>
              <div className="absolute bottom-6 left-8 right-8">
                <div className="h-28 flex items-end gap-3 group-hover:opacity-80 transition-opacity">
                  {[
                    ["Internshala", 40],
                    ["Unstop", 70],
                    ["LinkedIn", 45],
                    ["Wellfound", 90],
                  ].map(([name, h]) => (
                    <div
                      key={name}
                      className="flex-1 flex flex-col justify-end h-full"
                    >
                      <div
                        className="bg-gradient-to-t from-white/5 to-white/40 border-t border-white/20 rounded-t-sm"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                  {["Internshala", "Unstop", "LinkedIn", "Wellfound"].map(
                    (n) => (
                      <span key={n} className="flex-1 truncate">
                        {n}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Deadlines */}
        <div className="md:col-span-2">
          <Reveal>
            <div className={`${card} justify-center`}>
              <div className="flex items-start justify-between z-10">
                <h3 className="text-xl font-medium text-white">
                  Keep test and interview dates with the application
                </h3>
                <StatusLabel status="live" className="shrink-0 ml-4" />
              </div>
              <p className="text-slate-400 text-sm max-w-md mt-2 mb-6 z-10">
                Log online-assessment deadlines and interview slots on the
                application itself, so you can find the link when you need it.
              </p>
              <div className="space-y-2 max-w-md z-10">
                {[
                  ["Flipkart", "Online assessment", "Fri, 11:59 PM"],
                  ["Google", "Interview round 1", "Mon, 3:00 PM"],
                ].map(([co, what, when]) => (
                  <div
                    key={co}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3"
                  >
                    <div>
                      <div className="text-sm text-white/90">{co}</div>
                      <div className="text-xs text-slate-500">{what}</div>
                    </div>
                    <div className="text-xs text-slate-300">{when}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
