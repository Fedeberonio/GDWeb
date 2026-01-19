"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/modules/cart/context";
import type { Box } from "@/modules/catalog/types";
import { getVariantInfo, type VariantType } from "./box-selector/helpers";
import { BoxVariantsDisplay } from "./box-variants-display";
import { useTranslation } from "@/modules/i18n/use-translation";

// Componente selector de variante para el flujo guiado
function VariantSelector({
  baseContents,
  variants,
  onSelectVariant,
}: {
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  variants?: Box["variants"];
  onSelectVariant: (variant: VariantType) => void;
}) {
  const { t } = useTranslation();
  return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-[var(--color-muted)]">
            💡 <strong className="text-[var(--gd-color-forest)]">{t("guided_flow.tip")}</strong> {t("guided_flow.variant_tip")}
          </p>
        </div>
      <BoxVariantsDisplay 
        baseContents={baseContents} 
        boxVariants={variants}
        compact={false} 
        onVariantSelect={onSelectVariant}
      />
    </div>
  );
}

type GuidedBoxFlowProps = {
  boxes: Box[];
  prebuiltBoxes: Array<{
    box: Box;
    baseContents: Array<{
      productSlug: string;
      quantity: number;
      name: string;
    }>;
  }>;
  onClose: () => void;
};

type FlowStep = "size" | "variant" | "preview" | "customize";

export function GuidedBoxFlow({ boxes, prebuiltBoxes, onClose }: GuidedBoxFlowProps) {
  const [step, setStep] = useState<FlowStep>("size");
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const { t, tData, locale } = useTranslation();

  // Ordenar cajas por días
  const sortedBoxes = [...boxes].sort((a, b) => (a.durationDays || 0) - (b.durationDays || 0));

  const baseContents = selectedBox
    ? prebuiltBoxes.find((pb) => pb.box.id === selectedBox.id)?.baseContents ?? []
    : [];

  const handleSelectSize = (box: Box) => {
    setSelectedBox(box);
    setSelectedVariant(null); // Resetear variante al cambiar de caja
    setStep("variant");
  };

  const handleAddToCart = () => {
    if (!selectedBox || !selectedVariant) return;
    const selectedVariantData = selectedBox.variants.find((item) => item.id === selectedVariant || item.slug === selectedVariant);
    const selectedVariantInfo = getVariantInfo(selectedVariant, locale, selectedVariantData);
    setIsAdding(true);
    addItem({
      slug: `${selectedBox.slug}-${selectedVariant}`,
      type: "box",
      name: `${selectedBox.name.es} (${selectedVariantInfo.tagline || selectedVariant.toUpperCase()})`,
      quantity: 1,
      price: selectedBox.price.amount,
      slotValue: 0,
      weightKg: 0,
    });
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 1000);
  };

  const handleCustomize = () => {
    if (!selectedBox) return;
    window.location.href = `/armar?box=${selectedBox.id}&variant=${selectedVariant}`;
  };

  const boxImage = selectedBox?.heroImage || "/images/boxes/placeholder.jpg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl my-8">
        {/* Header con progreso */}
        <div className="sticky top-0 z-10 bg-white border-b-2 border-[var(--gd-color-leaf)]/20 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
              {step === "size" && t("guided_flow.step1_title")}
              {step === "variant" && t("guided_flow.step2_title")}
              {step === "preview" && t("guided_flow.step3_title")}
              {step === "customize" && t("guided_flow.customize_title")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-[var(--gd-color-sprout)]/20 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${step !== "size" ? "bg-[var(--gd-color-leaf)]" : "bg-[var(--gd-color-leaf)]/30"}`} />
            <div className={`flex-1 h-2 rounded-full ${step === "preview" || step === "customize" ? "bg-[var(--gd-color-leaf)]" : "bg-[var(--gd-color-leaf)]/30"}`} />
            <div className={`flex-1 h-2 rounded-full ${step === "preview" || step === "customize" ? "bg-[var(--gd-color-leaf)]" : "bg-[var(--gd-color-leaf)]/30"}`} />
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="p-6">
          {/* Paso 1: Elegir tamaño */}
          {step === "size" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-[var(--color-muted)] mb-2">
                  💡 <strong className="text-[var(--gd-color-forest)]">{t("guided_flow.tip")}</strong> {t("guided_flow.size_tip")}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sortedBoxes.map((box) => (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => handleSelectSize(box)}
                    className="group relative rounded-2xl border-2 border-[var(--gd-color-leaf)]/50 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white p-6 text-left transition-all duration-300 hover:border-[var(--gd-color-leaf)] hover:shadow-xl hover:scale-[1.02]"
                  >
                    <div className="text-center space-y-3">
                      <div className="text-5xl mb-2">📦</div>
                      <h3 className="font-display text-xl font-bold text-[var(--gd-color-forest)]">
                        {box.durationDays} {t("guided_flow.days")}
                      </h3>
                      <p className="text-sm font-semibold text-[var(--gd-color-leaf)]">
                        {tData(box.name)}
                      </p>
                      <div className="pt-3 border-t border-[var(--gd-color-leaf)]/30">
                        <p className="text-xs text-[var(--color-muted)] mb-1">{t("guided_flow.price")}</p>
                        <p className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
                          RD${box.price.amount.toLocaleString("es-DO")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Elegir variante */}
          {step === "variant" && selectedBox && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <button
                  type="button"
                  onClick={() => setStep("size")}
                  className="text-sm text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] mb-4 inline-flex items-center gap-2"
                >
                  {t("guided_flow.back_sizes")}
                </button>
                <p className="text-sm text-[var(--color-muted)] mb-2">
                  💡 <strong className="text-[var(--gd-color-forest)]">{t("guided_flow.tip")}</strong> {t("guided_flow.variant_tip")}
                </p>
                <h3 className="font-display text-xl font-bold text-[var(--gd-color-forest)]">
                  {tData(selectedBox.name)} ({selectedBox.durationDays} {t("boxes.duration_days")})
                </h3>
              </div>
              
              <VariantSelector
                baseContents={baseContents}
                variants={selectedBox?.variants}
                onSelectVariant={setSelectedVariant}
              />
              
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedVariant) {
                      setStep("preview");
                    } else {
                      // Si no hay variante seleccionada, usar Mix por defecto
                      setSelectedVariant("mix");
                      setStep("preview");
                    }
                  }}
                  disabled={!selectedVariant}
                  className={`px-8 py-3 rounded-full text-white font-bold shadow-xl transition-all ${
                    selectedVariant
                      ? "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:scale-105"
                      : "bg-gray-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  {t("guided_flow.continue")}
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Vista previa */}
          {step === "preview" && selectedBox && selectedVariant && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <button
                  type="button"
                  onClick={() => setStep("variant")}
                  className="text-sm text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] mb-4 inline-flex items-center gap-2"
                >
                  {t("guided_flow.back_variants")}
                </button>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--gd-color-leaf)]/20 px-4 py-2 mb-2">
                  <span className="text-xl">
                    {getVariantInfo(
                      selectedVariant,
                      locale,
                      selectedBox?.variants.find((item) => item.id === selectedVariant || item.slug === selectedVariant),
                    ).icon}
                  </span>
                  <span className="text-sm font-bold text-[var(--gd-color-forest)] uppercase">
                    {selectedVariant.toUpperCase()} - {getVariantInfo(
                      selectedVariant,
                      locale,
                      selectedBox?.variants.find((item) => item.id === selectedVariant || item.slug === selectedVariant),
                    ).tagline}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--gd-color-forest)]">
                  {t("guided_flow.box_ready")} {tData(selectedBox.name)} {t("guided_flow.is_ready")}
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {boxImage && (
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--color-background-muted)]">
                    <Image
                      src={boxImage}
                      alt={selectedBox.name.es}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-contain object-center p-6"
                    />
                  </div>
                )}
                <div className="space-y-4">
                  <div className="rounded-xl bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white p-4 border-2 border-[var(--gd-color-leaf)]/30">
                    <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
                      {t("guided_flow.summary")}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
                          {baseContents.length}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">{t("box_customize.products")}</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
                          RD${selectedBox.price.amount.toLocaleString("es-DO")}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">{t("guided_flow.price")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <BoxVariantsDisplay 
                    baseContents={baseContents} 
                    boxVariants={selectedBox?.variants}
                    compact={false}
                    onVariantSelect={(variant) => {
                      // Actualizar la variante seleccionada cuando el usuario hace clic
                      setSelectedVariant(variant);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--gd-color-leaf)]/20">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-4 text-base font-bold text-white shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isAdding ? t("guided_flow.adding") : t("guided_flow.add_to_cart")}
                </button>
                <button
                  type="button"
                  onClick={handleCustomize}
                  className="flex-1 rounded-full border-2 border-[var(--gd-color-leaf)] bg-white px-6 py-4 text-base font-semibold text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/20 transition-colors"
                >
                  {t("guided_flow.customize_products")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
