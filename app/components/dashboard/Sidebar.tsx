"use client";

import { HustleBuddyLogo } from "@/app/components/ui/HustleBuddyLogo"; // <--- Imported your custom logo

type SidebarProps = {
  activeTab: "board" | "resumes" | "settings";
  setActiveTab: (tab: "board" | "resumes" | "settings") => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
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
          <button
            onClick={() => setActiveTab("board")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === "board"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span></span>
            <span>Board</span>
          </button>

          <button
            onClick={() => setActiveTab("resumes")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === "resumes"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span></span>
            <span>Resumes</span>
          </button>

          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <span></span>
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === "settings"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span></span>
            <span>Settings</span>
          </button>
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
  );
}
