"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Application, ApplicationStatus } from "@/app/types/application";

type KanbanBoardProps = {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onStatusChange: (appId: string, newStatus: ApplicationStatus) => void;
};

type TimeFilter = "all" | "week" | "month";

type ColorTheme = {
  name: string;
  borderColor: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
};

const COLOR_PALETTES: ColorTheme[] = [
  {
    name: "Blue",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/[0.02]",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    name: "Purple",
    borderColor: "border-purple-500/20",
    bgColor: "bg-purple-500/[0.02]",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    name: "Emerald",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/[0.02]",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  {
    name: "Amber",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-500/[0.02]",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    dotColor: "bg-amber-500",
  },
  {
    name: "Rose",
    borderColor: "border-rose-500/20",
    bgColor: "bg-rose-500/[0.02]",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400",
    dotColor: "bg-rose-500",
  },
  {
    name: "Slate",
    borderColor: "border-white/10",
    bgColor: "bg-white/[0.01]",
    badgeBg: "bg-white/5",
    badgeText: "text-slate-400",
    dotColor: "bg-slate-400",
  },
];

const DEFAULT_THEMES: Record<ApplicationStatus, ColorTheme> = {
  applied: COLOR_PALETTES[0], // Blue
  interviewing: COLOR_PALETTES[3], // Amber
  offered: COLOR_PALETTES[2], // Emerald
  rejected: COLOR_PALETTES[4], // Rose
};

const COLUMNS: { id: ApplicationStatus; label: string }[] = [
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offered", label: "Offered" },
  { id: "rejected", label: "Rejected" },
];

export default function KanbanBoard({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: KanbanBoardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);

  // Column Customization State (persisted in localStorage)
  const [columnThemes, setColumnThemes] =
    useState<Record<ApplicationStatus, ColorTheme>>(DEFAULT_THEMES);
  const [activeColorPickerCol, setActiveColorPickerCol] =
    useState<ApplicationStatus | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  // Load saved themes on mount
  useEffect(() => {
    const saved = localStorage.getItem("kanban_column_themes");
    if (saved) {
      try {
        setColumnThemes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved column themes", e);
      }
    }
  }, []);

  // Close color picker dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setActiveColorPickerCol(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = (status: ApplicationStatus, theme: ColorTheme) => {
    const updated = { ...columnThemes, [status]: theme };
    setColumnThemes(updated);
    localStorage.setItem("kanban_column_themes", JSON.stringify(updated));
    setActiveColorPickerCol(null);
  };

  const filteredApplications = useMemo(() => {
    const now = new Date();

    return applications.filter((app) => {
      if (timeFilter === "all") return true;

      const appDate = new Date(app.date);
      if (isNaN(appDate.getTime())) return true;

      if (timeFilter === "month") {
        return (
          appDate.getMonth() === now.getMonth() &&
          appDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeFilter === "week") {
        const diffTime = now.getTime() - appDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }

      return true;
    });
  }, [applications, timeFilter]);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggingAppId(appId);
    e.dataTransfer.setData("text/plain", appId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain") || draggingAppId;
    if (appId) {
      onStatusChange(appId, targetStatus);
    }
    setDraggingAppId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Time Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl">
        <span className="text-xs text-slate-400 font-medium">
          Showing{" "}
          <span className="text-white">{filteredApplications.length}</span> of{" "}
          <span className="text-white">{applications.length}</span> applications
        </span>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              { id: "all", label: "All Time" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
            ] as { id: TimeFilter; label: string }[]
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                timeFilter === filter.id
                  ? "bg-white text-black"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((column) => {
          const colApps = filteredApplications.filter(
            (app) => app.status === column.id,
          );
          const theme = columnThemes[column.id] || DEFAULT_THEMES[column.id];

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`border rounded-2xl p-4 flex flex-col gap-3 min-h-[500px] transition-colors relative ${theme.borderColor} ${theme.bgColor}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 relative">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white tracking-wide">
                    {column.label}
                  </span>

                  {/* Color Customizer Button */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveColorPickerCol(
                          activeColorPickerCol === column.id ? null : column.id,
                        )
                      }
                      className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-110 transition-transform flex items-center justify-center cursor-pointer"
                      title="Change column color"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${theme.dotColor}`}
                      />
                    </button>

                    {/* Color Picker Popover */}
                    {activeColorPickerCol === column.id && (
                      <div
                        ref={pickerRef}
                        className="absolute left-0 top-6 z-30 w-40 bg-[#121212] border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 text-xs"
                      >
                        <span className="text-[10px] text-slate-500 px-2 py-1 font-medium uppercase tracking-wider">
                          Theme Color
                        </span>
                        {COLOR_PALETTES.map((palette) => (
                          <button
                            key={palette.name}
                            onClick={() =>
                              handleSelectTheme(column.id, palette)
                            }
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-left"
                          >
                            <span
                              className={`w-3 h-3 rounded-full ${palette.dotColor}`}
                            />
                            <span className="text-xs">{palette.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border border-white/5 ${theme.badgeBg} ${theme.badgeText}`}
                >
                  {colApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-3 flex-1">
                {colApps.length === 0 ? (
                  <div className="flex items-center justify-center flex-1 h-32 border border-dashed border-white/5 rounded-xl text-[11px] text-slate-600">
                    Drop applications here
                  </div>
                ) : (
                  colApps.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className={`bg-[#050505] border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:border-white/20 transition-colors group shadow-sm cursor-grab active:cursor-grabbing ${
                        draggingAppId === app.id
                          ? "opacity-40 border-dashed border-white"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-medium text-white truncate max-w-[160px]">
                            {app.company}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                            {app.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(app)}
                            className="text-slate-400 hover:text-white text-[11px] font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(app)}
                            className="text-red-400 hover:text-red-300 text-[11px] font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-500">
                        <span>Applied on {app.date}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
