"use client";

import { useState } from "react";
import Image from "next/image";
import type { Box } from "@/modules/catalog/types";
import { useScrollFadeStagger } from "./use-scroll-fade";
import { BoxVariantsDisplay } from "./box-variants-display";
import { QuickAddModal } from "./quick-add-modal";
import { BoxCustomizeModal } from "./box-customize-modal";
import { getBoxRule } from "@/modules/box-builder/utils";
import type { Product } from "@/modules/catalog/types";
import type { VariantType } from "./box-selector/helpers";

type BoxesGridProps = {
  boxes: Box[];
  prebuiltBoxes: Array<{
    box: Box;
    baseContents: Array<{
      productSlug: string;
      quantity: number;
      name: string;
    }>;
  }>;
  products: Product[];
};

const BOX_SKU_MAP: Record<string, string> = {
  "box-1": "GD-CAJA-001",
  "box-2": "GD-CAJA-002",
  "box-3": "GD-CAJA-003",
  "box-1-caribbean-fresh-pack-3-dias": "GD-CAJA-001",
  "box-2-island-weekssential-1-semana": "GD-CAJA-002",
  "box-3-allgreenxclusive-2-semanas": "GD-CAJA-003",
  "caribbean-fresh-pack": "GD-CAJA-001",
  "island-weekssential": "GD-CAJA-002",
  "allgreenxclusive": "GD-CAJA-003",
};

// Datos hardcodeados para evitar dependencia del archivo JSON externo
const BOX_DETAILS_BY_SKU: Record<string, { dimensions?: string; weight?: string }> = {
  "GD-CAJA-001": {
    dimensions: "8\" x 8\" x 8\"",
    weight: "7.7 lb (3.5 kg)",
  },
  "GD-CAJA-002": {
    dimensions: "10\" x 10\" x 10\"",
    weight: "13.2 lb (6 kg)",
  },
  "GD-CAJA-003": {
    dimensions: "12\" x 12\" x 12\"",
    weight: "26.4 lb (12 kg)",
  },
};

export function BoxesGrid({ boxes, prebuiltBoxes, products }: BoxesGridProps) {
  const [quickAddBox, setQuickAddBox] = useState<Box | null>(null);
  const [customizeBox, setCustomizeBox] = useState<Box | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantType>>({});
  const { getItemProps } = useScrollFadeStagger<HTMLDivElement>(boxes.length, {
    threshold: 0.1,
    rootMargin: "50px",
    delay: 100,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
      {boxes.map((box, index) => {
        const productImages: Record<string, string> = {
          "box-1": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "box-2": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "box-3": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
          "box-1-caribbean-fresh-pack-3-dias": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "box-2-island-weekssential-1-semana": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "box-3-allgreenxclusive-2-semanas": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
          "caribbean-fresh-pack": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "island-weekssential": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "allgreenxclusive": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
        };

        const hoverImages: Record<string, string> = {
          "box-1": "/images/boxes/box-1-caribbean-fresh-pack-veggie-topdown.png",
          "box-2": "/images/boxes/box-2-island-weekssential-veggie-topdown.png",
          "box-3": "/images/boxes/box-3-allgreenxclusive-veggie-topdown.png",
          "box-1-caribbean-fresh-pack-3-dias": "/images/boxes/box-1-caribbean-fresh-pack-veggie-topdown.png",
          "box-2-island-weekssential-1-semana": "/images/boxes/box-2-island-weekssential-veggie-topdown.png",
          "box-3-allgreenxclusive-2-semanas": "/images/boxes/box-3-allgreenxclusive-veggie-topdown.png",
          "caribbean-fresh-pack": "/images/boxes/box-1-caribbean-fresh-pack-veggie-topdown.png",
          "island-weekssential": "/images/boxes/box-2-island-weekssential-veggie-topdown.png",
          "allgreenxclusive": "/images/boxes/box-3-allgreenxclusive-veggie-topdown.png",
        };

        const boxImage =
          productImages[box.id] ||
          productImages[box.slug] ||
          box.heroImage ||
          "/images/boxes/placeholder.jpg";
        const boxHoverImage = hoverImages[box.id] || hoverImages[box.slug] || null;
        const hasHoverImage = boxHoverImage !== null;

        const boxSizeConfig: Record<string, { scale: string; padding: string }> = {
          "box-1": { scale: "1.0", padding: "p-2" },
          "box-2": { scale: "1.1", padding: "p-2" },
          "box-3": { scale: "1.15", padding: "p-2" },
        };

        const boxNumber = box.id.replace("box-", "") || String(index + 1);
        const config =
          boxSizeConfig[box.id] ||
          boxSizeConfig[`box-${boxNumber}`] ||
          { scale: "0.85", padding: "p-6" };

        const itemProps = getItemProps(index);
        const sku = BOX_SKU_MAP[box.slug] || BOX_SKU_MAP[box.id];
        const boxDetails = sku ? BOX_DETAILS_BY_SKU[sku] : undefined;

        return (
          <article
            key={box.id}
            {...itemProps}
            className={`group relative flex h-full flex-col overflow-hidden rounded-[32px] border-2 border-[var(--gd-color-leaf)]/50 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white shadow-2xl transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_30px_60px_rgba(45,80,22,0.25)] hover:border-[var(--gd-color-leaf)] hover:scale-[1.02] ${itemProps.className}`}
            style={itemProps.style}
          >
            {/* Efecto de brillo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gd-color-leaf)]/0 via-transparent to-[var(--gd-color-sky)]/0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
            
            {/* Imagen de la caja - Ocupa todo el espacio disponible */}
            <div className="relative h-80 w-full overflow-hidden bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white rounded-t-[28px]">
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  hasHoverImage ? "group-hover:opacity-0" : "group-hover:scale-[1.05]"
                } ${config.padding}`}
                style={{ transform: `scale(${config.scale})` }}
              >
                <Image
                  src={boxImage}
                  alt={box.name.es}
                  fill
                  sizes="(max-width:768px) 100vw, 400px"
                  className="object-contain object-center"
                />
              </div>
              {hasHoverImage && (
                <div
                  className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${config.padding}`}
                  style={{ transform: `scale(${config.scale})` }}
                >
                  <Image
                    src={boxHoverImage}
                    alt={`${box.name.es} - Vista cenital`}
                    fill
                    sizes="(max-width:768px) 100vw, 400px"
                    className="object-contain object-center"
                  />
                </div>
              )}
              {/* Badges superiores */}
              <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/95 to-[var(--gd-color-avocado)]/95 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                  <span>{box.durationDays ? `${box.durationDays} días` : "Flexible"}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--gd-color-forest)]/95 to-[var(--gd-color-leaf)]/95 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  <span>♻️</span>
                  <span>Retornable</span>
                </div>
              </div>
            </div>
            {/* Contenido de la tarjeta - Muy compacto para dar más espacio a la imagen */}
            <div className="flex flex-1 flex-col p-3 space-y-2">
              {/* Nombre de la caja */}
              <div className="text-center">
                <h3 className="font-display text-lg font-bold text-[var(--color-foreground)] mb-1">
                  {box.name.es}
                </h3>
                {box.description?.es && (
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed line-clamp-2">
                  {box.description.es}
                  </p>
                )}
                {(boxDetails?.dimensions || boxDetails?.weight) && (
                  <div className="mt-3 flex flex-wrap justify-center gap-3 text-[0.65rem] text-[var(--color-muted)]">
                    {boxDetails.dimensions && (
                      <div className="flex flex-col items-center">
                        <span className="text-[0.55rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)]">
                          Tamaño
                        </span>
                        <span>{boxDetails.dimensions}</span>
                      </div>
                    )}
                    {boxDetails.weight && (
                      <div className="flex flex-col items-center">
                        <span className="text-[0.55rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)]">
                          Peso aprox.
                        </span>
                        <span>{boxDetails.weight}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Variantes siempre visibles - Colapsadas inicialmente */}
              {(() => {
                const boxData = prebuiltBoxes.find((pb) => pb.box.id === box.id);
                const baseContents = boxData?.baseContents ?? [];
                if (baseContents.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--gd-color-forest)] text-center">
                      Variantes disponibles:
                    </p>
                    <BoxVariantsDisplay
                      baseContents={baseContents}
                      boxId={box.id}
                      compact={true}
                      initialVariant={selectedVariants[box.id]}
                      onVariantSelect={(variant) =>
                        setSelectedVariants((prev) => ({ ...prev, [box.id]: variant }))
                      }
                    />
                  </div>
                );
              })()}

              {/* Precio */}
              <div className="relative rounded-xl bg-gradient-to-br from-[var(--gd-color-leaf)]/40 via-[var(--gd-color-sprout)]/50 to-[var(--gd-color-avocado)]/30 p-4 border-2 border-[var(--gd-color-leaf)]/40 shadow-lg">
                <div className="relative z-10 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--gd-color-forest)] font-bold mb-1">
                    Precio
                  </p>
                  <p className="font-display text-3xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-white to-[var(--gd-color-forest)] bg-clip-text text-transparent">
                    RD${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-1.5 pt-1 relative z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const boxData = prebuiltBoxes.find((pb) => pb.box.id === box.id);
                    if (boxData?.baseContents && boxData.baseContents.length > 0) {
                      setQuickAddBox(box);
                    } else {
                      // Si no hay baseContents, redirigir directamente a personalizar
                      window.location.href = `/armar?box=${box.id}`;
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg relative z-20"
                >
                  <span>🛒</span>
                  <span>Agregar al carrito</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const boxData = prebuiltBoxes.find((pb) => pb.box.id === box.id);
                    if (boxData?.baseContents && boxData.baseContents.length > 0) {
                      setCustomizeBox(box);
                    } else {
                      // Si no hay baseContents, redirigir al builder
                      window.location.href = `/armar?box=${box.id}`;
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-[var(--gd-color-leaf)] bg-white px-4 py-2 text-xs font-semibold text-[var(--gd-color-forest)] transition-all duration-300 hover:bg-[var(--gd-color-sprout)]/20 hover:border-[var(--gd-color-forest)] relative z-20"
                >
                  <span>✏️</span>
                  <span>Personalizar</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
      </div>
      
      {/* Modal de compra rápida */}
      {quickAddBox && (() => {
        const boxData = prebuiltBoxes.find((pb) => pb.box.id === quickAddBox.id);
        const baseContents = boxData?.baseContents ?? [];
        
        // Obtener la imagen de la caja (misma que en la tarjeta)
        const productImages: Record<string, string> = {
          "box-1": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "box-2": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "box-3": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
          "box-1-caribbean-fresh-pack-3-dias": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "box-2-island-weekssential-1-semana": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "box-3-allgreenxclusive-2-semanas": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
          "caribbean-fresh-pack": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "island-weekssential": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "allgreenxclusive": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
        };
        
        const boxImage =
          productImages[quickAddBox.id] ||
          productImages[quickAddBox.slug] ||
          quickAddBox.heroImage ||
          "/images/boxes/placeholder.jpg";
        
        // Obtener dimensiones y peso
        const sku = BOX_SKU_MAP[quickAddBox.slug] || BOX_SKU_MAP[quickAddBox.id];
        const boxDetails = sku ? BOX_DETAILS_BY_SKU[sku] : undefined;
        
        return (
          <QuickAddModal
            box={quickAddBox}
            baseContents={baseContents}
            boxImage={boxImage}
            dimensions={boxDetails?.dimensions}
            weight={boxDetails?.weight}
            onClose={() => setQuickAddBox(null)}
            onCustomize={() => {
              setQuickAddBox(null);
              setCustomizeBox(quickAddBox);
            }}
          />
        );
      })()}

      {/* Modal de personalización */}
      {customizeBox && (() => {
        const boxData = prebuiltBoxes.find((pb) => pb.box.id === customizeBox.id);
        const baseContents = boxData?.baseContents ?? [];
        const rule = getBoxRule(customizeBox.id);
        
        // Obtener la imagen de la caja (misma que en la tarjeta)
        const productImages: Record<string, string> = {
          "box-1": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "box-2": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "box-3": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
          "box-1-caribbean-fresh-pack-3-dias": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "box-2-island-weekssential-1-semana": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "box-3-allgreenxclusive-2-semanas": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
          "caribbean-fresh-pack": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
          "island-weekssential": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
          "allgreenxclusive": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
        };
        
        const boxImage =
          productImages[customizeBox.id] ||
          productImages[customizeBox.slug] ||
          customizeBox.heroImage ||
          "/images/boxes/placeholder.jpg";
        
        // Obtener dimensiones y peso
        const sku = BOX_SKU_MAP[customizeBox.slug] || BOX_SKU_MAP[customizeBox.id];
        const boxDetails = sku ? BOX_DETAILS_BY_SKU[sku] : undefined;
        
        return (
          <BoxCustomizeModal
            box={customizeBox}
            baseContents={baseContents}
            boxImage={boxImage}
            dimensions={boxDetails?.dimensions}
            weight={boxDetails?.weight}
            availableProducts={products}
            slotBudget={rule?.slotBudget}
            initialVariant={selectedVariants[customizeBox.id]}
            onClose={() => setCustomizeBox(null)}
            onAddToCart={() => {
              setCustomizeBox(null);
            }}
          />
        );
      })()}
    </div>
  );
}
