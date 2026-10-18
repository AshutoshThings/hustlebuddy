"use client";

import { FadeIn } from "@/app/components/ui/FadeIn";

// Kept the export name so existing imports don't break.
const problems = [
  {
    title: "The same details, again and again",
    body: "Name, college, CGPA, resume, portfolio link. Every portal wants them typed in fresh.",
  },
  {
    title: "No record of where you applied",
    body: "A few weeks in, you can’t say which role went to which portal, or whether you ever heard back.",
  },
  {
    title: "Test links and interview slots get buried",
    body: "They’re in an email or a chat somewhere, and you find them after they’ve expired.",
  },
];

export const StatsSection = () => {
  return (
    <section className="relative py-28 px-6 md:px-12 lg:px-24 max-w-6xl mx-auto border-t border-white/5">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
        <div className="lg:w-5/12 lg:sticky lg:top-32 self-start">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-medium tracking-[-0.03em] leading-[1.05] mb-6 text-white/90">
              Applying shouldn’t be a second job.
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-md">
              The hard part of an internship search isn’t one application. It’s
              the fiftieth, when you’re retyping everything and can’t remember
              what you’ve already sent.
            </p>
          </FadeIn>
        </div>

        <div className="lg:w-7/12 w-full">
          <FadeIn delay={0.15}>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {problems.map((p) => (
                <li key={p.title} className="py-7">
                  <h3 className="text-white/90 font-medium mb-2">{p.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                    {p.body}
                  </p>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
