"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/modules/cart/context";
import type { Box, BoxRule } from "@/modules/catalog/types";
import { calculateVariantComposition, getVariantInfo, getVisualCategory, type VariantType } from "./helpers";
import { useState } from "react";
import { useTranslation } from "@/modules/i18n/use-translation";
import { useCatalog } from "@/modules/catalog/context";

type BoxPreviewProps = {
  box: Box;
  variant: VariantType;
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  boxRule?: BoxRule;
  onBack: () => void;
  onChangeVariant: () => void;
};

export function BoxPreview({ box, variant, baseContents, boxRule, onBack, onChangeVariant }: BoxPreviewProps) {
  const { addItem } = useCart();
  const { locale, t, tData } = useTranslation();
  const { productMap } = useCatalog();
  const [isAdded, setIsAdded] = useState(false);

  const variantData = box.variants.find((item) => item.id === variant || item.slug === variant);
  const info = getVariantInfo(variant, locale, variantData);
  const composition = calculateVariantComposition(baseContents);

  // Agrupar productos por categoría visual
  const contentsByCategory = baseContents.reduce((acc, item) => {
    const product = productMap.get(item.productSlug);
    const category = getVisualCategory(item.productSlug, item.name, product?.categoryId);
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof baseContents>);

  const categoryLabels: Record<string, { icon: string; label: string }> = {
    aromatic: { icon: "🌶️", label: t("variants.categories.aromatic") },
    leafy: { icon: "🥬", label: t("variants.categories.leafy") },
    fruit_large: { icon: "🍎", label: t("variants.categories.fruit") },
    fruit_small: { icon: "🍎", label: t("variants.categories.fruit") },
    root: { icon: "🥔", label: t("variants.categories.root") },
    citrus: { icon: "🍊", label: t("variants.categories.citrus") },
  };

  const handleAddToCart = () => {
    addItem({
      slug: `${box.slug}-${variant}`,
      type: "box",
      name: `${tData(box.name)} (${variant.toUpperCase()})`,
      quantity: 1,
      price: box.price.amount,
      slotValue: 0,
      weightKg: 0,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const boxImage = box.heroImage || "/images/boxes/placeholder.jpg";

  // Calcular balance visual (simplificado)
  const getBalancePercentage = (current: number, min: number, max: number): number => {
    const range = max - min;
    const position = current - min;
    return Math.min(100, Math.max(0, (position / range) * 100));
  };

  const categoryBudget = boxRule?.categoryBudget ?? {};

  return (
    <section className="box-preview space-y-8">
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] transition-colors flex items-center gap-2 mx-auto"
        >
          {t("box_preview.back_variants")}
        </button>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--gd-color-forest)] mb-2">
          {t("box_preview.box_ready")}
        </h2>
      </div>

      <div className="preview-card rounded-3xl border-2 border-[var(--gd-color-leaf)]/50 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagen */}
          <div className="relative h-64 lg:h-full min-h-[300px] rounded-2xl overflow-hidden bg-[var(--color-background-muted)]">
            <Image
              src={boxImage}
              alt={`${tData(box.name)} ${info.tagline}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain object-center p-8"
            />
          </div>

          {/* Info principal */}
          <div className="box-info space-y-6">
            <div>
              <h3 className="font-display text-3xl font-bold text-[var(--gd-color-forest)] mb-2">
                {info.icon} {tData(box.name)} ({variant.toUpperCase()})
              </h3>
              <p className="text-sm text-[var(--color-muted)] mb-1">
                ⏱️ {box.durationDays} {t("boxes.duration_days")} • ♻️ {t("box_preview.returnable")}
              </p>
              <p className="text-base font-semibold text-[var(--gd-color-leaf)] italic">
                {info.tagline}
              </p>
            </div>

            <div className="stats space-y-2">
              <p className="text-sm text-[var(--color-foreground)]">
                ✓ {composition.total} {t("box_preview.fresh_products")}
              </p>
              <p className="text-sm text-[var(--color-foreground)]">
                📊 {t("box_preview.balance")} {variant === "mix" ? t("box_preview.balance_perfect") : variant === "fruity" ? t("box_preview.balance_tropical") : t("box_preview.balance_green")}
              </p>
            </div>

            {/* Balance visual */}
            <div className="balance-bars space-y-3 pt-4 border-t border-[var(--gd-color-leaf)]/20">
              <h4 className="text-sm font-bold text-[var(--gd-color-forest)] uppercase mb-3">
                {t("box_preview.category_balance")}
              </h4>
              {[
                { key: "aromatic", label: `🌶️ ${t("variants.categories.aromatic")}`, current: composition.aromatic },
                { key: "leafy", label: `🥬 ${t("variants.categories.leafy")}`, current: composition.leafy },
                { key: "fruit", label: `🍎 ${t("variants.categories.fruit")}`, current: composition.fruit },
                { key: "root", label: `🥔 ${t("variants.categories.root")}`, current: composition.root },
                { key: "citrus", label: `🍊 ${t("variants.categories.citrus")}`, current: composition.citrus },
              ].map(({ key, label, current }) => {
                const budget = categoryBudget[key as keyof typeof categoryBudget];
                if (!budget) return null;
                const percentage = getBalancePercentage(current, budget.min, budget.max);
                const color = percentage >= 50 ? "bg-[var(--gd-color-leaf)]" : percentage >= 25 ? "bg-yellow-500" : "bg-red-400";

                return (
                  <div key={key} className="bar space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-foreground)]">{label}</span>
                      <span className="font-semibold text-[var(--gd-color-forest)]">
                        {current}/{budget.max}
                      </span>
                    </div>
                    <div className="progress h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${color}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contenido base resumido */}
            <div className="contents pt-4 border-t border-[var(--gd-color-leaf)]/20">
              <h4 className="text-sm font-bold text-[var(--gd-color-forest)] uppercase mb-3">
                {t("box_preview.includes")}
              </h4>
              <div className="space-y-2">
                {Object.entries(contentsByCategory).map(([category, items]) => {
                  const label = categoryLabels[category] || { icon: "📦", label: t("variants.categories.others") };
                  return (
                    <div key={category} className="category flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                      <span>{label.icon}</span>
                      <span className="font-medium">{label.label}:</span>
                      <span className="text-[var(--color-muted)]">
                        {items.slice(0, 3).map((i) => i.name).join(", ")}
                        {items.length > 3 && ` +${items.length - 3} ${t("box_preview.more")}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20">
              <p className="text-center">
                <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">{t("box_customize.price")}</span>
                <span className="block font-display text-4xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent mt-2">
                  RD${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                </span>
              </p>
            </div>

            {/* Acciones */}
            <div className="actions space-y-3 pt-4">
              <button
                type="button"
                onClick={onChangeVariant}
                className="w-full rounded-2xl border-2 border-[var(--gd-color-leaf)] bg-white/90 px-4 py-3 text-sm font-semibold text-[var(--gd-color-forest)] transition-all duration-300 hover:bg-[var(--gd-color-sprout)]/80 hover:border-[var(--gd-color-forest)]"
              >
                {t("box_preview.change_variant")}
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className={`w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 ${isAdded
                    ? "bg-[var(--gd-color-leaf)]"
                    : "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:scale-105 hover:shadow-2xl"
                  }`}
              >
                {isAdded ? (
                  <>
                    <span className="text-xl">✓</span>
                    <span>{t("box_preview.added_to_cart")}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">✅</span>
                    <span>{t("box_preview.add_to_cart")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Personalización opcional */}

          </div>
        </div>
      </div>
    </section>
  );
}
