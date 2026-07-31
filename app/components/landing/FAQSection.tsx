"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reveal } from "@/app/components/ui/Reveal";

export const FAQSection = () => {
  const faqs = [
    {
      q: "Which job portals are supported by the extension?",
      a: "The extension is currently being optimized for Internshala, Unstop, Wellfound, and LinkedIn. However, the manual dashboard can track applications from absolutely anywhere.",
    },
    {
      q: "Is HustleBuddy free?",
      a: "Yes! Tracking your applications and using the core dashboard is entirely free for students and freshers.",
    },
    {
      q: "Do I need the extension to use the dashboard?",
      a: "Not at all. You can manually log applications into your dashboard today. The extension is simply an upcoming feature to automate the filling process.",
    },
    {
      q: "How does the auto-fill actually work?",
      a: "You fill out your 'Master Profile' once in HustleBuddy. When you open a supported job portal, our extension maps your master data to the form fields and injects it with one click.",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-32 px-6 md:px-12 lg:px-24 max-w-3xl mx-auto">
      <Reveal>
        <h2 className="text-3xl font-medium tracking-tight text-white mb-10 text-center">
          Frequently Asked Questions
        </h2>
      </Reveal>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div
              className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${openIdx === i ? "border-white/20 bg-[#0A0A0C]" : "border-white/5 bg-transparent hover:bg-[#0A0A0C]"}`}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
              >
                <span className="text-white/90 font-medium text-sm md:text-base">
                  {faq.q}
                </span>
                <span
                  className={`text-slate-500 transition-transform duration-300 ${openIdx === i ? "rotate-180" : ""}`}
                >
                  ↓
                </span>
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-slate-400 font-light text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
