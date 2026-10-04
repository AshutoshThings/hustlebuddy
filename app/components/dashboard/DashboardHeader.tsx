"use client";

type DashboardHeaderProps = {
  onOpenForm: () => void;
  viewMode: "kanban" | "table";
  setViewMode: (mode: "kanban" | "table") => void;
};

export default function DashboardHeader({
  onOpenForm,
  viewMode,
  setViewMode,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-wide">
          Job Applications
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track and manage your career opportunities effortlessly.
        </p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {/* View Mode Toggle Pill */}
        <div className="bg-[#0a0a0a] border border-white/10 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === "kanban"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === "table"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Table
          </button>
        </div>

        {/* New Application Button */}
        <button
          onClick={onOpenForm}
          className="px-4 py-2 bg-white text-black text-xs font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
        >
          + New Application
        </button>
      </div>
    </div>
  );
}
