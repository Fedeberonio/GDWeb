"use client";

import { useMemo, useState } from "react";
import { getBoxRule, getProductMeta, computeSlots } from "@/modules/box-builder/utils";
import productMetadata from "@/data/productMetadata.json";
import type { Box, Product } from "@/modules/catalog/types";
import { SwapProductModal } from "./swap-product-modal";
import { ProductImageFallback } from "../product-image-fallback";

type BaseContentsDisplayProps = {
  box: Box;
  selectedProducts: Record<string, number>;
  availableProducts?: Product[];
  slotBudget?: number;
  onSwapProduct?: (oldSlug: string, newSlug: string, quantity?: number) => void;
};

type BaseItem = {
  slug: string;
  name: string;
  baseQuantity: number;
  currentQuantity: number;
  isModified: boolean;
  isRemoved: boolean;
};

export function BaseContentsDisplay({
  box,
  selectedProducts,
  availableProducts = [],
  slotBudget,
  onSwapProduct,
}: BaseContentsDisplayProps) {
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [productToSwap, setProductToSwap] = useState<{
    slug: string;
    name: string;
    quantity: number;
    slotValue: number;
    weightKg: number;
  } | null>(null);

  const rule = getBoxRule(box.id);
  const baseContents = useMemo(() => rule?.baseContents ?? [], [rule]);
  const slotsUsed = computeSlots(selectedProducts);

  const baseItems = useMemo<BaseItem[]>(() => {
    const formatName = (slug: string, name: string) => {
      const meta = productMetadata.find((p) => p.slug === slug) as any;
      const tags = (meta && 'tags' in meta && Array.isArray(meta.tags)) ? meta.tags : [];
      const isBaby = slug.toLowerCase().includes("baby") || tags.includes("baby-only");
      return isBaby ? `${name} (baby)` : name;
    };
    return baseContents.map((item: { productSlug: string; quantity: number }) => {
      const meta = productMetadata.find((p) => p.slug === item.productSlug);
      const currentQty = selectedProducts[item.productSlug] ?? 0;
      const isRemoved = currentQty === 0;
      const isModified = currentQty !== item.quantity;
      
      return {
        slug: item.productSlug,
        name: formatName(item.productSlug, meta?.name ?? item.productSlug),
        baseQuantity: item.quantity,
        currentQuantity: currentQty,
        isModified,
        isRemoved,
      };
    });
  }, [baseContents, selectedProducts]);

  // Productos agregados que no están en el contenido base
  const addedItems = useMemo<Array<{ slug: string; name: string; quantity: number }>>(() => {
    const baseSlugs = new Set(baseContents.map((item: { productSlug: string }) => item.productSlug));
    return Object.entries(selectedProducts)
      .filter(([slug, quantity]) => !baseSlugs.has(slug) && quantity && quantity > 0)
      .map(([slug, quantity]) => {
        const meta = productMetadata.find((p) => p.slug === slug);
        return {
          slug,
          name: meta?.name ?? slug,
          quantity: quantity as number,
        };
      });
  }, [selectedProducts, baseContents]);

  const modifiedCount = baseItems.filter((item: BaseItem) => item.isModified || item.isRemoved).length;
  const isHeavilyCustomized = modifiedCount > baseContents.length * 0.5; // Más del 50% modificado

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <h3 className="font-display text-lg font-bold text-[var(--gd-color-forest)]">
            Contenido Pre-armado de tu Caja
          </h3>
        </div>
        {modifiedCount > 0 && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--gd-color-sprout)]/30 text-[var(--gd-color-forest)]">
            {modifiedCount} modificado{modifiedCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Advertencia de personalización excesiva */}
      {isHeavilyCustomized && (
        <div className="rounded-2xl border-2 border-orange-400 bg-orange-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <p className="font-semibold text-orange-800">Personalización Extensa Detectada</p>
          </div>
          <p className="text-sm text-orange-700">
            Pero de todas maneras, excedido el peso o cantidad de cada caja, no te preocupes! puedes pedir lo que quieras y transformar tu pedido a la <strong>&quot;carta&quot;</strong>. 
            Las cajas pre-armadas son combos convenientes con mejor precio.
          </p>
        </div>
      )}

      {/* Productos agregados (no están en el contenido base) */}
      {addedItems.length > 0 && (
        <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)] bg-gradient-to-r from-[var(--gd-color-sprout)]/25 to-white p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">➕</span>
            <h4 className="font-display text-base font-bold text-[var(--gd-color-forest)]">
              Productos agregados ({addedItems.length})
            </h4>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            Aquí verás los swaps y productos nuevos que no estaban en el contenido base.
          </p>
          <div className="grid gap-2">
            {addedItems.map((item) => (
              <div
                key={item.slug}
                className="flex items-center gap-3 rounded-xl border-2 border-[var(--gd-color-leaf)] bg-white p-3"
              >
                <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--color-background-muted)] border border-[var(--gd-color-leaf)]/20">
                  <ProductImageFallback
                    slug={item.slug}
                    name={item.name}
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Cantidad: <strong className="text-[var(--gd-color-leaf)]">x{item.quantity}</strong>
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] font-semibold">
                  Nuevo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de productos base */}
      <div className="space-y-4">
        <div className="grid gap-3">
          {baseItems.map((item) => (
          <div
            key={item.slug}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
              item.isRemoved
                ? "border-red-200 bg-red-50 opacity-60"
                : item.isModified
                ? "border-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/20"
                : "border-[var(--color-border)] bg-white"
            }`}
          >
            <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--color-background-muted)] border border-[var(--gd-color-leaf)]/10">
              <ProductImageFallback
                slug={item.slug}
                name={item.name}
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm ${
                  item.isRemoved ? "text-red-600 line-through" : "text-[var(--color-foreground)]"
                }`}>
                  {item.name}
                </p>
                {item.isModified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)]">
                    Modificado
                  </span>
                )}
                {item.isRemoved && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Eliminado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--color-muted)]">
                  Base: <strong className="text-[var(--gd-color-forest)]">x{item.baseQuantity}</strong>
                </span>
                {item.isModified && (
                  <>
                    <span className="text-xs text-[var(--color-muted)]">→</span>
                    <span className="text-xs font-semibold text-[var(--gd-color-leaf)]">
                      Actual: x{item.currentQuantity}
                    </span>
                  </>
                )}
              </div>
              {onSwapProduct && !item.isRemoved && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const meta = getProductMeta(item.slug);
                    setProductToSwap({
                      slug: item.slug,
                      name: item.name,
                      quantity: item.currentQuantity,
                      slotValue: meta?.slotValue ?? 1,
                      weightKg: meta?.weightKg ?? 0.5,
                    });
                    setSwapModalOpen(true);
                  }}
                  className="mt-2 w-full rounded-lg border border-[var(--gd-color-leaf)]/40 bg-gradient-to-r from-white to-[var(--gd-color-sprout)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] hover:border-[var(--gd-color-leaf)] hover:bg-[var(--gd-color-sprout)]/30 transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <span className="text-sm">🔄</span>
                  <span>Intercambiar producto</span>
                </button>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Información sobre swaps */}
      <div className="rounded-xl border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-sprout)]/10 p-4">
        <p className="text-xs font-semibold text-[var(--gd-color-forest)] mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>Cómo hacer swaps</span>
        </p>
        <ul className="text-xs text-[var(--color-muted)] space-y-1 ml-6 list-disc">
          <li>Puedes cambiar productos siempre que respetes el peso y precio de la caja</li>
          <li>Pero de todas maneras, excedido el peso o cantidad de cada caja, no te preocupes! puedes pedir lo que quieras y transformar tu pedido a la &quot;carta&quot;</li>
          <li>Las cajas pre-armadas son combos convenientes con mejor precio</li>
          <li><strong className="text-[var(--gd-color-forest)]">Todos los productos son seleccionados el mismo día y son de temporada</strong></li>
        </ul>
      </div>

      {/* Modal de intercambio */}
      {onSwapProduct && productToSwap && (
        <SwapProductModal
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setProductToSwap(null);
          }}
          productToSwap={productToSwap}
          availableProducts={availableProducts}
          selectedProducts={selectedProducts}
          slotBudget={slotBudget}
          slotsUsed={slotsUsed}
          boxId={box.id}
          onSwap={(newProductSlug, quantity) => {
            if (onSwapProduct) {
              onSwapProduct(productToSwap.slug, newProductSlug, quantity);
            }
          }}
        />
      )}
    </div>
  );
}
