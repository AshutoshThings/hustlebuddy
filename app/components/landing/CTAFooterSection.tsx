// "use client";

// import { useRouter } from "next/navigation";
// import { Reveal } from "@/app/components/ui/Reveal";
// import { motion, useMotionTemplate, useMotionValue } from "motion/react";
// import { MouseEvent } from "react";
// import { HustleBuddyLogo } from "../ui/HustleBuddyLogo";

// const links = [
//   {
//     label: "GitHub",
//     href: "https://www.github.com/ashutoshthings/hustlebuddy",
//   },
//   { label: "Privacy", href: "/privacy" },
//   { label: "Terms", href: "/terms" },
// ];

// export const CTAFooterSection = () => {
//   const router = useRouter();
//   const mouseX = useMotionValue(0);
//   const mouseY = useMotionValue(0);

//   function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
//     const { left, top } = currentTarget.getBoundingClientRect();
//     mouseX.set(clientX - left);
//     mouseY.set(clientY - top);
//   }

//   const handleOpenDashboard = async () => {
//     try {
//       const res = await fetch("/api/auth/session", { method: "GET" });
//       router.push(res.ok ? "/dashboard" : "/auth");
//     } catch {
//       router.push("/auth");
//     }
//   };

//   const spotlight = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.03), transparent 80%)`;
//   const dotMask = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent 80%)`;

//   return (
//     <footer
//       onMouseMove={handleMouseMove}
//       className="relative border-t border-white/5 bg-[#050505] overflow-hidden group"
//     >
//       <motion.div
//         className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
//         style={{ background: spotlight }}
//       />
//       <motion.div
//         className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
//         style={{
//           backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
//           backgroundSize: "24px 24px",
//           maskImage: dotMask,
//           WebkitMaskImage: dotMask,
//         }}
//       />

//       <div className="py-32 px-6 md:px-12 lg:px-24 text-center max-w-3xl mx-auto relative z-10">
//         <Reveal>
//           <h2 className="text-5xl md:text-7xl font-medium tracking-tight text-white/90 mb-6">
//             Stop retyping.
//             <br />
//             Start tracking.
//           </h2>
//           <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
//             Put every application in one place. The extension and Gmail sync
//             will join the dashboard as they’re ready.
//           </p>
//           <button
//             onClick={handleOpenDashboard}
//             className="px-8 py-4 bg-white text-black text-lg font-medium rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
//           >
//             Open my dashboard
//           </button>
//         </Reveal>
//       </div>

//       <div className="border-t border-white/5 px-6 md:px-12 lg:px-24 py-8 flex flex-col md:flex-row items-center justify-between gap-4 z-10 relative bg-[#050505]">
//         <div className="flex items-center gap-2 text-white font-semibold tracking-tight">
//           <HustleBuddyLogo className="w-5 h-5" />
//           HustleBuddy
//         </div>
//         <div className="flex items-center gap-6 text-sm text-slate-500">
//           {links.map((l) => (
//             <a
//               key={l.label}
//               href={l.href}
//               className="hover:text-white transition-colors"
//             >
//               {l.label}
//             </a>
//           ))}
//           <span className="text-slate-600">© 2026</span>
//         </div>
//       </div>
//     </footer>
//   );
// };

"use client";

import { useRouter } from "next/navigation";
import { Reveal } from "@/app/components/ui/Reveal";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { MouseEvent } from "react";
import { HustleBuddyLogo } from "../ui/HustleBuddyLogo";

const links = [
  {
    label: "GitHub",
    href: "https://www.github.com/ashutoshthings/hustlebuddy",
  },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const EXTENSION_URL =
  "https://github.com/AshutoshThings/hustlebuddy/releases/latest/download/hustlebuddy-extension.zip";

const STEPS = [
  "Download the zip and unzip it.",
  "Open chrome://extensions and switch on Developer mode.",
  "Click “Load unpacked” and pick the unzipped folder.",
  "Pin HustleBuddy, click it, and hit Connect account.",
];

export const CTAFooterSection = () => {
  const router = useRouter();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const handleOpenDashboard = async () => {
    try {
      const res = await fetch("/api/auth/session", { method: "GET" });
      router.push(res.ok ? "/dashboard" : "/auth");
    } catch {
      router.push("/auth");
    }
  };

  const spotlight = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.03), transparent 80%)`;
  const dotMask = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent 80%)`;

  return (
    <footer
      onMouseMove={handleMouseMove}
      className="relative border-t border-white/5 bg-[#050505] overflow-hidden group"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
        style={{ background: spotlight }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage: dotMask,
          WebkitMaskImage: dotMask,
        }}
      />

      {/* 2. Download Extension & Installation Steps Section */}
      <div
        id="extension"
        className="py-24 px-6 md:px-12 lg:px-24 max-w-3xl mx-auto text-center relative z-10"
      >
        <Reveal>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white/90 mb-4">
            Get the extension
          </h2>
          <p className="text-slate-500 text-lg font-light mb-10">
            Log an application from any job page in two clicks.
          </p>
          <a
            href={EXTENSION_URL}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-lg font-medium rounded-full hover:scale-[1.02] active:scale-95 transition-all"
          >
            Download extension
            <span className="text-xl opacity-50">↓</span>
          </a>
        </Reveal>

        <Reveal delay={0.15}>
          <ol className="mt-14 text-left max-w-md mx-auto space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4 text-sm text-slate-400">
                <span className="font-mono text-slate-600">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      {/* 3. Footer Copyright Bar */}
      <div className="border-t border-white/5 px-6 md:px-12 lg:px-24 py-8 flex flex-col md:flex-row items-center justify-between gap-4 z-10 relative bg-[#050505]">
        <div className="flex items-center gap-2 text-white font-semibold tracking-tight">
          <HustleBuddyLogo className="w-5 h-5" />
          HustleBuddy
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <span className="text-slate-600">© 2026</span>
        </div>
      </div>
    </footer>
  );
};
