"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type PropsWithChildren,
} from "react";
import type { User } from "firebase/auth";

import { getFirestoreDb } from "@/lib/firebase/client";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  syncCartToFirestore,
} from "./firestore";
import type { UserProfile as UserProfileType, CartItemFromFirestore } from "./types";

type UserContextValue = {
  profile: UserProfileType | null;
  loading: boolean;
  isNewUser: boolean;
  updateProfile: (updates: Partial<UserProfileType>) => Promise<void>;
  syncCart: (cart: CartItemFromFirestore[]) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

const stripUndefined = <T extends Record<string, unknown>>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as Partial<T>;

type UserProviderProps = PropsWithChildren<{
  user: User | null;
}>;

export function UserProvider({ children, user }: UserProviderProps) {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setIsNewUser(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestoreDb();
      const userProfile = await getUserProfile(db, user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      setProfile(null);
      setIsNewUser(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const updateProfile = async (updates: Partial<UserProfileType>) => {
    if (!user) throw new Error("Usuario no autenticado");

    try {
      const db = getFirestoreDb();
      const cleanedUpdates = stripUndefined(updates);
      if (Object.keys(cleanedUpdates).length === 0) {
        return;
      }
      if (isNewUser && !profile) {
        // Crear nuevo perfil
        const newProfile: Omit<UserProfileType, "fechaCreacion"> = {
          displayName: user.displayName || "",
          email: user.email || "",
          ...cleanedUpdates,
        };
        await createUserProfile(db, user.uid, newProfile);
        setProfile(newProfile as UserProfileType);
        setIsNewUser(false);
      } else {
        // Actualizar perfil existente
        await updateUserProfile(db, user.uid, cleanedUpdates);
        setProfile((prev) => (prev ? { ...prev, ...cleanedUpdates } : null));
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      throw error;
    }
  };

  const syncCart = async (cart: CartItemFromFirestore[]) => {
    if (!user) return;
    const db = getFirestoreDb();
    await syncCartToFirestore(db, user.uid, cart);
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const value = useMemo<UserContextValue>(
    () => ({
      profile,
      loading,
      isNewUser,
      updateProfile,
      syncCart,
      refreshProfile,
    }),
    [profile, loading, isNewUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe usarse dentro de un UserProvider");
  }
  return context;
}
