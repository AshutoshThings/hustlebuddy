"use client";

import { useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { refreshSession } from "@/app/lib/refreshSession";

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function useApiClient() {
  const { accessToken, login, logout } = useAuth();
  // Rebuilt only when the session changes, so it is safe in effect deps.
  return useMemo(
    () => createClient(accessToken, login, logout),
    [accessToken, login, logout],
  );
}

function createClient(
  accessToken: string | null,
  login: (token: string) => void,
  logout: () => Promise<void>,
) {
  async function request(
    path: string,
    options: RequestInit = {},
    tokenOverride?: string,
    retried = false,
    // Each endpoint returns its own JSON shape; callers read what they need.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const token = tokenOverride ?? accessToken;

    // Check if the body is a FormData instance
    const isFormData = options.body instanceof FormData;

    const res = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Only set application/json if it's NOT FormData
        ...(!isFormData && options.body
          ? { "Content-Type": "application/json" }
          : {}),
      },
    });

    if (res.status === 401 && !retried) {
      const newToken = await refreshSession();
      if (newToken) {
        login(newToken);
        return request(path, options, newToken, true);
      }

      logout();
      throw new Error("Session expired");
    }

    const body = await parseJson(res);

    if (!res.ok) {
      throw new Error(body?.response || "Request failed");
    }

    return body;
  }

  return {
    getApplications: () => request("/api/applications"),

    createApplication: (data: object) =>
      request("/api/applications", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateApplication: (id: string, data: object) =>
      request(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    deleteApplication: (id: string) =>
      request(`/api/applications/${id}`, {
        method: "DELETE",
      }),

    getResumes: () => request("/api/resumes"),

    uploadResume: (formData: FormData) =>
      request("/api/resumes", {
        method: "POST",
        body: formData,
      }),

    deleteResume: (id: number) =>
      request(`/api/resumes/${id}`, {
        method: "DELETE",
      }),
    getUserProfile: () => request("/api/user"),
    logoutUser: () => request("/api/auth/logout", { method: "POST" }),
  };
}
