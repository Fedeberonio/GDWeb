"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type PropsWithChildren } from "react";

import { useAuth } from "@/modules/auth/context";
import { useUser } from "@/modules/user/context";
import { cartItemsToFirestore, firestoreToCartItems } from "./firestore-sync";
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
const PERSIST_KEY = "gd_cart";

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
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 1. Initial Load & Guest Migration logic
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const persistedCart = window.localStorage.getItem(PERSIST_KEY);
      if (persistedCart) {
        const parsedPersisted = parseStoredItems(persistedCart);
        if (parsedPersisted.length > 0) {
          setItems(parsedPersisted);
          setHasInitialized(true);
          return;
        }
      }

      if (user?.uid) {
        // Logged In: Check for existing user cart
        const userKey = `${STORAGE_KEY}-${user.uid}`;
        const storedUserCart = window.localStorage.getItem(userKey);

        if (storedUserCart) {
          // Returning user with saved cart -> Restore it
          const parsed = parseStoredItems(storedUserCart);
          if (parsed.length > 0) {
            setItems(parsed);
            setHasInitialized(true);
            return;
          }
        }

        // New user OR User with empty cart -> Check for Guest Cart to migrate
        // We check sessionStorage (where guest cart lives)
        const storedGuestCart = window.sessionStorage.getItem(GUEST_STORAGE_KEY);
        if (storedGuestCart) {
          const parsedGuest = parseStoredItems(storedGuestCart);
          if (parsedGuest.length > 0) {
            // Found guest items! Migrate them to this user.
            console.log("🛒 Migrating guest cart to user cart", parsedGuest.length);
            setItems(parsedGuest);
            // We don't remove guest storage yet; let the persist effect handle overwriting the user storage
            setHasInitialized(true);
            return;
          }
        }

        // Fallback: No user cart, no guest cart
        setItems([]);
      } else {
        // Guest Mode: Load guest cart
        const stored = window.sessionStorage.getItem(GUEST_STORAGE_KEY);
        if (stored) {
          setItems(parseStoredItems(stored));
        } else {
          setItems([]);
        }
      }
      setHasInitialized(true);
    } catch {
      setHasInitialized(true);
    }
  }, [user?.uid]);

  // 2. Merge with Firestore when Profile is ready
  useEffect(() => {
    if (user && profile && hasInitialized) {
      const firestoreItems = profile.carrito ? firestoreToCartItems(profile.carrito) : [];
      if (firestoreItems.length === 0) return;

      setItems(prev => {
        // Merge strategy: Firestore takes precedence for same slugs, 
        // but guest items not in Firestore are kept.
        const merged = [...firestoreItems];
        prev.forEach(localItem => {
          if (!merged.find(m => m.slug === localItem.slug)) {
            merged.push(localItem);
          }
        });
        return merged;
      });
    }
  }, [user, profile?.carrito, hasInitialized]);

  // 3. Persist to Local Storage
  useEffect(() => {
    if (!hasInitialized) return;
    try {
      const payload = JSON.stringify(items);
      window.localStorage.setItem(PERSIST_KEY, payload);
      if (user?.uid) {
        window.localStorage.setItem(`${STORAGE_KEY}-${user.uid}`, payload);
      } else {
        window.sessionStorage.setItem(GUEST_STORAGE_KEY, payload);
      }
    } catch {
      // ignore
    }
  }, [items, user?.uid, hasInitialized]);

  // 4. Sync to Firestore
  useEffect(() => {
    // Only sync if we have a valid profile (document exists) to avoid "No document to update" race condition
    if (user && profile && !profileLoading && hasInitialized && syncCartToFirestore) {
      const firestoreCart = cartItemsToFirestore(items);
      syncCartToFirestore(firestoreCart).catch((error) => {
        console.error("Error al sincronizar carrito con Firestore:", error);
      });
    }
  }, [items, user, profile, profileLoading, hasInitialized, syncCartToFirestore]);

  const metrics = useMemo(() => calculateMetrics(items), [items]);

  const addItem = useCallback((item: CartItemInput) => {
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gd-cart-add"));
    }
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.slug === slug ? { ...item, quantity: Math.max(0, quantity) } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value: CartContextValue = useMemo(() => ({
    items,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    metrics,
  }), [items, addItem, updateQuantity, removeItem, clear, metrics]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
