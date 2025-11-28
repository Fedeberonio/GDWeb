"use client";

import { useState } from "react";

type PriceInfoTooltipProps = {
  label: string;
  info: string;
  children: React.ReactNode;
};

export function PriceInfoTooltip({ label, info, children }: PriceInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center gap-1 cursor-help"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        <span className="text-[var(--color-muted)] text-xs">ℹ️</span>
      </div>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-lg border border-[var(--gd-color-leaf)]/30 bg-white p-3 shadow-xl text-xs text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--gd-color-forest)] mb-1">{label}</p>
          <p>{info}</p>
          <div className="absolute bottom-0 left-4 transform translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--gd-color-leaf)]/30" />
          </div>
        </div>
      )}
    </div>
  );
}

