"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useCart } from "@/modules/cart/context";
import type { Box, BoxRule, Product } from "@/modules/catalog/types";
import { getVariantInfo, getVisualCategory, type VariantType } from "./box-selector/helpers";
import { ProductImageFallback } from "./product-image-fallback";
import { useTranslation } from "@/modules/i18n/use-translation";

type QuickAddModalProps = {
  box: Box;
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  boxRule?: BoxRule;
  productMap?: Map<string, Product>;
  boxImage?: string;
  dimensions?: string;
  weight?: string;
  onClose: () => void;
  onCustomize: () => void;
};

export function QuickAddModal({
  box,
  baseContents,
  boxRule,
  productMap,
  boxImage: propBoxImage,
  dimensions,
  weight,
  onClose,
  onCustomize,
}: QuickAddModalProps) {
  const { addItem } = useCart();
  const { locale, t, tData } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState<VariantType>("mix");
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Filtrar contenido según variante
  const getFilteredContents = (variant: VariantType) => {
    if (boxRule?.variantContents?.[variant]?.length) {
      return boxRule.variantContents[variant]!.map((item) => ({
        ...item,
        name: productMap?.get(item.productSlug)?.name?.es ?? item.productSlug,
      }));
    }
    if (variant === "mix") {
      return baseContents;
    } else if (variant === "fruity") {
      return baseContents.filter((item) => {
        const product = productMap?.get(item.productSlug);
        const category = getVisualCategory(item.productSlug, item.name, product?.categoryId);
        return (
          category === "fruit_large" ||
          category === "fruit_small" ||
          category === "citrus" ||
          category === "aromatic"
        );
      });
    } else {
      return baseContents.filter((item) => {
        const product = productMap?.get(item.productSlug);
        const category = getVisualCategory(item.productSlug, item.name, product?.categoryId);
        return (
          category === "leafy" ||
          category === "root" ||
          category === "aromatic" ||
          (category !== "fruit_large" && category !== "fruit_small" && category !== "citrus")
        );
      });
    }
  };

  const filteredContents = getFilteredContents(selectedVariant);
  const selectedVariantData = box.variants.find((item) => item.id === selectedVariant || item.slug === selectedVariant);
  const variantInfo = getVariantInfo(selectedVariant, locale, selectedVariantData);

  // Calcular estadísticas
  const totalProducts = filteredContents.length;
  const categories = new Set(
    filteredContents.map((item) => {
      const product = productMap?.get(item.productSlug);
      return getVisualCategory(item.productSlug, item.name, product?.categoryId);
    })
  ).size;

  // Mostrar TODOS los productos, no solo 6
  const allProducts = filteredContents;

  const boxImage = propBoxImage || box.heroImage || "/images/boxes/placeholder.jpg";

  const handleAddToCart = async () => {
    setIsAdding(true);
    addItem({
      slug: `${box.slug}-${selectedVariant}`,
      type: "box",
      name: `${tData(box.name)} (${selectedVariant.toUpperCase()})`,
      quantity,
      price: box.price.amount,
      slotValue: 0,
      weightKg: 0,
    });
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 500);
  };

  // Render using Portal to escape parent stacking contexts
  if (typeof window === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={(e) => {
        // Cerrar al hacer clic en el fondo
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ position: "fixed" }}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b-2 border-[var(--gd-color-leaf)]/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
              Tu {tData(box.name)} está lista
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-[var(--gd-color-sprout)]/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Selector de variante */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--gd-color-forest)]">
              Elige tu variante:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(["mix", "fruity", "veggie"] as VariantType[]).map((variant) => {
                const variantData = box.variants.find((item) => item.id === variant || item.slug === variant);
                const info = getVariantInfo(variant, locale, variantData);
                const isSelected = selectedVariant === variant;
                return (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-xl p-4 border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/40 shadow-md scale-[1.02]"
                        : "border-[var(--gd-color-leaf)]/30 bg-white hover:border-[var(--gd-color-leaf)]/50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{info.icon}</div>
                    <p className="font-bold text-sm text-[var(--gd-color-forest)] mb-1">
                      {variant.toUpperCase()}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">{info.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen visual */}
          <div className="rounded-2xl bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white p-6 border-2 border-[var(--gd-color-leaf)]/30">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Imagen */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-background-muted)]">
                <Image
                  src={boxImage}
                  alt={tData(box.name)}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-contain object-center p-4"
                  unoptimized={boxImage?.startsWith('http') || boxImage?.startsWith('https')}
                />
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--gd-color-leaf)]/20 px-3 py-1 mb-2">
                    <span className="text-lg">{variantInfo.icon}</span>
                    <span className="text-sm font-bold text-[var(--gd-color-forest)]">
                      {variantInfo.tagline}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {variantInfo.description}
                  </p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
                      {totalProducts}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">productos</p>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
                      {categories}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">categorías</p>
                  </div>
                </div>

                {/* Tamaño y Peso */}
                {(dimensions || weight) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {dimensions && (
                      <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)] mb-1">
                          Tamaño
                        </p>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {dimensions}
                        </p>
                      </div>
                    )}
                    {weight && (
                      <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)] mb-1">
                          Peso aprox.
                        </p>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {weight}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Precio */}
                <div className="pt-3 border-t border-[var(--gd-color-leaf)]/20">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
                    Precio
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent">
                    RD${box.price.amount.toLocaleString("es-DO")}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de productos - TODOS los productos visibles */}
            <div className="mt-6 pt-6 border-t border-[var(--gd-color-leaf)]/20">
              <p className="text-xs font-semibold text-[var(--gd-color-forest)] mb-3">
                {t("boxes.included_reference")}:
              </p>
              <p className="text-[0.65rem] text-[var(--color-muted)] mb-3">
                {t("boxes.included_disclaimer")}
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {allProducts.map((item) => (
                  <div
                    key={item.productSlug}
                    className="flex flex-col items-center rounded-lg bg-white/60 p-2 border border-[var(--gd-color-leaf)]/10"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-background-muted)] mb-1">
                      <ProductImageFallback
                        slug={item.productSlug}
                        name={item.name}
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <p className="text-xs text-center font-medium text-[var(--color-foreground)] truncate w-full">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--gd-color-forest)] font-bold">
                      x{item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-[var(--color-background-muted)] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
                {t("common.quantity")}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gd-color-leaf)]/40 text-lg text-[var(--gd-color-forest)] transition hover:bg-white"
                  aria-label={t("common.decrease")}
                >
                  −
                </button>
                <span className="min-w-[2ch] text-center text-base font-semibold text-[var(--color-foreground)]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gd-color-leaf)]/40 text-lg text-[var(--gd-color-forest)] transition hover:bg-white"
                  aria-label={t("common.increase")}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {isAdding ? "Agregando..." : "✓ Confirmar y agregar al carrito"}
            </button>
            <button
              type="button"
              onClick={onCustomize}
              className="flex-1 rounded-full border-2 border-[var(--gd-color-leaf)] bg-white px-6 py-4 text-base font-semibold text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/20 transition-colors"
            >
              ✏️ Personalizar productos
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
