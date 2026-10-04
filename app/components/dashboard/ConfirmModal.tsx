"use client";

type ConfirmModalProps = {
  title?: string;
  message?: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

export default function ConfirmModal({
  title = "Delete Application",
  message,
  itemName,
  onClose,
  onConfirm,
  isDeleting,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {message || (
            <>
              Are you sure you want to delete your application for{" "}
              <span className="text-white font-medium">{itemName}</span>? This
              action cannot be undone.
            </>
          )}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
