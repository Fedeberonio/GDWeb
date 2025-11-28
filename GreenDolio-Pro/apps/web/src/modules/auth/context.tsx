"use client";

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";

import { getFirebaseAuth, googleAuthProvider } from "@/lib/firebase";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        setUser(firebaseUser);
        setLoading(false);
        setError(null);
      });
      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar Firebase";
      setError(message);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cerrar sesión";
      setError(message);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, loginWithGoogle, logout }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
