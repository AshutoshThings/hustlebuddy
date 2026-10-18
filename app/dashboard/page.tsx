"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useApiClient } from "@/app/hooks/useApiClient";
import { Application, ApplicationStatus } from "@/app/types/application";

import Sidebar from "@/app/components/dashboard/Sidebar";
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import KanbanBoard from "@/app/components/dashboard/KanbanBoard";
import TableView from "@/app/components/dashboard/TableView";
import NewApplicationForm from "@/app/components/dashboard/NewApplicationForm";
import ConfirmModal from "@/app/components/dashboard/ConfirmModal";
import ResumesSection from "@/app/components/dashboard/ResumesSection";
import SettingsSection from "@/app/components/dashboard/SettingsSection";

function formatAppliedAt(value: string | Date): string {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation tab state ("board", "resumes", or "settings")
  const [activeTab, setActiveTab] = useState<"board" | "resumes" | "settings">(
    "board",
  );

  // View mode state inside the board tab ("kanban" or "table")
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { accessToken, loading: authLoading } = useAuth();
  const api = useApiClient();

  // Load user default view mode preference on mount
  useEffect(() => {
    const savedView = localStorage.getItem("default_view_mode") as
      | "kanban"
      | "table";
    if (savedView) {
      setViewMode(savedView);
    }
  }, []);

  // 1. Initial Fetch on Mount & Auth Check
  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      router.replace("/auth");
      return;
    }

    api
      .getApplications()
      .then((data) => {
        const apps: Application[] = (data.applications || []).map(
          (row: any) => ({
            id: String(row.id),
            company: row.company,
            role: row.role,
            status: row.status,
            date: formatAppliedAt(
              row.applied_at || row.created_at || new Date(),
            ),
          }),
        );

        setApplications(apps);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [authLoading, accessToken, router]);

  // 2. Real-Time Server-Sent Events (SSE) Stream Listener with Token Query Parameter
  useEffect(() => {
    if (!accessToken) return;

    // Pass accessToken as a query parameter to bypass EventSource header limitations and 401 errors
    const eventSource = new EventSource(
      `/api/applications/stream?token=${accessToken}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const rawApp = JSON.parse(event.data);
        const newApp: Application = {
          id: String(rawApp.id),
          company: rawApp.company,
          role: rawApp.role,
          status: rawApp.status,
          date: formatAppliedAt(
            rawApp.applied_at || rawApp.created_at || new Date(),
          ),
        };

        setApplications((prev) => {
          // Prevent duplicates if already present in state
          if (prev.some((app) => app.id === newApp.id)) return prev;
          return [newApp, ...prev]; // Prepend new entry instantly without refreshing!
        });
      } catch (err) {
        console.error("Failed to parse real-time event stream payload:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [accessToken]);

  const handleStatusChange = async (
    appId: string,
    newStatus: ApplicationStatus,
  ) => {
    setError(null);
    try {
      const data = await api.updateApplication(appId, { status: newStatus });
      const updatedRow = data.application;

      setApplications((current) =>
        current.map((app) =>
          app.id === appId ? { ...app, status: updatedRow.status } : app,
        ),
      );
    } catch (err: any) {
      setError(err.message || "Failed to update application status");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingApp) return;
    setIsDeleting(true);
    setError(null);

    try {
      await api.deleteApplication(deletingApp.id);
      setApplications((current) =>
        current.filter((app) => app.id !== deletingApp.id),
      );
      setDeletingApp(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete application");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-black">
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === "board" ? (
            <>
              <DashboardHeader
                onOpenForm={() => setShowCreateForm(true)}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {error}
                </div>
              )}

              {viewMode === "kanban" ? (
                <KanbanBoard
                  applications={applications}
                  onEdit={(app) => setEditingApp(app)}
                  onDelete={(app) => setDeletingApp(app)}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <TableView
                  applications={applications}
                  onEdit={(app) => setEditingApp(app)}
                  onDelete={(app) => setDeletingApp(app)}
                  onStatusChange={handleStatusChange}
                />
              )}
            </>
          ) : activeTab === "resumes" ? (
            <ResumesSection />
          ) : (
            <SettingsSection applications={applications} />
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateForm && (
        <NewApplicationForm
          onClose={() => setShowCreateForm(false)}
          onSaved={(newApp) => {
            setApplications((current) => [...current, newApp]);
            setShowCreateForm(false);
          }}
        />
      )}

      {editingApp && (
        <NewApplicationForm
          initialData={editingApp}
          onClose={() => setEditingApp(null)}
          onSaved={(updatedApp) => {
            setApplications((current) =>
              current.map((app) =>
                app.id === updatedApp.id ? updatedApp : app,
              ),
            );
            setEditingApp(null);
          }}
        />
      )}

      {deletingApp && (
        <ConfirmModal
          itemName={deletingApp.company}
          onClose={() => setDeletingApp(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
