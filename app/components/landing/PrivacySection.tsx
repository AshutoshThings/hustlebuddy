"use client";

import Link from "next/link";
import { Reveal } from "@/app/components/ui/Reveal";

// Keep in step with /privacy (app/privacy/page.tsx).
const policies = [
  {
    title: "The extension only runs on job sites",
    desc: "It runs on LinkedIn, Unstop, Internshala and Naukri job pages and on HustleBuddy. It doesn’t read the rest of your browsing.",
  },
  {
    title: "Your applications are private to you",
    desc: "Only your account can see your applications and notes. Resumes are kept in private storage and opened through links that expire after an hour.",
  },
  {
    title: "We don’t sell data or show ads",
    desc: "Nothing you add is shared with recruiters or anyone else.",
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
              with them. The full version is in our{" "}
              <Link
                href="/privacy"
                className="text-white/80 underline underline-offset-4 decoration-white/20 hover:decoration-white/60"
              >
                Privacy Policy
              </Link>
              .
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
