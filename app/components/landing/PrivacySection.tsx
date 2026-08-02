"use client";

import { Reveal } from "@/app/components/ui/Reveal";

export const PrivacySection = () => {
  const policies = [
    {
      title: "Local-First Extension",
      desc: "The extension only works on job sites. It doesn’t peek at the rest of your browsing history.",
      icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    },
    {
      title: "Encrypted Storage",
      desc: "Your phone number, email, and resume links stay locked. We can’t use them, and we never will.",
      icon: <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />,
    },
    {
      title: "No Spam, No Selling",
      desc: "This is a tool for you, not an ad platform. We don’t sell your data to recruiters or anyone else.",
      icon: <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />,
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/5 bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-white mb-4">
              Built on trust.
            </h2>
            <p className="text-slate-500 text-lg max-w-xl font-light">
              Job applications need personal details. We treat that data the
              same way we’d want ours treated.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {policies.map((policy, i) => (
            <Reveal key={policy.title} delay={0.1 * i}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {policy.icon}
                    {i === 1 && <path d="M7 11V7a5 5 0 0 1 10 0v4" />}
                    {i === 2 && <circle cx="12" cy="12" r="3" />}
                  </svg>
                </div>
                <h4 className="text-white font-medium mb-3">{policy.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-light">
                  {policy.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
