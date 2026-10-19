"use client";

import type { ReactNode } from "react";
import { HustleBuddyLogo } from "@/app/components/ui/HustleBuddyLogo";

type Tab = "board" | "resumes" | "settings";

type SidebarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const BoardIcon = () => (
  <svg {...iconProps}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </svg>
);

const FileTextIcon = () => (
  <svg {...iconProps}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
);

const BarChartIcon = () => (
  <svg {...iconProps}>
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </svg>
);

const SettingsIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

type NavItem = {
  id: Tab | "analytics";
  label: string;
  icon: ReactNode;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "board", label: "Board", icon: <BoardIcon /> },
  { id: "resumes", label: "Resumes", icon: <FileTextIcon /> },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChartIcon />,
    disabled: true,
  },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const select = (item: NavItem) => {
    if (item.disabled || item.id === "analytics") return;
    setActiveTab(item.id);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 hidden lg:flex flex-col justify-between bg-[#030303]">
        <div>
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <HustleBuddyLogo className="w-4 h-4" />
            </div>
            <span className="font-semibold text-white tracking-wide">
              HustleBuddy
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => select(item)}
                  disabled={item.disabled}
                  title={item.disabled ? "Coming soon" : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer profile */}
        <div className="pt-4 border-t border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-medium">
            AV
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">Ashutosh</p>
            <p className="text-[10px] text-slate-500 truncate">CS Student</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-white/10 bg-[#030303]/95 backdrop-blur"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => select(item)}
              disabled={item.disabled}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-white" : "text-slate-500"
              } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
