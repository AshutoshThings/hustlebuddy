"use client";

import { useState } from "react";
import { Application, ApplicationStatus } from "@/app/types/application";
import { useApiClient } from "@/app/hooks/useApiClient";

type NewApplicationFormProps = {
  initialData?: Application | null; // <--- If present, we are editing!
  onClose: () => void;
  onSaved: (app: Application) => void; // <--- Generic handler for created or updated
};

function formatAppliedAt(value: string | Date): string {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function NewApplicationForm({
  initialData,
  onClose,
  onSaved,
}: NewApplicationFormProps) {
  const api = useApiClient();
  const isEditing = Boolean(initialData);

  // Initialize state with initialData if editing, or defaults if creating
  const [formData, setFormData] = useState({
    company: initialData?.company || "",
    role: initialData?.role || "",
    status: (initialData?.status || "applied") as ApplicationStatus,
    source: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let row;
      if (isEditing && initialData) {
        // Call PATCH endpoint
        const data = await api.updateApplication(initialData.id, formData);
        row = data.application;
      } else {
        // Call POST endpoint
        const data = await api.createApplication(formData);
        row = data.application;
      }

      const savedApp: Application = {
        id: String(row.id),
        company: row.company,
        role: row.role,
        status: row.status,
        date: formatAppliedAt(row.applied_at || new Date()),
      };

      onSaved(savedApp);
    } catch (err: any) {
      setError(err.message || "Failed to save application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? "Edit Application" : "New Application"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Company
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Google"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Role
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Software Engineer Intern"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as ApplicationStatus,
                })
              }
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 capitalize"
            >
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium bg-white text-black rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
