"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/modules/cart/context";
import type { Box } from "@/modules/catalog/types";
import { calculateVariantComposition, getVariantInfo, getVisualCategory, type VariantType } from "./helpers";
import { useState } from "react";
import productMetadata from "@/data/productMetadata.json";

type BoxPreviewProps = {
  box: Box;
  variant: VariantType;
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  onBack: () => void;
  onChangeVariant: () => void;
};

export function BoxPreview({ box, variant, baseContents, onBack, onChangeVariant }: BoxPreviewProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const info = getVariantInfo(variant);
  const composition = calculateVariantComposition(baseContents);

  // Agrupar productos por categoría visual
  const contentsByCategory = baseContents.reduce((acc, item) => {
    const meta = productMetadata.find((p) => p.slug === item.productSlug);
    const category = getVisualCategory(item.productSlug, item.name, meta?.category);
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof baseContents>);

  const categoryLabels: Record<string, { icon: string; label: string }> = {
    aromatic: { icon: "🌶️", label: "Aromáticas" },
    leafy: { icon: "🥬", label: "Hojas verdes" },
    fruit_large: { icon: "🍎", label: "Frutas" },
    fruit_small: { icon: "🍎", label: "Frutas" },
    root: { icon: "🥔", label: "Raíces" },
    citrus: { icon: "🍊", label: "Cítricos" },
  };

  const handleAddToCart = () => {
    addItem({
      slug: `${box.slug}-${variant}`,
      type: "box",
      name: `${box.name.es} (${variant.toUpperCase()})`,
      quantity: 1,
      price: box.price.amount,
      slotValue: 0,
      weightKg: 0,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const boxImage =
    box.heroImage ||
    (box.id === "box-1" || box.slug.includes("caribbean")
      ? "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png"
      : box.id === "box-2" || box.slug.includes("island")
      ? "/images/boxes/box-2-island-weekssential-veggie-product.jpg"
      : "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg");

  // Calcular balance visual (simplificado)
  const getBalancePercentage = (current: number, min: number, max: number): number => {
    const range = max - min;
    const position = current - min;
    return Math.min(100, Math.max(0, (position / range) * 100));
  };

  const rule = box.id === "box-1" || box.slug.includes("caribbean")
    ? { categoryBudget: { aromatic: { min: 1, max: 2 }, leafy: { min: 1, max: 3 }, fruit_large: { min: 1, max: 2 }, root: { min: 2, max: 4 }, citrus: { min: 2, max: 4 } } }
    : box.id === "box-2" || box.slug.includes("island")
    ? { categoryBudget: { aromatic: { min: 1, max: 3 }, leafy: { min: 2, max: 4 }, fruit_large: { min: 2, max: 3 }, root: { min: 3, max: 6 }, citrus: { min: 3, max: 5 } } }
    : { categoryBudget: { aromatic: { min: 2, max: 4 }, leafy: { min: 3, max: 6 }, fruit_large: { min: 2, max: 4 }, root: { min: 4, max: 8 }, citrus: { min: 4, max: 6 } } };

  return (
    <section className="box-preview space-y-8">
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] transition-colors flex items-center gap-2 mx-auto"
        >
          ← Volver a variantes
        </button>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--gd-color-forest)] mb-2">
          ✓ Tu caja está lista
        </h2>
      </div>

      <div className="preview-card rounded-3xl border-2 border-[var(--gd-color-leaf)]/50 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagen */}
          <div className="relative h-64 lg:h-full min-h-[300px] rounded-2xl overflow-hidden bg-[var(--color-background-muted)]">
            <Image
              src={boxImage}
              alt={`${box.name.es} ${info.tagline}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain object-center p-8"
            />
          </div>

          {/* Info principal */}
          <div className="box-info space-y-6">
            <div>
              <h3 className="font-display text-3xl font-bold text-[var(--gd-color-forest)] mb-2">
                {info.icon} {box.name.es} ({variant.toUpperCase()})
              </h3>
              <p className="text-sm text-[var(--color-muted)] mb-1">
                ⏱️ {box.durationDays} días • ♻️ Retornable
              </p>
              <p className="text-base font-semibold text-[var(--gd-color-leaf)] italic">
                {info.tagline}
              </p>
            </div>

            <div className="stats space-y-2">
              <p className="text-sm text-[var(--color-foreground)]">
                ✓ {composition.total} productos frescos
              </p>
              <p className="text-sm text-[var(--color-foreground)]">
                📊 Balance: {variant === "mix" ? "Perfecto" : variant === "fruity" ? "Tropical" : "Green Power"}
              </p>
            </div>

            {/* Balance visual */}
            <div className="balance-bars space-y-3 pt-4 border-t border-[var(--gd-color-leaf)]/20">
              <h4 className="text-sm font-bold text-[var(--gd-color-forest)] uppercase mb-3">
                Balance de categorías
              </h4>
              {[
                { key: "aromatic", label: "🌶️ Aromáticas", current: composition.aromatic },
                { key: "leafy", label: "🥬 Hojas", current: composition.leafy },
                { key: "fruit", label: "🍎 Frutas", current: composition.fruit },
                { key: "root", label: "🥔 Raíces", current: composition.root },
                { key: "citrus", label: "🍊 Cítricos", current: composition.citrus },
              ].map(({ key, label, current }) => {
                const budget = rule.categoryBudget[key as keyof typeof rule.categoryBudget];
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
                Incluye:
              </h4>
              <div className="space-y-2">
                {Object.entries(contentsByCategory).map(([category, items]) => {
                  const label = categoryLabels[category] || { icon: "📦", label: "Otros" };
                  return (
                    <div key={category} className="category flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                      <span>{label.icon}</span>
                      <span className="font-medium">{label.label}:</span>
                      <span className="text-[var(--color-muted)]">
                        {items.slice(0, 3).map((i) => i.name).join(", ")}
                        {items.length > 3 && ` +${items.length - 3} más`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20">
              <p className="text-center">
                <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Precio</span>
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
                ✏️ Cambiar variante
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className={`w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 ${
                  isAdded
                    ? "bg-[var(--gd-color-leaf)]"
                    : "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:scale-105 hover:shadow-2xl"
                }`}
              >
                {isAdded ? (
                  <>
                    <span className="text-xl">✓</span>
                    <span>Agregado al carrito</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">✅</span>
                    <span>Agregar al carrito</span>
                  </>
                )}
              </button>
            </div>

            {/* Personalización opcional */}
            <div className="optional pt-4 border-t border-[var(--gd-color-leaf)]/20 text-center">
              <Link
                href="/armar"
                className="text-sm text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] transition-colors inline-flex items-center gap-2"
              >
                ✨ ¿Quieres personalizar el contenido?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
