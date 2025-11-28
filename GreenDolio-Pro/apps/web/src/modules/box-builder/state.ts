"use client";

import { useEffect, useState } from "react";

export type BuilderState = {
  boxId?: string;
  variant?: "mix" | "fruity" | "veggie"; // Variante de caja seleccionada
  mix?: "mix" | "frutas" | "vegetales";
  extras: string[];
  likes: string[];
  dislikes: string[];
  notes: string;
  highlightedProducts: string[];
  selectedProducts: Record<string, number>;
  deliveryZone?: string;
  deliveryDay?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

const STORAGE_KEY = "gd-box-builder";

export function useBoxBuilderState() {
  const [state, setState] = useState<BuilderState>(() => {
    try {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          extras: [],
          likes: [],
          dislikes: [],
          notes: "",
          highlightedProducts: [],
          ...parsed,
          selectedProducts: parsed.selectedProducts ?? {},
          contactName: parsed.contactName ?? "",
          contactEmail: parsed.contactEmail ?? "",
          contactPhone: parsed.contactPhone ?? "",
        };
      }
    } catch (error) {
      console.warn("Unable to load builder state", error);
    }
    return {
      extras: [],
      likes: [],
      dislikes: [],
      notes: "",
      highlightedProducts: [],
      selectedProducts: {},
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    };
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return {
    state,
    updateState: (partial: Partial<BuilderState>) => setState((prev) => ({ ...prev, ...partial })),
    resetState: () =>
      setState({
        extras: [],
        likes: [],
        dislikes: [],
        notes: "",
        highlightedProducts: [],
        selectedProducts: {},
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      }),
  };
}
