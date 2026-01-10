"use client";

import { useState } from "react";
import type { Box } from "@/modules/catalog/types";
import { calculateVariantComposition, getVariantInfo, type VariantType } from "./helpers";

type VariantSelectorProps = {
  box: Box;
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  onSelectVariant: (variant: VariantType) => void;
  onBack: () => void;
};

export function VariantSelector({ box, baseContents, onSelectVariant, onBack }: VariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);

  const variants: VariantType[] = ["mix", "fruity", "veggie"];

  const handleVariantChange = (variant: VariantType) => {
    setSelectedVariant(variant);
  };

  const handleContinue = () => {
    if (selectedVariant) {
      onSelectVariant(selectedVariant);
    }
  };

  return (
    <section className="variant-selector space-y-8">
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] transition-colors flex items-center gap-2 mx-auto"
        >
          ← Volver a tamaños
        </button>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--gd-color-forest)] mb-2">
          ¿Qué variante prefieres?
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          Para tu {box.name.es} ({box.durationDays} días)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {variants.map((variant) => {
          const info = getVariantInfo(variant);
          const composition = calculateVariantComposition(baseContents);
          const isSelected = selectedVariant === variant;

          return (
            <label
              key={variant}
              className={`variant-card group relative flex flex-col rounded-3xl border-2 transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "border-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/40 shadow-2xl scale-[1.02]"
                  : "border-[var(--gd-color-leaf)]/30 bg-white hover:border-[var(--gd-color-leaf)] hover:shadow-xl"
              }`}
            >
              <input
                type="radio"
                name="variant"
                value={variant}
                checked={isSelected}
                onChange={() => handleVariantChange(variant)}
                className="sr-only"
                required
              />
              
              <div className="card-content p-6 space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-3">{info.icon}</div>
                  <h3 className="font-display text-2xl font-bold text-[var(--gd-color-forest)] mb-1">
                    {variant.toUpperCase()}
                  </h3>
                  <p className="text-sm font-semibold text-[var(--gd-color-leaf)] uppercase tracking-wide">
                    {info.tagline}
                  </p>
                </div>

                <p className="text-sm text-[var(--color-muted)] text-center leading-relaxed">
                  {info.description}
                </p>

                <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20 space-y-2">
                  <ul className="space-y-1.5 text-xs text-[var(--color-foreground)]">
                    <li className="flex items-center justify-between">
                      <span>🌶️ Aromáticas</span>
                      <span className="font-semibold">{composition.aromatic}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🥬 Hojas verdes</span>
                      <span className="font-semibold">{composition.leafy}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🍎 Frutas</span>
                      <span className="font-semibold">{composition.fruit}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🥔 Raíces</span>
                      <span className="font-semibold">{composition.root}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>🍊 Cítricos</span>
                      <span className="font-semibold">{composition.citrus}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20">
                  <p className="text-center">
                    <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Total</span>
                    <span className="block font-display text-2xl font-bold text-[var(--gd-color-forest)] mt-1">
                      {composition.total} productos
                    </span>
                  </p>
                  <p className="text-center mt-2 font-display text-xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent">
                    RD${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Indicador de selección */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--gd-color-leaf)] flex items-center justify-center text-white font-bold">
                  ✓
                </div>
              )}
            </label>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedVariant}
          className={`px-8 py-4 rounded-2xl text-base font-bold text-white shadow-xl transition-all duration-300 ${
            selectedVariant
              ? "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:scale-105 hover:shadow-2xl cursor-pointer"
              : "bg-gray-400 cursor-not-allowed opacity-50"
          }`}
        >
          Continuar →
        </button>
      </div>
    </section>
  );
}
