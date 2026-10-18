"use client";

import { Reveal } from "@/app/components/ui/Reveal";
import { StatusLabel, Status } from "../ui/StatusLabel";

const items: { title: string; status: Status; description: string }[] = [
  {
    title: "Application tracker",
    status: "live",
    description:
      "One dashboard for applications from LinkedIn, Unstop, Internshala and any other site. Add them by hand, move them through stages, log deadlines.",
  },
  {
    title: "Browser extension",
    status: "testing",
    description:
      "Fills application forms from your profile and adds the application to your dashboard when you submit. Chrome and Edge first.",
  },
  {
    title: "Gmail status sync",
    status: "soon",
    description:
      "Reads confirmation and reply emails and updates the matching application, so you stop moving cards by hand.",
  },
  {
    title: "Auto-submit",
    status: "research",
    description:
      "Submits repetitive applications for you on supported portals. Still being researched, and it won’t ship until we’re sure it’s reliable.",
  },
];

export const RoadmapSection = () => {
  return (
    <section
      id="roadmap"
      className="py-28 px-6 md:px-12 lg:px-24 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
        <div className="lg:w-5/12">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white/90 mb-5">
              What’s live, and what’s next
            </h2>
            <p className="text-slate-400 text-base md:text-lg max-w-md">
              There are no dates yet. This is the order we’re working in.
            </p>
          </Reveal>
        </div>

        <div className="lg:w-7/12">
          <Reveal delay={0.1}>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {items.map((item) => (
                <li key={item.title} className="py-7">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-lg font-medium text-white/90">
                      {item.title}
                    </h3>
                    <StatusLabel status={item.status} className="shrink-0" />
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
