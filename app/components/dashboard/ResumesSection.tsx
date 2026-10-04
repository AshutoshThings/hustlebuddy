"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@/app/hooks/useApiClient";
import ConfirmModal from "@/app/components/dashboard/ConfirmModal";

type Resume = {
  id: number;
  file_name: string;
  file_path: string;
  role_targeted: string;
  notes: string;
  extracted_keywords: string[];
  created_at: string;
};

export default function ResumesSection() {
  const api = useApiClient();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [roleTargeted, setRoleTargeted] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Preview Modal State
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);

  // Custom Delete Modal States
  const [deletingResume, setDeletingResume] = useState<Resume | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const data = await api.getResumes();
      setResumes(data.resumes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role_targeted", roleTargeted || "General");
    formData.append("notes", notes);

    try {
      const data = await api.uploadResume(formData);
      setResumes((current) => [data.resume, ...current]);
      setFile(null);
      setRoleTargeted("");
      setNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to upload resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingResume) return;
    setIsDeleting(true);
    setError(null);

    try {
      await api.deleteResume(deletingResume.id);
      setResumes((current) =>
        current.filter((r) => r.id !== deletingResume.id),
      );
      setDeletingResume(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete resume");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="text-xs text-slate-500 p-4">Loading resumes...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h2 className="text-lg font-medium text-white mb-1">
          Tailored Resumes
        </h2>
        <p className="text-xs text-slate-400">
          Upload tailored versions, keep track of notes, and preview documents.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Upload Form with Notes */}
      <form
        onSubmit={handleUpload}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
      >
        <h3 className="text-sm font-medium text-white">Upload New Resume</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Target Role / Version Name
            </label>
            <input
              type="text"
              placeholder="e.g. Backend Engineer"
              value={roleTargeted}
              onChange={(e) => setRoleTargeted(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Resume File (PDF)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-white file:text-black hover:file:bg-slate-200 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Notes / Description
          </label>
          <textarea
            placeholder="Add any specific context, version notes, or focus areas..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isUploading || !file}
            className="px-4 py-2 text-xs font-medium bg-white text-black rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload Resume"}
          </button>
        </div>
      </form>

      {/* Resumes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resumes.length === 0 ? (
          <div className="col-span-2 text-center py-12 border border-dashed border-white/10 rounded-2xl text-xs text-slate-500">
            No resumes uploaded yet.
          </div>
        ) : (
          resumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-white truncate">
                    {resume.role_targeted || "General Resume"}
                  </h4>
                  <button
                    onClick={() => setDeletingResume(resume)}
                    className="text-slate-500 hover:text-red-400 text-xs"
                    title="Delete resume"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-slate-500 truncate mb-2">
                  {resume.file_name}
                </p>

                {resume.notes && (
                  <p className="text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl mb-3 italic">
                    "{resume.notes}"
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Array.isArray(resume.extracted_keywords) &&
                    resume.extracted_keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5"
                      >
                        {kw}
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                <span className="text-[10px] text-slate-600">
                  Added {new Date(resume.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setViewingResume(resume)}
                  className="text-white hover:underline text-xs font-medium bg-white/10 px-3 py-1 rounded-lg"
                >
                  View Resume
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PDF View Modal */}
      {viewingResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#050505]">
              <h3 className="text-sm font-medium text-white">
                {viewingResume.role_targeted} — {viewingResume.file_name}
              </h3>
              <button
                onClick={() => setViewingResume(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 bg-black p-2">
              <iframe
                src={viewingResume.file_path}
                className="w-full h-full rounded-xl border-0"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingResume && (
        <ConfirmModal
          title="Delete Resume"
          message={
            <>
              Are you sure you want to permanently delete the resume for{" "}
              <span className="text-white font-medium">
                {deletingResume.role_targeted || deletingResume.file_name}
              </span>
              ? This will remove the file permanently from storage.
            </>
          }
          itemName={deletingResume.role_targeted || deletingResume.file_name}
          onClose={() => setDeletingResume(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
