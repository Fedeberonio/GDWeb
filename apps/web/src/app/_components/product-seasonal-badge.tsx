"use client";

import { Calendar, Leaf, Package } from "lucide-react";
import { useTranslation } from "@/modules/i18n/use-translation";

type ProductSeasonalBadgeProps = {
  isSeasonal?: boolean;
  isRefrigerated?: boolean;
  className?: string;
};

export function ProductSeasonalBadge({ isSeasonal = true, isRefrigerated = false, className = "" }: ProductSeasonalBadgeProps) {
  const { t } = useTranslation();
  
  if (isRefrigerated) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 ${className}`}>
        <Package className="w-4 h-4" />
        <span>{t("catalog.refrigerated")}</span>
      </span>
    );
  }

  if (!isSeasonal) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 ${className}`}>
        <Calendar className="w-4 h-4" />
        <span>{t("catalog.out_of_season")}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-[var(--gd-color-sprout)]/30 text-[var(--gd-color-forest)] border border-[var(--gd-color-leaf)]/30 ${className}`}>
      <Leaf className="w-4 h-4" />
      <span>{t("catalog.seasonal")}</span>
    </span>
  );
}
