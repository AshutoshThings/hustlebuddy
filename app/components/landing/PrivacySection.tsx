"use client";

import { Reveal } from "@/app/components/ui/Reveal";

// DRAFT COPY: check every line against what the product actually does
// before shipping, especially the Gmail line.
const policies = [
  {
    title: "The extension only runs on job sites",
    desc: "It doesn’t read the rest of your browsing.",
  },
  {
    title: "Your details are used to fill your applications",
    desc: "Phone number, email and resume links are stored encrypted and used for nothing else.",
  },
  {
    title: "We don’t sell data or show ads",
    desc: "Your profile isn’t shared with recruiters or anyone else.",
  },
  {
    title: "Gmail access will be opt-in",
    desc: "When Gmail sync ships, you’ll choose whether to connect it, and you can disconnect at any time.",
  },
];

export const PrivacySection = () => {
  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/5 bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="mb-14 max-w-xl">
            <h2 className="text-3xl font-medium tracking-tight text-white mb-4">
              What happens to your data
            </h2>
            <p className="text-slate-400 text-lg">
              Applications need personal details, so here is plainly what we do
              with them.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {policies.map((p) => (
              <div key={p.title} className="border-t border-white/10 pt-5">
                <dt className="text-white font-medium mb-2">{p.title}</dt>
                <dd className="text-slate-400 text-sm leading-relaxed">
                  {p.desc}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
};
