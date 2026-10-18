"use client";

import {
  useContext,
  createContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";

type AuthContextType = {
  accessToken: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const initialRefresh = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (!initialRefresh.current) {
      initialRefresh.current = fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => (data?.accessToken as string | undefined) ?? null)
        .catch(() => null);
    }
    initialRefresh.current.then((token) => {
      if (token) setAccessToken(token);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        loading,
        login: (token) => setAccessToken(token),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
