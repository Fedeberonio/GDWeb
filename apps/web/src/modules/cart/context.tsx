"use client";

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { useAuth } from "@/modules/auth/context";
import { useUser } from "@/modules/user/context";
import { cartItemsToFirestore } from "./firestore-sync";
import type { CartItem, CartMetrics } from "./types";

type CartItemInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItemInput) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  metrics: CartMetrics;
};

const STORAGE_KEY = "gd-cart";
const GUEST_STORAGE_KEY = "gd-cart-guest";

const CartContext = createContext<CartContextValue | null>(null);

function parseStoredItems(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function calculateMetrics(items: CartItem[]): CartMetrics {
  return items.reduce(
    (acc, item) => {
      const unitPrice = item.configuration?.price?.final ?? item.price;
      return {
        totalSlots: acc.totalSlots + item.slotValue * item.quantity,
        totalWeightKg: acc.totalWeightKg + item.weightKg * item.quantity,
        totalCost: acc.totalCost + unitPrice * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      };
    },
    { totalSlots: 0, totalWeightKg: 0, totalCost: 0, itemCount: 0 },
  );
}

export function CartProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { profile, syncCart: syncCartToFirestore, loading: profileLoading } = useUser();
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      if (user?.uid) {
        const stored = window.localStorage.getItem(`${STORAGE_KEY}-${user.uid}`);
        if (stored) return parseStoredItems(stored);
        const legacyStored = window.localStorage.getItem(STORAGE_KEY);
        if (legacyStored) return parseStoredItems(legacyStored);
      }
      const stored = window.sessionStorage.getItem(GUEST_STORAGE_KEY);
      return parseStoredItems(stored);
    } catch {
      return [];
    }
  });

  // Cargar carrito desde Firestore cuando el usuario inicia sesión
  useEffect(() => {
    if (user && profile?.carrito && profile.carrito.length > 0) {
      // Si hay carrito en Firestore, sincronizar con localStorage
      // Nota: Por ahora mantenemos el formato actual del carrito
      // En el futuro podríamos convertir desde Firestore al formato actual
    }
  }, [user, profile?.carrito]);

  // Cargar carrito cuando cambia el usuario (guest vs logged-in)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (user?.uid) {
        const userKey = `${STORAGE_KEY}-${user.uid}`;
        const stored = window.localStorage.getItem(userKey);
        if (stored) {
          setItems(parseStoredItems(stored));
          return;
        }

        const legacyStored = window.localStorage.getItem(STORAGE_KEY);
        if (legacyStored) {
          const parsed = parseStoredItems(legacyStored);
          window.localStorage.setItem(userKey, legacyStored);
          window.localStorage.removeItem(STORAGE_KEY);
          setItems(parsed);
          return;
        }

        const guestStored = window.sessionStorage.getItem(GUEST_STORAGE_KEY);
        if (guestStored) {
          const parsed = parseStoredItems(guestStored);
          window.localStorage.setItem(userKey, guestStored);
          window.sessionStorage.removeItem(GUEST_STORAGE_KEY);
          setItems(parsed);
          return;
        }

        setItems([]);
        return;
      }

      const guestStored = window.sessionStorage.getItem(GUEST_STORAGE_KEY);
      setItems(parseStoredItems(guestStored));
    } catch {
      setItems([]);
    }
  }, [user?.uid]);

  // Guardar en storage (guest por sesión, usuario por cuenta)
  useEffect(() => {
    try {
      const payload = JSON.stringify(items);
      if (user?.uid) {
        window.localStorage.setItem(`${STORAGE_KEY}-${user.uid}`, payload);
      } else {
        window.sessionStorage.setItem(GUEST_STORAGE_KEY, payload);
      }
    } catch {
      // ignore
    }
  }, [items, user?.uid]);

  // Sincronizar con Firestore cuando el usuario está autenticado
  useEffect(() => {
    if (user && !profileLoading && syncCartToFirestore) {
      const firestoreCart = cartItemsToFirestore(items);
      syncCartToFirestore(firestoreCart).catch((error) => {
        console.error("Error al sincronizar carrito con Firestore:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, user, profileLoading]);

  const metrics = useMemo(() => calculateMetrics(items), [items]);

  const addItem = (item: CartItemInput) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.slug === item.slug);
      const quantity = item.quantity ?? 1;
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          price: item.price ?? updated[existingIndex].price,
          image: (item as { image?: string }).image ?? updated[existingIndex].image,
          configuration: item.configuration ?? updated[existingIndex].configuration,
          notes: item.notes ?? updated[existingIndex].notes,
          excludedIngredients: item.excludedIngredients ?? updated[existingIndex].excludedIngredients,
        };
        return updated;
      }
      return [
        ...prev,
        {
          slug: item.slug,
          name: item.name,
          type: item.type,
          quantity,
          slotValue: item.slotValue ?? 0,
          weightKg: item.weightKg ?? 0,
          price: item.price ?? 0,
          image: (item as { image?: string }).image,
          configuration: item.configuration,
          notes: item.notes,
          excludedIngredients: item.excludedIngredients,
        },
      ];
    });
  };

  const updateQuantity = (slug: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.slug === slug ? { ...item, quantity: Math.max(0, quantity) } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (slug: string) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  };

  const clear = () => {
    setItems([]);
  };

  const value: CartContextValue = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    metrics,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
