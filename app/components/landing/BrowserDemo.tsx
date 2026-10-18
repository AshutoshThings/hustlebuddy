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
import { HustleBuddyLogo } from "../ui/HustleBuddyLogo";

const pages = [
  {
    id: "basic",
    label: "Basic details",
    fields: [
      { label: "First name", value: "Ashutosh", half: true, file: false },
      { label: "Last name", value: "Vishwakarma", half: true, file: false },
      {
        label: "Email",
        value: "ashutoshvish2024@gmail.com",
        half: true,
        file: false,
      },
      { label: "Mobile", value: "+91 98765 43210", half: true, file: false },
    ],
  },
  {
    id: "academic",
    label: "Academic details",
    fields: [
      {
        label: "Institute name",
        value: "JIIT Noida",
        half: false,
        file: false,
      },
      {
        label: "CGPA / Percentage",
        value: "8.8 / 10",
        half: false,
        file: false,
      },
    ],
  },
  {
    id: "resume",
    label: "Resume and links",
    fields: [
      {
        label: "Resume",
        value: "ashutosh_resume_cse.pdf",
        half: false,
        file: true,
      },
      {
        label: "Portfolio",
        value: "github.com/ashutosh",
        half: false,
        file: false,
      },
    ],
  },
] as const;

const TOTAL_FIELDS = pages.reduce((n, p) => n + p.fields.length, 0);

const priorApplications = [
  {
    id: "app-1",
    company: "Skillorbit Private...",
    role: "Cloud Computing Internship",
    status: "applied",
    date: "Applied on 17 Oct 2026",
    dotColor: "bg-blue-500",
  },
  {
    id: "app-2",
    company: "SRs Adyapan Ed...",
    role: "Student Coordinator Internship",
    status: "interviewing",
    date: "Applied on 17 Oct 2026",
    dotColor: "bg-amber-500",
  },
];
const currentDate = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const newApplication = {
  id: "app-new",
  company: "Flipkart",
  role: "Frontend Intern",
  status: "applied",
  date: `Applied on ${currentDate}`,
  dotColor: "bg-blue-500",
};

const COLUMNS = [
  { id: "applied", label: "Applied", dotColor: "bg-blue-500", count: 3 },
  {
    id: "interviewing",
    label: "Interviewing",
    dotColor: "bg-amber-500",
    count: 3,
  },
  { id: "offered", label: "Offered", dotColor: "bg-emerald-500", count: 3 },
];

const ACCENT = "#000000";
const DASH_ACCENT = "#FFFFFF";

const Svg = ({
  children,
  size = 16,
  stroke = "currentColor",
  sw = 1.8,
}: {
  children: React.ReactNode;
  size?: number;
  stroke?: string;
  sw?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const AppleGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const TrafficLights = ({ dim = false }: { dim?: boolean }) => (
  <div className="flex items-center gap-[7px]">
    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
      <span
        key={c}
        className="w-[11px] h-[11px] rounded-full"
        style={{ background: dim ? "rgba(255,255,255,0.18)" : c }}
      />
    ))}
  </div>
);

const DocIcon = () => (
  <Svg stroke={ACCENT}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </Svg>
);

const CheckGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill={ACCENT} />
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
    {/* Pulsing outer ring */}
    <motion.div
      className="absolute w-6 h-6 rounded-full"
      style={{ border: `2px solid ${ACCENT}` }}
      animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
    />

    {/* Inner circle with your logo */}
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
      style={{ background: ACCENT }}
    >
      <HustleBuddyLogo className="w-3 h-3 text-white" />
    </div>
  </div>
);

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
  for (let i = 0; i < 4; i++) events.push({ kind: "pause" });
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

const windowShadow = "shadow-[0_24px_60px_rgba(0,0,0,0.55)]";

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

  const inView50 = useInView(containerRef, { amount: 0.5 });
  const inView30 = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (inView50) setIsPlaying(true);
    else if (!inView30) setIsPlaying(false);
  }, [inView50, inView30]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(
      () => setTick((t) => (t + 1) % events.length),
      850,
    );
    return () => clearInterval(timer);
  }, [isPlaying, events.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const cardScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [1, 1.05, 1.05, 1],
  );
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

  const filledTotal =
    pages.slice(0, state.pageIdx).reduce((n, p) => n + p.fields.length, 0) +
    state.filledInPage;
  const showPopup = (filledTotal > 0 || state.pageIdx > 0) && !state.logged;

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

    const c = container.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (state.activeTarget === "footer") {
      setCursorPos({
        x: t.left - c.left + t.width / 2,
        y: t.top - c.top + t.height / 2,
      });
    } else {
      setCursorPos({
        x: t.right - c.left - 24,
        y: t.top - c.top + t.height / 2,
      });
    }
  }, [idx, state.activeTarget, state.activeFieldIdx]);

  return (
    <div ref={containerRef} className="w-full max-w-7xl mx-auto py-24 px-4">
      <motion.div
        style={{ scale: cardScale, boxShadow: cardGlow }}
        className="w-full bg-[#08080A] rounded-[28px] border border-white/5 overflow-hidden"
      >
        {/* macOS menu bar */}
        <div className="h-7 px-4 flex items-center justify-between bg-black/50 border-b border-white/5 text-[12px] text-white/70 select-none">
          <div className="flex items-center gap-4">
            <span className="text-white/90">
              <AppleGlyph />
            </span>
            <span className="font-semibold text-white/90">Chrome</span>
            <div className="hidden md:flex items-center gap-4">
              {[
                "File",
                "Edit",
                "View",
                "History",
                "Bookmarks",
                "Window",
                "Help",
              ].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <Svg size={14}>
              <path d="M5 12.5a10 10 0 0 1 14 0" />
              <path d="M8.5 16a5 5 0 0 1 7 0" />
              <circle cx="12" cy="19" r="0.8" fill="currentColor" />
            </Svg>
            <svg width="20" height="12" viewBox="0 0 26 14" fill="none">
              <rect
                x="0.5"
                y="0.5"
                width="22"
                height="13"
                rx="3.5"
                stroke="currentColor"
                opacity="0.6"
              />
              <rect
                x="2.5"
                y="2.5"
                width="14"
                height="9"
                rx="1.8"
                fill="currentColor"
              />
              <rect
                x="24"
                y="4.5"
                width="1.6"
                height="5"
                rx="0.8"
                fill="currentColor"
                opacity="0.6"
              />
            </svg>
            <span className="tabular-nums">Fri 10:42 AM</span>
          </div>
        </div>

        {/* desktop */}
        <div className="p-3 md:p-5 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]">
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            {/* LEFT: Chrome window */}
            <div
              className={`relative flex-[1.1] min-w-0 rounded-xl overflow-hidden bg-white ring-1 ring-black/20 ${windowShadow}`}
            >
              {/* tab strip */}
              <div className="flex items-end gap-2 pl-3.5 pr-3 pt-2.5 bg-[#DEE1E6]">
                <div className="pb-2.5">
                  <TrafficLights />
                </div>
                <div className="ml-3 flex items-center gap-2 bg-white rounded-t-lg px-3 py-2 text-[12px] text-gray-800 max-w-[190px] min-w-0">
                  <span className="w-3.5 h-3.5 rounded-sm bg-gray-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                    U
                  </span>
                  <span className="truncate">Apply — Flipkart</span>
                  <span className="text-gray-400 text-[13px] leading-none ml-1">
                    ×
                  </span>
                </div>
                <div className="pb-2 text-gray-500 text-[16px] leading-none">
                  +
                </div>
              </div>

              {/* toolbar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-black/10 text-gray-500">
                <Svg size={15} sw={2}>
                  <path d="M15 18l-6-6 6-6" />
                </Svg>
                <span className="opacity-40">
                  <Svg size={15} sw={2}>
                    <path d="M9 18l6-6-6-6" />
                  </Svg>
                </span>
                <Svg size={14} sw={2}>
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 4v5h-5" />
                </Svg>
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#F1F3F4] rounded-full px-3.5 py-1.5">
                  <Svg size={12} sw={2}>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </Svg>
                  <span className="text-[12.5px] text-gray-700 truncate">
                    unstop.com/apply/flipkart-frontend
                  </span>
                </div>
                <Svg size={15}>
                  <path d="M10 4h4a1 1 0 0 1 1 1v2h2a1 1 0 0 1 1 1v3h-1.5a1.5 1.5 0 0 0 0 3H18v3a1 1 0 0 1-1 1h-3v-1.5a1.5 1.5 0 0 0-3 0V20H8a1 1 0 0 1-1-1v-3h1.5a1.5 1.5 0 0 0 0-3H7V8a1 1 0 0 1 1-1h2V5a1 1 0 0 1 0 0z" />
                </Svg>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white transition-colors p-1"
                  style={{ background: showPopup ? "#000" : "#3C4043" }}
                >
                  <HustleBuddyLogo className="w-4 h-4 text-white" />
                </div>
                <span className="w-6 h-6 rounded-full bg-gray-300 text-[10px] font-semibold text-gray-600 flex items-center justify-center">
                  A
                </span>
              </div>

              {/* extension popup */}
              <AnimatePresence>
                {showPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-3 top-[84px] z-[70] w-60 rounded-xl bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.28)] p-3.5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center p-1">
                        <HustleBuddyLogo className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-900">
                        HustleBuddy
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400">
                        Preview
                      </span>
                    </div>
                    {!state.submitted ? (
                      <>
                        <div className="text-[12px] text-gray-700 mb-2">
                          Filling from your profile
                        </div>
                        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                          <motion.div
                            className="h-full bg-black"
                            initial={false}
                            animate={{
                              width: `${(filledTotal / TOTAL_FIELDS) * 100}%`,
                            }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1.5 tabular-nums">
                          {filledTotal} of {TOTAL_FIELDS} fields
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[12px] font-medium text-gray-900">
                          Saved to your dashboard
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Frontend Intern at Flipkart
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* page content */}
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
                  Application form
                </div>

                <div className="flex items-center gap-2 mb-5">
                  {pages.map((p, i) => {
                    const done =
                      i < state.pageIdx ||
                      (i === state.pageIdx && state.footerReady);
                    const current = i === state.pageIdx;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 flex-1"
                      >
                        <span
                          className="text-[10px] w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors duration-300"
                          style={{
                            borderColor: done || current ? ACCENT : "#E5E7EB",
                            color: done || current ? "#FFFFFF" : "#9CA3AF",
                            background:
                              done || current ? ACCENT : "transparent",
                          }}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        {i < pages.length - 1 && (
                          <div className="flex-1 h-px bg-gray-200 relative overflow-hidden">
                            <motion.div
                              className="absolute inset-y-0 left-0"
                              style={{ background: ACCENT }}
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

                <div className="mb-4 text-[15px] font-semibold text-gray-900">
                  {page.label}
                </div>

                <div className="relative min-h-[190px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={page.id}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -14 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 34,
                      }}
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
                              <span style={{ color: ACCENT }}>*</span>
                            </div>
                            <div
                              className="h-11 rounded-lg border px-3 flex items-center relative transition-all duration-300"
                              style={{
                                borderColor: active ? ACCENT : "#E5E7EB",
                                background: filled ? "#FAFBFC" : "#FCFCFD",
                                boxShadow: active
                                  ? `0 0 0 1px ${ACCENT}, 0 0 12px rgba(0,0,0,0.06)`
                                  : "none",
                              }}
                            >
                              {field.file && filled && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex items-center gap-2 flex-1 min-w-0"
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
                                  style={{ background: ACCENT }}
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{
                                    duration: 0.9,
                                    repeat: Infinity,
                                  }}
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
                  <AnimatePresence mode="wait">
                    {state.stamped ? (
                      <motion.span
                        key="done"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[12px] text-gray-900 font-medium flex items-center gap-1.5"
                      >
                        <CheckGlyph /> Application submitted
                      </motion.span>
                    ) : (
                      <span key="back" className="text-[13px] text-gray-400">
                        Back
                      </span>
                    )}
                  </AnimatePresence>
                  <div
                    ref={footerRef}
                    className="h-9 px-5 rounded-full flex items-center justify-center text-[13px] font-medium transition-all duration-300"
                    style={{
                      background:
                        state.submitted || state.footerReady
                          ? ACCENT
                          : "#F3F4F6",
                      color:
                        state.submitted || state.footerReady
                          ? "#fff"
                          : "#9CA3AF",
                    }}
                  >
                    {state.submitted
                      ? "Submitted"
                      : isLastPage
                        ? "Submit"
                        : "Next"}
                  </div>
                </div>

                <AnimatePresence>
                  {showPulse && cursorPos && (
                    <motion.div
                      key={`pulse-${idx}`}
                      className="absolute pointer-events-none z-[55] rounded-full"
                      style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        border: `2px solid ${ACCENT}`,
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

            {/* MIDDLE: sync connector */}
            <div className="flex lg:flex-col items-center justify-center gap-2 py-2 lg:py-0 lg:w-8">
              <div className="relative w-full lg:h-full flex lg:flex-col items-center justify-center">
                <div className="hidden lg:block w-px h-full bg-white/10 relative overflow-hidden">
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
                  className="absolute lg:static w-6 h-6 rounded-full border flex items-center justify-center text-[10px] transition-colors duration-300"
                  style={{
                    borderColor: state.logged
                      ? DASH_ACCENT
                      : "rgba(255,255,255,0.1)",
                    color: state.logged ? "#000" : "#4b4b55",
                    background: state.logged ? DASH_ACCENT : "transparent",
                  }}
                >
                  {state.logged ? "✓" : "·"}
                </div>
              </div>
            </div>

            {/* RIGHT: HustleBuddy Kanban Dashboard View (Cropped Layout matching user dashboard) */}
            <div
              className={`flex-[1.5] min-w-0 rounded-xl overflow-hidden bg-[#0C0C0E] ring-1 ring-white/10 flex flex-col ${windowShadow}`}
            >
              {/* App Window Header matching dashboard top bar */}
              <div className="flex items-center justify-between px-5 py-4 bg-[#0a0a0a] border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-white bg-black border border-white/10 p-1">
                    <HustleBuddyLogo className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white tracking-tight">
                    HustleBuddy
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs text-slate-400">
                    <span className="px-2.5 py-1 bg-white/10 text-white rounded-md font-medium">
                      Board
                    </span>
                    <span className="px-2.5 py-1">Table</span>
                  </div>
                  <div className="bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-medium">
                    + New Application
                  </div>
                </div>
              </div>

              {/* Subheader Filter Bar matching dashboard */}
              <div className="px-5 py-3 bg-[#0a0a0a]/50 border-b border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Showing <span className="text-white">11 of 11</span>{" "}
                  applications
                </span>
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 text-[11px] text-slate-400">
                  <span className="px-2 py-1 bg-white/10 text-white rounded-md">
                    All Time
                  </span>
                  <span className="px-2 py-1">This Week</span>
                  <span className="px-2 py-1">This Month</span>
                </div>
              </div>

              {/* Kanban Columns Grid (Cropped to 3 columns to match right-hand cropped layout) */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 flex-1 bg-[#050505]">
                {COLUMNS.map((col) => {
                  const colApps = [
                    ...priorApplications,
                    ...(state.logged ? [newApplication] : []),
                  ].filter((app) => app.status === col.id);

                  return (
                    <div
                      key={col.id}
                      className="border border-white/10 bg-[#0a0a0a]/60 rounded-xl p-3.5 flex flex-col gap-3 h-[300px] max-h-[300px] overflow-hidden"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${col.dotColor}`}
                          />
                          <span className="text-xs font-semibold text-white">
                            {col.label}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/5 text-slate-300 border border-white/5">
                          {col.count +
                            (state.logged && col.id === "applied" ? 1 : 0)}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
                        {colApps.map((app) => (
                          <motion.div
                            key={app.id}
                            layout
                            initial={
                              app.id === "app-new"
                                ? { opacity: 0, scale: 0.9 }
                                : false
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-3 rounded-xl border bg-[#111113] shadow-sm relative shrink-0 ${
                              app.id === "app-new" && state.logged
                                ? "border-white/40 ring-1 ring-white/30"
                                : "border-white/10 hover:border-white/20"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-medium text-white truncate pr-2">
                                {app.company}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                              {app.role}
                            </p>
                            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5 text-slate-500">
                              <span>{app.date}</span>
                              <span className="capitalize px-2 py-0.5 rounded bg-white/5 text-slate-300">
                                {app.status}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer status bar */}
              <div className="px-5 py-2.5 border-t border-white/5 flex justify-between text-[11px] font-mono text-slate-500 bg-[#0a0a0a]">
                <span>Drag and drop to reorder on the dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="mt-5 text-center text-xs text-slate-500">
        Preview of the browser extension and dashboard sync.
      </p>
    </div>
  );
};
