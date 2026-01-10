"use client";

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

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

const CartContext = createContext<CartContextValue | null>(null);

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
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

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
