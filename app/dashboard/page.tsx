"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useApiClient } from "@/app/hooks/useApiClient";
import { useApplicationStream } from "@/app/hooks/useApplicationStream";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { Application, ApplicationStatus } from "@/app/types/application";

import Sidebar from "@/app/components/dashboard/Sidebar";
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import KanbanBoard from "@/app/components/dashboard/KanbanBoard";
import TableView from "@/app/components/dashboard/TableView";
import NewApplicationForm from "@/app/components/dashboard/NewApplicationForm";
import ConfirmModal from "@/app/components/dashboard/ConfirmModal";
import ResumesSection from "@/app/components/dashboard/ResumesSection";
import SettingsSection from "@/app/components/dashboard/SettingsSection";
import { errorMessage } from "@/app/lib/errorMessage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toApplication(row: any): Application {
  return {
    id: String(row.id),
    company: row.company,
    role: row.role,
    status: row.status,
    date: formatAppliedAt(row.applied_at || row.created_at || new Date()),
  };
}

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
  // Starts at the default saved in Settings; switching here doesn't change it.
  const [savedView] = useLocalStorage("default_view_mode");
  const [chosenView, setViewMode] = useState<"kanban" | "table" | null>(null);
  const viewMode = chosenView ?? (savedView === "table" ? "table" : "kanban");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { accessToken, loading: authLoading } = useAuth();
  const api = useApiClient();

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
        const apps: Application[] = (data.applications || []).map(toApplication);

        setApplications(apps);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [authLoading, accessToken, router, api]);

  // 2. Live updates: applications saved elsewhere (another tab, device, or
  // the extension) appear without a reload.
  useApplicationStream(Boolean(accessToken), {
    onApplication: (row) => {
      const newApp = toApplication(row);
      setApplications((prev) =>
        prev.some((app) => app.id === newApp.id) ? prev : [newApp, ...prev],
      );
    },
    onResync: () => {
      api
        .getApplications()
        .then((data) =>
          setApplications((data.applications || []).map(toApplication)),
        )
        .catch(() => {});
    },
  });

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
    } catch (err) {
      setError(errorMessage(err, "Failed to update application status"));
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
    } catch (err) {
      setError(errorMessage(err, "Failed to delete application"));
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
