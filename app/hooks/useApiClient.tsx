"use client";

import { useAuth } from "@/app/context/AuthContext";

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function useApiClient() {
  const { accessToken, login, logout } = useAuth();

  async function request(
    path: string,
    options: RequestInit = {},
    tokenOverride?: string,
    retried = false,
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
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();

        if (data?.accessToken) {
          login(data.accessToken);

          return request(path, options, data.accessToken, true);
        }
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

    requestPasswordOtp: () =>
      request("/api/auth/request-password-otp", { method: "POST" }),

    updatePassword: (otp: string, newPassword: string) =>
      request("/api/auth/update-password", {
        method: "POST",
        body: JSON.stringify({ otp, newPassword }),
      }),
    logoutUser: () => request("/api/auth/logout", { method: "POST" }),
  };
}
