"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Application, ApplicationStatus } from "@/app/types/application";

type TableViewProps = {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onStatusChange: (appId: string, newStatus: ApplicationStatus) => void;
};

type SortField = "company" | "role" | "status" | "date";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | ApplicationStatus;

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  interviewing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  offered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  // Fallback for any unknown status value
  unknown: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function TableView({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [openDropdown, setOpenDropdown] = useState<SortField | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSort = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setOpenDropdown(null);
  };

  const filteredAndSortedApplications = useMemo(() => {
    let result = applications.filter((app) => {
      if (statusFilter === "all") return true;
      return app.status === statusFilter;
    });

    return result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "date") {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
        if (sortDirection === "asc") return valA - valB;
        return valB - valA;
      }

      if (sortField === "status") {
        // Explicit separate weight tables to guarantee correct placement
        const weights =
          sortDirection === "asc"
            ? { offered: 1, interviewing: 2, applied: 3, rejected: 4 } // Offered First
            : { interviewing: 1, offered: 2, applied: 3, rejected: 4 }; // Interviewing First

        valA = weights[a.status as ApplicationStatus] || 99;
        valB = weights[b.status as ApplicationStatus] || 99;
        return valA - valB; // Always ascending numeric weight order
      }

      if (sortField === "company" || sortField === "role") {
        valA = (valA || "").toLowerCase();
        valB = (valB || "").toLowerCase();
        const comparison = valA.localeCompare(valB);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return 0;
    });
  }, [applications, sortField, sortDirection, statusFilter]);

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-slate-600 ml-1 font-normal">↕</span>;
    }
    return (
      <span className="text-white ml-1 font-bold">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Status Filter & Count Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl">
        <span className="text-xs text-slate-400 font-medium">
          Showing{" "}
          <span className="text-white">
            {filteredAndSortedApplications.length}
          </span>{" "}
          of <span className="text-white">{applications.length}</span>{" "}
          applications
        </span>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              "all",
              "applied",
              "interviewing",
              "offered",
              "rejected",
            ] as StatusFilter[]
          ).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`capitalize px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? "bg-white text-black"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto pb-3">
          <table className="w-full text-left border-collapse text-xs relative">
            <thead>
              <tr className="border-b border-white/5 bg-[#050505] text-slate-400 select-none">
                {/* COMPANY HEADER */}
                <th className="py-3.5 px-6 font-medium relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === "company" ? null : "company",
                      )
                    }
                    className="flex items-center gap-1 hover:text-white transition-colors w-full text-left"
                  >
                    Company {renderSortArrow("company")}
                  </button>
                  {openDropdown === "company" && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-6 top-12 z-20 w-44 bg-[#121212] border border-white/10 rounded-xl shadow-2xl py-1.5 flex flex-col text-xs"
                    >
                      <button
                        onClick={() => handleSelectSort("company", "asc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        A to Z
                      </button>
                      <button
                        onClick={() => handleSelectSort("company", "desc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        Z to A
                      </button>
                    </div>
                  )}
                </th>

                {/* ROLE HEADER */}
                <th className="py-3.5 px-6 font-medium relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === "role" ? null : "role")
                    }
                    className="flex items-center gap-1 hover:text-white transition-colors w-full text-left"
                  >
                    Role {renderSortArrow("role")}
                  </button>
                  {openDropdown === "role" && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-6 top-12 z-20 w-44 bg-[#121212] border border-white/10 rounded-xl shadow-2xl py-1.5 flex flex-col text-xs"
                    >
                      <button
                        onClick={() => handleSelectSort("role", "asc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        A to Z
                      </button>
                      <button
                        onClick={() => handleSelectSort("role", "desc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        Z to A
                      </button>
                    </div>
                  )}
                </th>

                {/* STATUS HEADER */}
                <th className="py-3.5 px-6 font-medium relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === "status" ? null : "status",
                      )
                    }
                    className="flex items-center gap-1 hover:text-white transition-colors w-full text-left"
                  >
                    Status {renderSortArrow("status")}
                  </button>
                  {openDropdown === "status" && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-6 top-12 z-20 w-52 bg-[#121212] border border-white/10 rounded-xl shadow-2xl py-1.5 flex flex-col text-xs"
                    >
                      <button
                        onClick={() => handleSelectSort("status", "asc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        Offered First
                      </button>
                      <button
                        onClick={() => handleSelectSort("status", "desc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        Interviewing First
                      </button>
                    </div>
                  )}
                </th>

                {/* APPLIED DATE HEADER */}
                <th className="py-3.5 px-6 font-medium relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === "date" ? null : "date")
                    }
                    className="flex items-center gap-1 hover:text-white transition-colors w-full text-left"
                  >
                    Applied Date {renderSortArrow("date")}
                  </button>
                  {openDropdown === "date" && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-6 top-12 z-20 w-44 bg-[#121212] border border-white/10 rounded-xl shadow-2xl py-1.5 flex flex-col text-xs"
                    >
                      <button
                        onClick={() => handleSelectSort("date", "desc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        Newest First
                      </button>
                      <button
                        onClick={() => handleSelectSort("date", "asc")}
                        className="text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white"
                      >
                        Oldest First
                      </button>
                    </div>
                  )}
                </th>

                <th className="py-3.5 px-6 font-medium text-right w-1 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredAndSortedApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No applications match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredAndSortedApplications.map((app) => {
                  const statusKey = (
                    app.status in STATUS_COLORS ? app.status : "unknown"
                  ) as ApplicationStatus;
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-4 px-6 font-medium text-white">
                        {app.company}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{app.role}</td>
                      <td className="py-4 px-6">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            onStatusChange(
                              app.id,
                              e.target.value as ApplicationStatus,
                            )
                          }
                          className={`capitalize px-2.5 py-1 rounded-lg border text-[11px] font-medium bg-[#050505] focus:outline-none cursor-pointer ${
                            STATUS_COLORS[statusKey]
                          }`}
                        >
                          <option value="applied">Applied</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offered">Offered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{app.date}</td>
                      <td className="py-4 px-6 text-right w-1 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(app)}
                            className="p-1 text-slate-400 hover:text-white text-xs font-medium"
                            title="Edit application"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(app)}
                            className="p-1 text-red-400 hover:text-red-300 text-xs font-medium"
                            title="Delete application"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
