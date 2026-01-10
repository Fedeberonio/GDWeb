"use client";

import { useMemo, useState, useEffect } from "react";
import { getBoxRule } from "@/modules/box-builder/utils";
import productMetadata from "@/data/productMetadata.json";

type BalanceChartProps = {
  boxId: string;
  selectedProducts: Record<string, number>;
};

type CategoryCount = {
  category: string;
  current: number;
  min: number;
  max: number;
  label: string;
  icon: string;
  color: string;
};

export function BalanceChart({ boxId, selectedProducts }: BalanceChartProps) {
  const rule = getBoxRule(boxId);
  const categoryBudget = useMemo(() => rule?.categoryBudget ?? {}, [rule]);

  const categoryCounts = useMemo<CategoryCount[]>(() => {
    const counts: Record<string, number> = {
      leafy: 0,
      fruit_large: 0,
      aromatic: 0,
      root: 0,
      citrus: 0,
    };

    // Contar productos por categoría
    Object.entries(selectedProducts).forEach(([slug, quantity]) => {
      if (!quantity || quantity <= 0) return;
      const meta = productMetadata.find((p) => p.slug === slug);
      if (!meta) return;

      // Mapear categorías del producto a las categorías de la caja
      const productCategory = meta.category?.toLowerCase() || "";
      if (productCategory.includes("hoja") || productCategory.includes("leafy") || productCategory.includes("lechuga") || productCategory.includes("espinaca")) {
        counts.leafy += quantity;
      } else if (productCategory.includes("fruta") || productCategory.includes("fruit") || productCategory.includes("mango") || productCategory.includes("piña")) {
        counts.fruit_large += quantity;
      } else if (productCategory.includes("aromática") || productCategory.includes("aromatic") || productCategory.includes("hierba") || productCategory.includes("ajo")) {
        counts.aromatic += quantity;
      } else if (productCategory.includes("raíz") || productCategory.includes("root") || productCategory.includes("tubérculo") || productCategory.includes("papa") || productCategory.includes("yuca")) {
        counts.root += quantity;
      } else if (productCategory.includes("cítrico") || productCategory.includes("citrus") || productCategory.includes("limón") || productCategory.includes("naranja")) {
        counts.citrus += quantity;
      }
    });

    const labels: Record<string, { label: string; icon: string; color: string }> = {
      leafy: { label: "Hojas", icon: "🥬", color: "bg-green-500" },
      fruit_large: { label: "Frutas", icon: "🍎", color: "bg-red-500" },
      aromatic: { label: "Aromáticas", icon: "🌿", color: "bg-yellow-500" },
      root: { label: "Raíces", icon: "🥔", color: "bg-amber-600" },
      citrus: { label: "Cítricos", icon: "🍋", color: "bg-yellow-400" },
    };

    return Object.entries(categoryBudget).map(([category, budget]) => {
      const typedBudget = budget as { min: number; max: number };
      const info = labels[category] || { label: category.replace(/_/g, " "), icon: "📦", color: "bg-gray-500" };
      return {
        category,
        current: counts[category] || 0,
        min: typedBudget.min,
        max: typedBudget.max,
        ...info,
      };
    });
  }, [selectedProducts, categoryBudget]);

  const getStatusColor = (current: number, min: number, max: number) => {
    if (current < min) return "bg-red-500";
    if (current > max) return "bg-orange-500";
    return "bg-[var(--gd-color-leaf)]";
  };

  const getStatusText = (current: number, min: number, max: number) => {
    if (current < min) return "Falta";
    if (current > max) return "Exceso";
    return "Perfecto";
  };

  // Calcular si todas las categorías están en balance perfecto
  const isPerfectlyBalanced = useMemo(() => {
    return categoryCounts.every((cat) => cat.current >= cat.min && cat.current <= cat.max);
  }, [categoryCounts]);

  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isPerfectlyBalanced && categoryCounts.length > 0) {
      const showTimer = setTimeout(() => setShowCelebration(true), 0);
      const hideTimer = setTimeout(() => setShowCelebration(false), 3000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isPerfectlyBalanced, categoryCounts.length]);

  return (
      <div className="space-y-4 rounded-2xl border-2 border-[var(--gd-color-leaf)]/30 bg-gradient-to-br from-white to-[var(--gd-color-sprout)]/10 p-6 relative overflow-hidden">
      {/* Mensaje de celebración */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-[var(--gd-color-leaf)]/20 flex items-center justify-center z-10 animate-pulse">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-[var(--gd-color-leaf)] text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-display text-xl font-bold text-[var(--gd-color-forest)]">
              ¡Balance Perfecto!
            </p>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Tu caja está equilibrada y lista
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🌱</span>
        <h3 className="font-display text-lg font-bold text-[var(--gd-color-forest)]">Balance de tu caja</h3>
        {isPerfectlyBalanced && (
          <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-[var(--gd-color-leaf)] text-white animate-pulse">
            ✓ Perfecto
          </span>
        )}
      </div>
      <div className="space-y-4">
        {categoryCounts.map((cat) => {
          const percentage = cat.max > 0 ? Math.min((cat.current / cat.max) * 100, 100) : 0;
          const statusColor = getStatusColor(cat.current, cat.min, cat.max);
          const statusText = getStatusText(cat.current, cat.min, cat.max);

          return (
            <div key={cat.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-semibold text-[var(--color-foreground)]">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full transition-all ${
                    statusText === "Perfecto" 
                      ? "bg-gradient-to-r from-green-400 to-[var(--gd-color-leaf)] text-white shadow-sm" 
                      : statusText === "Falta"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {statusText}
                  </span>
                  <span className="text-xs text-[var(--color-muted)] font-medium">
                    {cat.current} / {cat.min}-{cat.max}
                  </span>
                </div>
              </div>
              <div className="relative h-4 rounded-full bg-[var(--color-background-muted)] overflow-hidden shadow-inner">
                {/* Rango objetivo (zona verde) */}
                <div
                  className="absolute h-full bg-gradient-to-r from-[var(--gd-color-leaf)]/30 to-[var(--gd-color-leaf)]/40 border-l-2 border-r-2 border-[var(--gd-color-leaf)]/50"
                  style={{
                    left: `${(cat.min / cat.max) * 100}%`,
                    width: `${((cat.max - cat.min) / cat.max) * 100}%`,
                  }}
                />
                {/* Valor actual con animación */}
                <div
                  className={`absolute h-full ${statusColor} transition-all duration-500 ease-out shadow-sm ${
                    statusText === "Perfecto" ? "animate-pulse" : ""
                  }`}
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
                {/* Marcador de mínimo */}
                {cat.current < cat.min && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
                    style={{ left: `${(cat.min / cat.max) * 100}%` }}
                  />
                )}
                {/* Marcador de máximo */}
                {cat.current > cat.max && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-orange-500 z-10"
                    style={{ left: `${(cat.max / cat.max) * 100}%` }}
                  />
                )}
                {/* Indicador de posición actual */}
                {cat.current > 0 && (
                  <div
                    className="absolute top-0 h-full w-1 bg-white/80 z-20 shadow-sm"
                    style={{ left: `${Math.min(percentage, 100)}%` }}
                  />
                )}
              </div>
              {cat.current < cat.min && (
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ Necesitas al menos {cat.min} {cat.label.toLowerCase()}
                </p>
              )}
              {cat.current > cat.max && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠️ Máximo {cat.max} {cat.label.toLowerCase()} permitidos
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--gd-color-leaf)]/20">
        <p className="text-xs text-[var(--color-muted)]">
          <strong className="text-[var(--gd-color-forest)]">💡 Tip:</strong> Mantén el balance dentro del rango recomendado para una caja equilibrada y deliciosa. <span className="text-sm">✨</span>
        </p>
      </div>
    </div>
  );
}
