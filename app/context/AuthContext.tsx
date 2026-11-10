"use client";

import {
  useContext,
  createContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { refreshSession } from "@/app/lib/refreshSession";

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
      initialRefresh.current = refreshSession();
    }
    initialRefresh.current.then((token) => {
      if (token) setAccessToken(token);
      setLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
    setAccessToken(null);
  }, []);

  const login = useCallback((token: string) => setAccessToken(token), []);

  // Stable between renders, so consumers can list these in effect deps.
  const value = useMemo(
    () => ({ accessToken, loading, login, logout }),
    [accessToken, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
