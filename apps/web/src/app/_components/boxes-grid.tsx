"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Box } from "@/modules/catalog/types";
import { useScrollFadeStagger } from "./use-scroll-fade";
import { BoxVariantsDisplay } from "./box-variants-display";
import { QuickAddModal } from "./quick-add-modal";
import { BoxCustomizeModal } from "./box-customize-modal";
import type { BoxRule, Product } from "@/modules/catalog/types";
import type { VariantType } from "./box-selector/helpers";
import { useTranslation } from "@/modules/i18n/use-translation";

type BoxesGridProps = {
  boxes: Box[];
  prebuiltBoxes: Array<{
    box: Box;
    rule?: BoxRule;
    baseContents: Array<{
      productSlug: string;
      quantity: number;
      name: string;
    }>;
  }>;
  products: Product[];
  boxRules: BoxRule[];
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

export function BoxesGrid({ boxes, prebuiltBoxes, products, boxRules }: BoxesGridProps) {
  const { t, tData } = useTranslation();
  const [quickAddBox, setQuickAddBox] = useState<Box | null>(null);
  const [customizeBox, setCustomizeBox] = useState<Box | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantType>>({});
  const productMap = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);
  const rulesById = useMemo(() => new Map(boxRules.map((rule) => [rule.id, rule])), [boxRules]);
  const { getItemProps } = useScrollFadeStagger<HTMLDivElement>(boxes.length, {
    threshold: 0.1,
    rootMargin: "50px",
    delay: 100,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3 pt-6">
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

          // Definir badges especiales según la caja
          const specialBadge = index === 1 ? t("boxes.badge_popular") : index === 2 ? t("boxes.badge_best_value") : null;
          const isPopular = index === 1;

          return (
            <article
              key={box.id}
              {...itemProps}
              className={`group relative flex flex-col overflow-hidden rounded-[32px] border-2 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-2 ${isPopular
                ? "border-[var(--gd-color-leaf)] ring-4 ring-[var(--gd-color-leaf)]/20"
                : "border-[var(--gd-color-leaf)]/30"
                } ${itemProps.className}`}
              style={itemProps.style}
            >
              {/* Badge especial superior */}
              {specialBadge && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className={`rounded-full px-4 py-1.5 text-[0.6rem] font-black uppercase tracking-widest shadow-lg border border-white/20 backdrop-blur-md ${isPopular
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                    }`}>
                    ⭐ {specialBadge}
                  </div>
                </div>
              )}

              {/* HEADER VISIBLE (Imagen + Titulo simple) */}
              <div className="relative z-20 bg-white">
                {/* Imagen - Altura fija */}
                <div className="relative h-64 w-full overflow-hidden bg-gradient-to-b from-[var(--gd-color-sprout)]/20 to-white">
                  <div
                    className={`absolute inset-0 transition-all duration-500 group-hover:scale-105 ${hasHoverImage ? "group-hover:opacity-0" : ""
                      } ${config.padding}`}
                    style={{ transform: hasHoverImage ? undefined : `scale(${config.scale})` }}
                  >
                    <Image
                      src={boxImage}
                      alt={tData(box.name)}
                      fill
                      sizes="(max-width:768px) 100vw, 400px"
                      className="object-contain object-center"
                    />
                  </div>
                  {hasHoverImage && (
                    <div
                      className={`absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105 ${config.padding}`}
                    >
                      <Image
                        src={boxHoverImage}
                        alt={`${tData(box.name)} - Vista cenital`}
                        fill
                        sizes="(max-width:768px) 100vw, 400px"
                        className="object-contain object-center"
                      />
                    </div>
                  )}

                  {/* Badges Flotantes */}
                  <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[0.6rem] font-bold text-[var(--gd-color-forest)] shadow-sm border border-[var(--gd-color-leaf)]/20">
                      <span>{box.durationDays ? `${box.durationDays} ${t("boxes.duration_days").toLowerCase().includes("supply") ? "days" : "días"}` : t("boxes.flexible")}</span>
                    </div>
                  </div>
                </div>

                {/* Título Principal */}
                <div className="px-5 pt-4 pb-2 text-center bg-white relative z-20">
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-foreground)] leading-tight">
                    {tData(box.name)}
                  </h3>
                  {/* Flecha indicadora - visible solo cuando colapsado (no hover) */}
                  <div className="mt-1 flex justify-center opacity-100 transition-opacity duration-300 group-hover:opacity-0 h-4 items-center">
                    <span className="text-[var(--gd-color-leaf)] text-xs animate-bounce">▼</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN COLAPSABLE (Hidden content revealed on hover) */}
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:grid-rows-[1fr] bg-white">
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-0 space-y-4">

                    {/* Descripción + Detalles */}
                    <div className="text-center space-y-3 opacity-0 translate-y-4 transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:translate-y-0">
                      {(box.description?.es || box.description?.en) && (
                        <p className="text-sm md:text-base text-[var(--color-muted)] leading-relaxed line-clamp-2 px-2">
                          {tData(box.description)}
                        </p>
                      )}

                      {(boxDetails?.dimensions || boxDetails?.weight) && (
                        <div className="flex justify-center gap-4 text-xs md:text-sm text-[var(--color-muted)] border-t border-[var(--gd-color-leaf)]/10 pt-2 mx-4">
                          {boxDetails.dimensions && (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-[var(--gd-color-forest)] text-sm">{t("boxes.size")}</span>
                              <span className="text-xs md:text-sm">{boxDetails.dimensions}</span>
                            </div>
                          )}
                          {boxDetails.weight && (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-[var(--gd-color-forest)] text-sm">{t("boxes.weight")}</span>
                              <span className="text-xs md:text-sm">{boxDetails.weight}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Variantes */}
                    {(() => {
                      const boxData = prebuiltBoxes.find((pb) => pb.box.id === box.id);
                      const baseContents = boxData?.baseContents ?? [];
                      if (baseContents.length === 0) return null;

                      const ruleId = BOX_SKU_MAP[box.id] || BOX_SKU_MAP[box.slug];
                      const rule = ruleId ? rulesById.get(ruleId) : undefined;

                      return (
                        <div className="opacity-0 translate-y-4 transition-all duration-500 delay-150 group-hover:opacity-100 group-hover:translate-y-0">
                          <BoxVariantsDisplay
                            baseContents={baseContents}
                            boxRule={rule}
                            productMap={productMap}
                            compact={true}
                            initialVariant={selectedVariants[box.id]}
                            onVariantSelect={(variant) =>
                              setSelectedVariants((prev) => ({ ...prev, [box.id]: variant }))
                            }
                          />
                        </div>
                      );
                    })()}

                    {/* Precio y Botones */}
                    <div className="space-y-3 opacity-0 translate-y-4 transition-all duration-500 delay-200 group-hover:opacity-100 group-hover:translate-y-0 pt-1">
                      {/* Precio */}
                      <div className="text-center">
                        <p className="font-display text-3xl md:text-4xl font-black text-emerald-950">
                          RD${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                        </p>
                        {/* Disclaimer de peso y cantidad */}
                        <div className="pt-1 mt-1">
                          <p className="text-xs text-[var(--color-muted)] italic leading-tight">
                            {t("boxes.disclaimer")}
                          </p>
                        </div>
                      </div>

                      {/* Botones */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Lógica de compra...
                          const boxData = prebuiltBoxes.find((pb) => pb.box.id === box.id);
                          if (boxData?.baseContents && boxData.baseContents.length > 0) {
                            setQuickAddBox(box);
                          } else {
                            window.location.href = `/armar?box=${box.id}`;
                          }
                        }}
                        className="group/btn flex items-center justify-center gap-2 w-full rounded-full bg-[var(--gd-color-forest)] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:shadow-xl hover:scale-[1.02]"
                      >
                        <span>🛒</span> {t("common.add_to_cart")}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Lógica personalizar...
                          const boxData = prebuiltBoxes.find((pb) => pb.box.id === box.id);
                          if (boxData?.baseContents && boxData.baseContents.length > 0) {
                            setCustomizeBox(box);
                          } else {
                            window.location.href = `/armar?box=${box.id}`;
                          }
                        }}
                        className="flex items-center justify-center w-full text-xs font-semibold text-[var(--gd-color-forest)] hover:underline decoration-[var(--gd-color-leaf)] underline-offset-4 decoration-2"
                      >
                        {t("boxes.customize_content")} →
                      </button>
                    </div>

                  </div>
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
        const ruleId = BOX_SKU_MAP[quickAddBox.slug] || BOX_SKU_MAP[quickAddBox.id];
        const rule = ruleId ? rulesById.get(ruleId) : boxData?.rule;

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
            boxRule={rule}
            productMap={productMap}
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
        const ruleId = BOX_SKU_MAP[customizeBox.slug] || BOX_SKU_MAP[customizeBox.id];
        const rule = ruleId ? rulesById.get(ruleId) : boxData?.rule;

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
            boxRule={rule}
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
