"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useApiClient } from "@/app/hooks/useApiClient";
import { Application } from "@/app/types/application";
import { signupSchema } from "@/app/lib/validationSchema"; // <--- Import validation schema

type SettingsSectionProps = {
  applications: Application[];
  onRefreshData?: () => void;
};

type UserProfile = {
  id?: string;
  name?: string;
  email?: string;
  [key: string]: any;
};

export default function SettingsSection({
  applications,
  onRefreshData,
}: SettingsSectionProps) {
  const { logout } = useAuth();
  const api = useApiClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [defaultView, setDefaultView] = useState<"kanban" | "table">("kanban");
  const [modalError, setModalError] = useState<string | null>(null);

  // Change Password Modal & Step States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [step, setStep] = useState<
    "request_otp" | "verify_otp" | "new_password"
  >("request_otp");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedView = localStorage.getItem("default_view_mode") as
      | "kanban"
      | "table";
    if (savedView) {
      setDefaultView(savedView);
    }

    api
      .getUserProfile()
      .then((data) => {
        setProfile(data.user || data);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDefaultView = (view: "kanban" | "table") => {
    setDefaultView(view);
    localStorage.setItem("default_view_mode", view);
    showToast("Default view preference saved!");
  };

  const handleResetKanbanThemes = () => {
    localStorage.removeItem("kanban_column_themes");
    showToast("Kanban column colors reset to default.");
  };

  const handleExportData = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(applications, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `hustlebuddy_backup_${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Application data exported successfully!");
  };

  // 1. Request Password Reset OTP via real backend route
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) {
      showToast("User email not found");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.response || "Failed to send OTP");

      showToast("OTP sent to your registered email address!");
      setStep("verify_otp");
    } catch (err: any) {
      showToast(err.message || "Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Transition from OTP entry to new password entry
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setStep("new_password");
  };

  // 3. Submit OTP and New Password with Zod validation check
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !otp.trim() || !profile?.email) return;
    setModalError(null);

    // Validate password strength using Zod schema locally inside the modal
    const passwordCheck = signupSchema.shape.password.safeParse(newPassword);
    if (!passwordCheck.success) {
      setModalError(passwordCheck.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.response || "Failed to update password");

      showToast("Password updated successfully!");
      setShowPasswordModal(false);
      setStep("request_otp");
      setOtp("");
      setNewPassword("");
      setModalError(null);
    } catch (err: any) {
      setModalError(
        err.message || "Failed to update password. Check your OTP.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black text-xs px-4 py-3 rounded-xl shadow-2xl font-medium animate-fade-in">
          {toastMessage}
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold text-white tracking-wide">
          Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your account profile, security credentials, and dashboard
          preferences.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <h2 className="text-sm font-medium text-white">Account Profile</h2>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        {isLoadingProfile ? (
          <div className="text-xs text-slate-500 py-4">
            Loading user profile...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">User Name</label>
              <div className="bg-[#050505] border border-white/10 px-3 py-2 rounded-xl text-slate-300 font-medium capitalize">
                {profile?.name || profile?.username || "User"}
              </div>
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Email Address</label>
              <div className="bg-[#050505] border border-white/10 px-3 py-2 rounded-xl text-slate-300 font-medium">
                {profile?.email || "user@domain.com"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Credentials Card */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-white pb-2 border-b border-white/5">
          Security & Password
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white">
              Change Account Password
            </p>
            <p className="text-[11px] text-slate-400">
              Update your security password via email OTP verification.
            </p>
          </div>
          <button
            onClick={() => {
              setStep("request_otp");
              setShowPasswordModal(true);
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-colors border border-white/10"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-white pb-2 border-b border-white/5">
          Dashboard Preferences
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white">Default Board View</p>
            <p className="text-[11px] text-slate-400">
              Choose which layout opens by default when you load the dashboard.
            </p>
          </div>
          <div className="bg-[#050505] border border-white/10 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => handleSaveDefaultView("kanban")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                defaultView === "kanban"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => handleSaveDefaultView("table")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                defaultView === "table"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Table
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-white">
              Kanban Column Colors
            </p>
            <p className="text-[11px] text-slate-400">
              Reset your customized column background colors back to default.
            </p>
          </div>
          <button
            onClick={handleResetKanbanThemes}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-colors border border-white/10"
          >
            Reset Theme Colors
          </button>
        </div>
      </div>

      {/* Data Management Card */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-sm font-medium text-white pb-2 border-b border-white/5">
          Data Management & Backup
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white">
              Export Applications Backup
            </p>
            <p className="text-[11px] text-slate-400">
              Download all your job applications metadata as a local JSON file.
            </p>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-medium transition-colors shadow-sm"
          >
            Export JSON Backup
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-medium text-white">
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white text-xs font-medium"
              >
                ✕
              </button>
            </div>

            {step === "request_otp" && (
              <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                <p className="text-xs text-slate-400">
                  We will send a verification code (OTP) to{" "}
                  <span className="text-white font-medium">
                    {profile?.email || "your email"}
                  </span>
                  .
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  {isSubmitting ? "Sending OTP..." : "Send Verification OTP"}
                </button>
              </form>
            )}

            {step === "verify_otp" && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <p className="text-xs text-slate-400">
                  Enter the 6-digit OTP sent to your email.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-[#050505] border border-white/10 px-3 py-2 rounded-xl text-white text-sm tracking-widest text-center focus:outline-none focus:border-white/30"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  {isSubmitting ? "Verifying..." : "Continue"}
                </button>
              </form>
            )}

            {step === "new_password" && (
              <form
                onSubmit={handleUpdatePassword}
                className="flex flex-col gap-4"
              >
                <p className="text-xs text-slate-400">
                  Enter your new secure password (8+ chars with uppercase,
                  lowercase, number, and special symbol).
                </p>
                {modalError && (
                  <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl text-center">
                    {modalError}
                  </div>
                )}
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#050505] border border-white/10 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-white/30"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
