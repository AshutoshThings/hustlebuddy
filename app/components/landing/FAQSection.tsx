"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reveal } from "@/app/components/ui/Reveal";

const faqs = [
  {
    q: "Do I need the extension to use the dashboard?",
    a: "No. The dashboard works on its own and you can add applications by hand. The extension saves you the typing on job sites.",
  },
  {
    q: "Which portals does the extension work with?",
    a: "LinkedIn, Unstop, Internshala and Naukri. It notices when you submit an application there and asks before adding it. On any other site, open the extension to save the job, or add it on the dashboard.",
  },
  {
    q: "How do I install the extension?",
    a: "Download it from the link at the bottom of this page, unzip it, open chrome://extensions, turn on Developer mode and choose Load unpacked. A Chrome Web Store listing is on the way.",
  },
  {
    q: "How will autofill work?",
    a: "It isn’t available yet. You’ll fill in your profile once; on a supported site, the extension will match your details to the form fields and fill them when you click. You check the form and submit it yourself.",
  },
  {
    q: "What will Gmail sync do?",
    a: "You’ll be able to connect Gmail so confirmation and reply emails update the status of the matching application. It isn’t available yet.",
  },
  {
    q: "Will HustleBuddy submit applications for me?",
    a: "That’s on the roadmap, but we’re still researching it. For now, nothing is submitted unless you submit it.",
  },
  {
    q: "Is HustleBuddy free?",
    a: "Yes. Tracking applications and using the dashboard is free for students and freshers.",
  },
];

export const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-32 px-6 md:px-12 lg:px-24 max-w-3xl mx-auto"
    >
      <h2 className="text-3xl font-medium tracking-tight text-white mb-10">
        Questions
      </h2>
      <Reveal>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {faqs.map((faq, i) => {
            const open = openIdx === i;
            return (
              <div key={faq.q}>
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="w-full text-left py-5 flex items-center justify-between gap-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
                >
                  <span className="text-white/90 font-medium text-sm md:text-base">
                    {faq.q}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-slate-500 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-10 text-slate-400 text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
};
