"use client";

type ProductSeasonalBadgeProps = {
  isSeasonal?: boolean;
  isRefrigerated?: boolean;
  className?: string;
};

export function ProductSeasonalBadge({ isSeasonal = true, isRefrigerated = false, className = "" }: ProductSeasonalBadgeProps) {
  if (isRefrigerated) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 ${className}`}>
        <span>🧊</span>
        <span>Refrigerado</span>
      </span>
    );
  }

  if (!isSeasonal) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 ${className}`}>
        <span>📅</span>
        <span>Fuera de temporada</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-[var(--gd-color-sprout)]/30 text-[var(--gd-color-forest)] border border-[var(--gd-color-leaf)]/30 ${className}`}>
      <span>🌱</span>
      <span>De temporada</span>
    </span>
  );
}

