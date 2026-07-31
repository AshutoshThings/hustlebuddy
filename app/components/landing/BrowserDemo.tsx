"use client";

import {
  motion,
  AnimatePresence,
  Variants,
  useInView,
  useScroll,
  useTransform,
} from "motion/react";
import { useMemo, useState, useEffect, useRef } from "react";
import { TiltCard } from "@/app/components/ui/TiltCard";

const pages = [
  {
    id: "basic",
    label: "Basic Details",
    fields: [
      { label: "First Name", value: "Aayush", half: true, file: false },
      { label: "Last Name", value: "Singh", half: true, file: false },
      {
        label: "Email",
        value: "ayushsingh@gmail.com",
        half: true,
        file: false,
      },
      { label: "Mobile", value: "+91 98765 43210", half: true, file: false },
    ],
  },
  {
    id: "academic",
    label: "Academic Details",
    fields: [
      {
        label: "Institute Name",
        value: "IIT Kanpur",
        half: false,
        file: false,
      },
      { label: "CGPA", value: "8.7 / 10", half: false, file: false },
    ],
  },
  {
    id: "resume",
    label: "Resume & Links",
    fields: [
      {
        label: "Upload CV / Resume",
        value: "ayush_singh_resume.pdf",
        half: false,
        file: true,
      },
      { label: "Portfolio", value: "ayushsingh.dev", half: false, file: false },
    ],
  },
] as const;

const userTypes = ["College Students", "Professional", "Fresher"] as const;

const priorApplications = [
  {
    company: "Google",
    role: "SDE Intern",
    portal: "LinkedIn",
    status: "Interviewing",
    when: "3 days ago",
  },
  {
    company: "Razorpay",
    role: "Backend Intern",
    portal: "Internshala",
    status: "Applied",
    when: "1 week ago",
  },
];

const newApplication = {
  company: "Flipkart",
  role: "Frontend Intern",
  portal: "Unstop",
  when: "Just now",
};

// Monochrome Theme Accents
const FORM_ACCENT = "#000000"; // Pure Black for the light form
const DASH_ACCENT = "#FFFFFF"; // Pure White for the dark dashboard
const SILVER_ACCENT = "#9CA3AF"; // Slate-400 for neutral states

// ---- small local icons ----------------------------------------------------
const NavDashboardIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const NavApplicationsIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8" />
    <path d="M8 12h8" />
    <path d="M8 16h5" />
  </svg>
);

const NavProfileIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
  </svg>
);

const SearchGlyph = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const DocIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={FORM_ACCENT}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

const CheckGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill={FORM_ACCENT} />
    <path
      d="M4.5 8l2.3 2.3L11.5 5.5"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HustleBuddyCursor = () => (
  <div className="relative flex items-center justify-center z-[60]">
    <motion.div
      className="absolute w-6 h-6 rounded-full"
      style={{ border: `2px solid ${FORM_ACCENT}` }}
      animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
    />
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
      style={{ background: FORM_ACCENT }}
    >
      H
    </div>
  </div>
);

// ---- timeline logic --------------------------------------------------------
type TimelineEvent =
  | { kind: "aim"; fieldIdx: number }
  | { kind: "type"; fieldIdx: number }
  | { kind: "footerAim" }
  | { kind: "pageTurn"; to: number }
  | { kind: "submit" }
  | { kind: "stamp" }
  | { kind: "logged" }
  | { kind: "pause" };

function buildTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  pages.forEach((page, pIdx) => {
    page.fields.forEach((_, fIdx) => {
      events.push({ kind: "aim", fieldIdx: fIdx });
      events.push({ kind: "type", fieldIdx: fIdx });
    });
    events.push({ kind: "footerAim" });
    if (pIdx < pages.length - 1)
      events.push({ kind: "pageTurn", to: pIdx + 1 });
    else events.push({ kind: "submit" });
  });
  events.push({ kind: "stamp" });
  events.push({ kind: "logged" });
  events.push({ kind: "pause" });
  events.push({ kind: "pause" });
  events.push({ kind: "pause" });
  events.push({ kind: "pause" });
  return events;
}

type DerivedState = {
  pageIdx: number;
  filledInPage: number;
  activeFieldIdx: number;
  activeTarget: "field" | "footer" | null;
  footerReady: boolean;
  submitted: boolean;
  stamped: boolean;
  logged: boolean;
};

function deriveState(events: TimelineEvent[], uptoIdx: number): DerivedState {
  const state: DerivedState = {
    pageIdx: 0,
    filledInPage: 0,
    activeFieldIdx: -1,
    activeTarget: null,
    footerReady: false,
    submitted: false,
    stamped: false,
    logged: false,
  };
  for (let i = 0; i <= uptoIdx; i++) {
    const ev = events[i];
    if (ev.kind === "aim") {
      state.activeTarget = "field";
      state.activeFieldIdx = ev.fieldIdx;
    } else if (ev.kind === "type") {
      state.activeTarget = "field";
      state.activeFieldIdx = ev.fieldIdx;
      state.filledInPage = ev.fieldIdx + 1;
    } else if (ev.kind === "footerAim") {
      state.activeTarget = "footer";
      state.activeFieldIdx = -1;
      state.footerReady = true;
    } else if (ev.kind === "pageTurn") {
      state.pageIdx = ev.to;
      state.filledInPage = 0;
      state.activeFieldIdx = -1;
      state.activeTarget = null;
      state.footerReady = false;
    } else if (ev.kind === "submit") {
      state.submitted = true;
      state.activeTarget = null;
    } else if (ev.kind === "stamp") {
      state.stamped = true;
    } else if (ev.kind === "logged") {
      state.logged = true;
    }
  }
  return state;
}

const typeContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.022 } },
};
const typeChar: Variants = {
  hidden: { opacity: 0, y: 2 },
  visible: { opacity: 1, y: 0 },
};

export const BrowserDemo = () => {
  const events = useMemo(buildTimeline, []);
  const [tick, setTick] = useState(0);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fieldsContainerRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);

  // Precise Play/Pause logic (starts at 50%, stops past 30%)
  const inView50 = useInView(containerRef, { amount: 0.5 });
  const inView30 = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (inView50) {
      setIsPlaying(true);
    } else if (!inView30) {
      setIsPlaying(false);
    }
  }, [inView50, inView30]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTick((t) => (t + 1) % events.length);
    }, 850);

    return () => clearInterval(timer);
  }, [isPlaying, events.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const cardScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [1, 1.07, 1.07, 1],
  );

  // Subdued Monochrome Glow
  const cardGlow = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [
      "0 0 0px rgba(255, 255, 255, 0)",
      "0 0 50px rgba(255, 255, 255, 0.07)",
      "0 0 50px rgba(255, 255, 255, 0.07)",
      "0 0 0px rgba(255, 255, 255, 0)",
    ],
  );

  const idx = Math.min(tick, events.length - 1);
  const state = deriveState(events, idx);
  const page = pages[state.pageIdx];
  const isLastPage = state.pageIdx === pages.length - 1;
  const currentKind = events[idx].kind;
  const showPulse = currentKind === "aim" || currentKind === "footerAim";

  useEffect(() => {
    const container = fieldsContainerRef.current;
    if (!container) return;

    let target: HTMLDivElement | null = null;
    if (state.activeTarget === "field" && state.activeFieldIdx >= 0) {
      target = fieldRefs.current[state.activeFieldIdx];
    } else if (state.activeTarget === "footer") {
      target = footerRef.current;
    }

    if (!target) {
      setCursorPos(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    let cx = 0,
      cy = 0;
    if (state.activeTarget === "footer") {
      cx = targetRect.left - containerRect.left + targetRect.width / 2;
      cy = targetRect.top - containerRect.top + targetRect.height / 2;
    } else {
      cx = targetRect.right - containerRect.left - 24;
      cy = targetRect.top - containerRect.top + targetRect.height / 2;
    }

    setCursorPos({ x: cx, y: cy });
  }, [idx, state.activeTarget, state.activeFieldIdx]);

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto py-24">
      <motion.div
        style={{
          scale: cardScale,
          boxShadow: cardGlow,
        }}
        className="w-full p-3 md:p-4 bg-[#08080A] rounded-[28px] border border-white/5"
      >
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          {/* LEFT: Target Website Form */}
          <div className="flex-1 rounded-2xl border border-black/10 bg-white overflow-hidden">
            <div className="flex items-center px-3.5 py-2.5 bg-[#EBECEF]">
              <div className="flex items-center gap-[7px]">
                <span
                  className="w-[11px] h-[11px] rounded-full"
                  style={{ background: "#FF5F57" }}
                />
                <span
                  className="w-[11px] h-[11px] rounded-full"
                  style={{ background: "#FEBC2E" }}
                />
                <span
                  className="w-[11px] h-[11px] rounded-full"
                  style={{ background: "#28C840" }}
                />
              </div>
              <div className="flex-1 text-center text-[12px] text-gray-500 -ml-[54px]">
                Apply — Flipkart
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#F5F6F8] border-b border-black/5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B0B3B8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-black/10 rounded-md px-3 py-1.5">
                <span className="text-[13px] text-gray-600 truncate">
                  unstop.com/apply/flipkart-frontend
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-black/5">
              <div className="w-9 h-9 rounded-full bg-gray-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                FK
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-gray-900 truncate">
                  Frontend Internship
                </div>
                <div className="text-[12px] text-gray-500 truncate">
                  Flipkart
                </div>
              </div>
            </div>

            <div ref={fieldsContainerRef} className="px-5 py-5 relative">
              <div className="text-[17px] font-semibold text-gray-900 mb-4">
                Application Form
              </div>

              <div className="flex items-center gap-2 mb-5">
                {pages.map((p, i) => {
                  const done =
                    i < state.pageIdx ||
                    (i === state.pageIdx && state.footerReady);
                  const current = i === state.pageIdx;
                  return (
                    <div key={p.id} className="flex items-center gap-2 flex-1">
                      <span
                        className="text-[10px] w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors duration-300"
                        style={{
                          borderColor:
                            done || current ? FORM_ACCENT : "#E5E7EB",
                          color: done || current ? "#FFFFFF" : "#9CA3AF",
                          background: done
                            ? FORM_ACCENT
                            : current
                              ? FORM_ACCENT
                              : "transparent",
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      {i < pages.length - 1 && (
                        <div className="flex-1 h-px bg-gray-200 relative overflow-hidden">
                          <motion.div
                            className="absolute inset-y-0 left-0"
                            style={{ background: FORM_ACCENT }}
                            initial={false}
                            animate={{ width: done ? "100%" : "0%" }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] font-semibold text-gray-900">
                  {page.label}
                </span>
                <AnimatePresence mode="wait">
                  {!state.submitted ? (
                    <motion.span
                      key="filling"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] rounded-full px-2.5 py-1 font-medium border"
                      style={{
                        borderColor: "#E5E7EB",
                        color: FORM_ACCENT,
                        background: "#F9FAFB",
                      }}
                    >
                      Filling from your profile
                    </motion.span>
                  ) : (
                    <motion.span
                      key="applied"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] rounded-full px-2.5 py-1 font-medium"
                      style={{
                        color: "#FFFFFF",
                        background: FORM_ACCENT,
                      }}
                    >
                      Applied
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative min-h-[190px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, x: 14, rotateZ: 0.6 }}
                    animate={{ opacity: 1, x: 0, rotateZ: 0 }}
                    exit={{ opacity: 0, x: -14, rotateZ: -0.6 }}
                    transition={{ type: "spring", stiffness: 260, damping: 34 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {page.fields.map((field, i) => {
                      const filled = i < state.filledInPage;
                      const active =
                        state.activeTarget === "field" &&
                        state.activeFieldIdx === i;

                      return (
                        <div
                          key={field.label}
                          ref={(el: HTMLDivElement | null) => {
                            fieldRefs.current[i] = el;
                          }}
                          className={field.half ? "col-span-1" : "col-span-2"}
                        >
                          <div className="text-[12px] text-gray-500 mb-1">
                            {field.label}{" "}
                            <span style={{ color: FORM_ACCENT }}>*</span>
                          </div>

                          <div
                            className="h-11 rounded-lg border px-3 flex items-center relative transition-all duration-300"
                            style={{
                              borderColor: active ? FORM_ACCENT : "#E5E7EB",
                              background: filled ? "#FAFBFC" : "#FCFCFD",
                              boxShadow: active
                                ? `0 0 0 1px ${FORM_ACCENT}, 0 0 12px rgba(0,0,0,0.06)`
                                : "none",
                            }}
                          >
                            {field.file && filled && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 flex-1"
                              >
                                <DocIcon />
                                <span className="text-[13px] text-gray-800 truncate">
                                  {field.value}
                                </span>
                              </motion.div>
                            )}

                            {!field.file && filled && (
                              <motion.span
                                initial="hidden"
                                animate="visible"
                                variants={typeContainer}
                                className="flex text-gray-900 text-[14px]"
                              >
                                {field.value.split("").map((char, ci) => (
                                  <motion.span key={ci} variants={typeChar}>
                                    {char}
                                  </motion.span>
                                ))}
                              </motion.span>
                            )}

                            {active && (
                              <motion.span
                                className="inline-block w-[1.5px] h-4 ml-0.5"
                                style={{ background: FORM_ACCENT }}
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.9, repeat: Infinity }}
                              />
                            )}

                            <AnimatePresence>
                              {filled && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  <CheckGlyph />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative mt-5 pt-4 border-t border-black/5 flex items-center justify-between">
                <span className="text-[13px] text-gray-400">Back</span>
                <div
                  ref={footerRef}
                  className="h-9 px-5 rounded-full flex items-center justify-center text-[13px] font-medium transition-all duration-300"
                  style={{
                    background:
                      state.submitted || state.footerReady
                        ? FORM_ACCENT
                        : "#F3F4F6",
                    color:
                      state.submitted || state.footerReady ? "#fff" : "#9CA3AF",
                  }}
                >
                  {state.submitted
                    ? "Submitted"
                    : isLastPage
                      ? "Submit"
                      : "Next"}
                </div>

                <AnimatePresence>
                  {state.stamped && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.7, rotate: -14 }}
                      animate={{ opacity: 1, scale: 1, rotate: -8 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 14,
                      }}
                      className="absolute -top-4 right-4 select-none pointer-events-none"
                    >
                      <div
                        className="px-2.5 py-1 border-2 rounded-sm text-[11px] font-bold tracking-[0.15em] shadow-xl"
                        style={{
                          color: "#FFFFFF",
                          background: FORM_ACCENT,
                          borderColor: FORM_ACCENT,
                        }}
                      >
                        APPLIED
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {showPulse && cursorPos && (
                  <motion.div
                    key={`pulse-${idx}`}
                    className="absolute pointer-events-none z-[55]"
                    style={{
                      left: cursorPos.x,
                      top: cursorPos.y,
                      border: `2px solid ${FORM_ACCENT}`,
                    }}
                    initial={{
                      width: 4,
                      height: 4,
                      opacity: 0.4,
                      x: "-50%",
                      y: "-50%",
                    }}
                    animate={{
                      width: 36,
                      height: 36,
                      opacity: 0,
                      x: "-50%",
                      y: "-50%",
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {cursorPos && (
                  <motion.div
                    key="cursor"
                    className="absolute top-0 left-0 pointer-events-none z-[60]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, x: cursorPos.x, y: cursorPos.y }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 210,
                      damping: 28,
                      mass: 0.9,
                    }}
                  >
                    <div className="-translate-x-1/2 -translate-y-1/2">
                      <HustleBuddyCursor />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* MIDDLE: Visual Sync Connector */}
          <div className="flex md:flex-col items-center justify-center gap-2 py-2 md:py-0 md:px-1 md:w-10">
            <div className="relative w-full md:h-full flex md:flex-col items-center justify-center">
              <div className="hidden md:block w-px h-full bg-white/10 relative overflow-hidden">
                <AnimatePresence>
                  {state.submitted && !state.logged && (
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute w-1.5 h-1.5 rounded-full -left-[2.5px]"
                      style={{ background: DASH_ACCENT }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div
                className="absolute md:static w-6 h-6 rounded-full border flex items-center justify-center text-[10px] transition-colors duration-300"
                style={{
                  borderColor: state.logged
                    ? DASH_ACCENT
                    : "rgba(255,255,255,0.1)",
                  color: state.logged ? "#000000" : "#4b4b55",
                  background: state.logged ? DASH_ACCENT : "transparent",
                }}
              >
                {state.logged ? "✓" : "·"}
              </div>
            </div>
          </div>

          {/* RIGHT: HustleBuddy Dashboard */}
          <div className="flex-1 rounded-2xl border border-white/5 bg-[#0C0C0E] overflow-hidden flex">
            <div className="hidden sm:flex flex-col items-center w-12 py-3 gap-1 border-r border-white/5 bg-white/[0.015]">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-black mb-2"
                style={{ background: DASH_ACCENT }}
              >
                H
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500">
                <NavDashboardIcon />
              </button>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `rgba(255,255,255,0.1)`,
                  color: DASH_ACCENT,
                }}
              >
                <NavApplicationsIcon />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500">
                <NavProfileIcon />
              </button>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 py-1.5 text-slate-500">
                    <SearchGlyph />
                    <span className="text-[12px]">Search applications…</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Total Logged
                      </div>
                      <div className="text-xl font-light text-slate-200 tabular-nums font-mono">
                        {priorApplications.length + (state.logged ? 1 : 0)}
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Tracker Sync
                      </div>
                      <div
                        className="text-xs font-medium mt-1.5 flex items-center gap-1.5"
                        style={{ color: DASH_ACCENT }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: DASH_ACCENT }}
                        />
                        Active
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-3">
                      Recent Applications
                    </div>

                    <AnimatePresence>
                      {state.logged && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="p-3 bg-white/[0.05] border border-white/10 rounded-xl flex items-center justify-between mb-2 overflow-hidden"
                        >
                          <div>
                            <div className="text-xs font-medium text-white">
                              {newApplication.company}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {newApplication.role} • {newApplication.portal}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">
                            {newApplication.when}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {priorApplications.map((app) => (
                      <div
                        key={app.company}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between opacity-70"
                      >
                        <div>
                          <div className="text-xs font-medium text-slate-300">
                            {app.company}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {app.role} • {app.portal}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {app.when}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-white/5 flex justify-between text-xs font-mono text-slate-500">
                <span>0 Manual Entries</span>
                <span>100% Automated</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
