"use client";

import { createContext, useContext } from "react";
import { useBoxBuilderState, type BuilderState } from "./state";

type BoxBuilderContextValue = {
  state: BuilderState;
  updateState: (partial: Partial<BuilderState>) => void;
  resetState: () => void;
};

const BoxBuilderContext = createContext<BoxBuilderContextValue | undefined>(undefined);

export function BoxBuilderProvider({ children }: { children: React.ReactNode }) {
  const value = useBoxBuilderState();
  return <BoxBuilderContext.Provider value={value}>{children}</BoxBuilderContext.Provider>;
}

export function useBoxBuilder() {
  const context = useContext(BoxBuilderContext);
  if (!context) {
    throw new Error("useBoxBuilder must be used within a BoxBuilderProvider");
  }
  return context;
}
