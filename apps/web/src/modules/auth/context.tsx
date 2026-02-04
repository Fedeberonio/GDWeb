"use client";

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  type User,
} from "firebase/auth";

import { getFirebaseAuth, googleAuthProvider } from "@/lib/firebase";
import { getFirestoreDb } from "@/lib/firebase/client";
import { createUserProfile, getUserProfile } from "@/modules/user/firestore";
import { UserProvider } from "@/modules/user/context";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmailPassword: (email: string, password: string) => Promise<boolean>;
  signupWithEmailPassword: (email: string, password: string, displayName?: string) => Promise<boolean>;
  clearError: () => void;
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

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, googleAuthProvider);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmailPassword = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      setLoading(true);
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateFirebaseProfile(credential.user, { displayName });
      }
      const db = getFirestoreDb();
      if (!db) throw new Error("Firebase no disponible");
      const existingProfile = await getUserProfile(db, credential.user.uid);
      if (!existingProfile) {
        await createUserProfile(db, credential.user.uid, {
          displayName: displayName ?? "",
          email,
        });
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar la cuenta";
      setError(message);
      return false;
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

  const clearError = () => {
    setError(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      loginWithGoogle,
      loginWithEmailPassword,
      signupWithEmailPassword,
      clearError,
      logout,
    }),
    [user, loading, error],
  );

  return (
    <AuthContext.Provider value={value}>
      <UserProvider user={user}>{children}</UserProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
