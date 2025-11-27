"use client";

import { useState } from "react";
import type { Box } from "@/modules/catalog/types";
import { BoxSizeSelector } from "./box-size-selector";
import { VariantSelector } from "./variant-selector";
import { BoxPreview } from "./box-preview";
import type { VariantType } from "./helpers";

type BoxSelectorFlowProps = {
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

type FlowStep = "size" | "variant" | "preview";

export function BoxSelectorFlow({ boxes, prebuiltBoxes, onClose }: BoxSelectorFlowProps) {
  const [step, setStep] = useState<FlowStep>("size");
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);

  const handleSelectSize = (box: Box) => {
    setSelectedBox(box);
    setStep("variant");
  };

  const handleSelectVariant = (variant: VariantType) => {
    setSelectedVariant(variant);
    setStep("preview");
  };

  const handleBackToVariants = () => {
    setStep("variant");
  };

  const handleBackToSizes = () => {
    setSelectedBox(null);
    setSelectedVariant(null);
    setStep("size");
  };

  const handleChangeVariant = () => {
    setSelectedVariant(null);
    setStep("variant");
  };

  if (!selectedBox && step !== "size") {
    return null;
  }

  const baseContents = selectedBox
    ? prebuiltBoxes.find((pb) => pb.box.id === selectedBox.id)?.baseContents ?? []
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white/95 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Botón cerrar */}
          <div className="mb-8 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--gd-color-forest)] shadow-lg transition-all duration-300 hover:bg-[var(--gd-color-sprout)]/80"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === "size" ? "text-[var(--gd-color-leaf)]" : "text-[var(--gd-color-forest)]"}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step === "size" ? "border-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/40" : "border-[var(--gd-color-forest)] bg-[var(--gd-color-forest)] text-white"
              }`}>
                {step !== "size" ? "✓" : "1"}
              </div>
              <span className="text-sm font-semibold">Tamaño</span>
            </div>
            <div className={`h-1 w-16 ${step !== "size" ? "bg-[var(--gd-color-forest)]" : "bg-gray-300"}`} />
            <div className={`flex items-center gap-2 ${step === "variant" ? "text-[var(--gd-color-leaf)]" : step === "preview" ? "text-[var(--gd-color-forest)]" : "text-gray-400"}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step === "variant" ? "border-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/40" : step === "preview" ? "border-[var(--gd-color-forest)] bg-[var(--gd-color-forest)] text-white" : "border-gray-300 bg-white"
              }`}>
                {step === "preview" ? "✓" : "2"}
              </div>
              <span className="text-sm font-semibold">Variante</span>
            </div>
            <div className={`h-1 w-16 ${step === "preview" ? "bg-[var(--gd-color-forest)]" : "bg-gray-300"}`} />
            <div className={`flex items-center gap-2 ${step === "preview" ? "text-[var(--gd-color-leaf)]" : "text-gray-400"}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step === "preview" ? "border-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/40" : "border-gray-300 bg-white"
              }`}>
                3
              </div>
              <span className="text-sm font-semibold">Confirmar</span>
            </div>
          </div>

          {/* Contenido del paso actual */}
          {step === "size" && <BoxSizeSelector boxes={boxes} onSelectSize={handleSelectSize} />}
          {step === "variant" && selectedBox && (
            <VariantSelector
              box={selectedBox}
              baseContents={baseContents}
              onSelectVariant={handleSelectVariant}
              onBack={handleBackToSizes}
            />
          )}
          {step === "preview" && selectedBox && selectedVariant && (
            <BoxPreview
              box={selectedBox}
              variant={selectedVariant}
              baseContents={baseContents}
              onBack={handleBackToVariants}
              onChangeVariant={handleChangeVariant}
            />
          )}
        </div>
      </div>
    </div>
  );
}

