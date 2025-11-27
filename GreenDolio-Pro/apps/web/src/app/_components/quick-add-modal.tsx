"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/modules/cart/context";
import type { Box } from "@/modules/catalog/types";
import { getVariantInfo, getVisualCategory, type VariantType } from "./box-selector/helpers";
import productMetadata from "@/data/productMetadata.json";
import { ProductImageFallback } from "./product-image-fallback";

type QuickAddModalProps = {
  box: Box;
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  boxImage?: string;
  dimensions?: string;
  weight?: string;
  onClose: () => void;
  onCustomize: () => void;
};

export function QuickAddModal({ box, baseContents, boxImage: propBoxImage, dimensions, weight, onClose, onCustomize }: QuickAddModalProps) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<VariantType>("mix");
  const [isAdding, setIsAdding] = useState(false);

  // Filtrar contenido según variante
  const getFilteredContents = (variant: VariantType) => {
    if (variant === "mix") {
      return baseContents;
    } else if (variant === "fruity") {
      return baseContents.filter((item) => {
        const meta = productMetadata.find((p) => p.slug === item.productSlug);
        const category = getVisualCategory(item.productSlug, item.name, meta?.category);
        return (
          category === "fruit_large" ||
          category === "fruit_small" ||
          category === "citrus" ||
          category === "aromatic"
        );
      });
    } else {
      return baseContents.filter((item) => {
        const meta = productMetadata.find((p) => p.slug === item.productSlug);
        const category = getVisualCategory(item.productSlug, item.name, meta?.category);
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
  const variantInfo = getVariantInfo(selectedVariant);

  // Calcular estadísticas
  const totalProducts = filteredContents.length;
  const categories = new Set(
    filteredContents.map((item) => {
      const meta = productMetadata.find((p) => p.slug === item.productSlug);
      return getVisualCategory(item.productSlug, item.name, meta?.category);
    })
  ).size;

  // Mostrar TODOS los productos, no solo 6
  const allProducts = filteredContents;

  const boxImage =
    propBoxImage ||
    box.heroImage ||
    (box.id === "box-1" || box.slug.includes("caribbean")
      ? "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png"
      : box.id === "box-2" || box.slug.includes("island")
      ? "/images/boxes/box-2-island-weekssential-veggie-product.jpg"
      : "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg");

  const handleAddToCart = async () => {
    setIsAdding(true);
    addItem({
      slug: `${box.slug}-${selectedVariant}`,
      type: "box",
      name: `${box.name.es} (${selectedVariant.toUpperCase()})`,
      quantity: 1,
      price: box.price.amount,
      slotValue: 0,
      weightKg: 0,
    });
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b-2 border-[var(--gd-color-leaf)]/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
              Tu {box.name.es} está lista
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
                const info = getVariantInfo(variant);
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
                  alt={box.name.es}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-contain object-center p-4"
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
                Productos incluidos:
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
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--gd-color-leaf)]/20">
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
  );
}
