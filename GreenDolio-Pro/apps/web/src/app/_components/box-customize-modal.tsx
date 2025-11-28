"use client";
/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/modules/cart/context";
import type { Box, Product } from "@/modules/catalog/types";
import { getVariantInfo, getVisualCategory, type VariantType } from "./box-selector/helpers";
import { getProductMeta, computeSlots, getBoxContentsForVariant, computeBoxPrice } from "@/modules/box-builder/utils";
import productMetadata from "@/data/productMetadata.json";
import { SwapProductModal } from "./box-builder/swap-product-modal";

// Componente para manejar imágenes con fallback (versión mejorada con URLs remotas)
function ProductImageWithFallback({ 
  productSlug, 
  productName, 
  imageVariations 
}: { 
  productSlug: string; 
  productName: string; 
  imageVariations: string[];
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Agregar URLs remotas como fallback final
  const allImageSources = useMemo(() => {
    const remoteSources = [
      `https://greendolio.shop/images/products/${productSlug}.jpg`,
      `https://greendolio.shop/images/products/${productSlug}.png`,
    ];
    return [...imageVariations, ...remoteSources];
  }, [imageVariations, productSlug]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setHasError(false);
  }, [productSlug]);

  if (hasError || currentImageIndex >= allImageSources.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-background-muted)] text-[0.6rem] text-[var(--color-muted)] text-center px-1">
        {productName.split(' ')[0]}
      </div>
    );
  }

  return (
    <Image
      key={`${productSlug}-${currentImageIndex}`}
      src={allImageSources[currentImageIndex]}
      alt={productName}
      fill
      sizes="48px"
      className="object-cover"
      onError={() => {
        if (currentImageIndex < allImageSources.length - 1) {
          setCurrentImageIndex(currentImageIndex + 1);
        } else {
          setHasError(true);
        }
      }}
      unoptimized={allImageSources[currentImageIndex]?.startsWith('http')}
    />
  );
}

type BoxCustomizeModalProps = {
  box: Box;
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  boxImage?: string;
  dimensions?: string;
  weight?: string;
  availableProducts: Product[];
  slotBudget?: number;
  initialVariant?: VariantType;
  onClose: () => void;
  onAddToCart: () => void;
};

export function BoxCustomizeModal({
  box,
  baseContents,
  boxImage: propBoxImage,
  dimensions,
  weight,
  availableProducts,
  slotBudget,
  initialVariant,
  onClose,
  onAddToCart,
}: BoxCustomizeModalProps) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<VariantType>(initialVariant ?? "mix");
  const [isAdding, setIsAdding] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [swappedProducts, setSwappedProducts] = useState<Set<string>>(new Set());
  
  // Sincronizar la variante inicial si viene de la tarjeta (ej: usuario eligió Fruity)
  useEffect(() => {
    if (initialVariant && initialVariant !== selectedVariant) {
      setSelectedVariant(initialVariant);
    }
  }, [initialVariant, selectedVariant]);

  // Resetear estado cuando cambia la caja para no arrastrar variantes previas
  useEffect(() => {
    const variantToUse = initialVariant ?? "mix";
    setSelectedVariant(variantToUse);
    setSwappedProducts(new Set());
  }, [box.id, initialVariant]);

  // Obtener contenido inicial según la variante seleccionada
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const variantToUse = initialVariant ?? "mix";
    const initialContents = getBoxContentsForVariant(box.id, variantToUse);
    if (initialContents.length > 0) {
      initialContents.forEach((item) => {
        initial[item.productSlug] = item.quantity;
      });
    } else {
      baseContents.forEach((item) => {
        initial[item.productSlug] = item.quantity;
      });
    }
    return initial;
  });
  
  // Actualizar selectedProducts cuando cambia la variante
  useEffect(() => {
    const variantContents = getBoxContentsForVariant(box.id, selectedVariant);
    const newContents = variantContents.length > 0 ? variantContents : baseContents;
    const newSelection: Record<string, number> = {};
    newContents.forEach((item) => {
      newSelection[item.productSlug] = item.quantity;
    });
    setSelectedProducts(newSelection);
    setSwappedProducts(new Set()); // Reset swapped products cuando cambia la variante
  }, [selectedVariant, box.id, baseContents]);
  const [productToSwap, setProductToSwap] = useState<{
    slug: string;
    name: string;
    quantity: number;
    slotValue: number;
    weightKg: number;
  } | null>(null);

  // Ejecutar animación una vez al montar el componente
  useEffect(() => {
    setHasAnimated(true);
  }, []);

  // Filtrar contenido según variante
  // Usar getBoxContentsForVariant si existe contenido específico para la variante
  const getFilteredContents = (variant: VariantType) => {
    // Intentar obtener contenido específico para la variante
    const variantContents = getBoxContentsForVariant(box.id, variant);
    if (variantContents.length > 0) {
      return variantContents.map((item) => ({
        ...item,
        name: productMetadata.find((p) => p.slug === item.productSlug)?.name ?? item.productSlug,
      }));
    }

    // Fallback: filtrar baseContents como antes
    if (variant === "mix") {
      return baseContents;
    } else if (variant === "fruity") {
      return baseContents.filter((item) => {
        const meta = productMetadata.find((p) => p.slug === item.productSlug);
        const category = getVisualCategory(item.productSlug, item.name, meta?.category);
        const slugLower = item.productSlug.toLowerCase();
        const nameLower = item.name.toLowerCase();
        
        const isCookingAromatic = 
          slugLower.includes("ajo") ||
          slugLower.includes("cebolla") ||
          slugLower.includes("apio") ||
          slugLower.includes("perejil") ||
          slugLower.includes("cilantro") ||
          nameLower.includes("ajo") ||
          nameLower.includes("cebolla") ||
          nameLower.includes("apio") ||
          nameLower.includes("perejil") ||
          nameLower.includes("cilantro");
        
        return (
          (category === "fruit_large" ||
           category === "fruit_small" ||
           category === "citrus") &&
          !isCookingAromatic
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

  const filteredContentsMap = useMemo(
    () => new Map(filteredContents.map((item) => [item.productSlug, item])),
    [filteredContents]
  );

  // Obtener productos actuales basados en selectedProducts
  const currentProducts = useMemo(() => {
    const formatName = (slug: string, fallback: string) => {
      const meta = productMetadata.find((p) => p.slug === slug) as any;
      const isBaby = slug.toLowerCase().includes("baby") || (meta && 'tags' in meta && Array.isArray(meta.tags) && meta.tags.includes("baby-only"));
      const baseName = meta?.name ?? fallback;
      return isBaby ? `${baseName} (baby)` : baseName;
    };
    return Object.entries(selectedProducts)
      .filter(([, quantity]) => quantity && quantity > 0)
      .map(([slug, quantity]) => {
        const baseItem = filteredContentsMap.get(slug);
        return {
          productSlug: slug,
          name: formatName(slug, baseItem?.name ?? slug),
          quantity,
          baseQuantity: baseItem?.quantity ?? 0,
        };
      })
      .sort((a, b) => {
        const aIsBase = filteredContentsMap.has(a.productSlug);
        const bIsBase = filteredContentsMap.has(b.productSlug);
        if (aIsBase !== bIsBase) return aIsBase ? -1 : 1;
        return a.name.localeCompare(b.name, "es");
      });
  }, [filteredContentsMap, selectedProducts]);

  // Calcular estadísticas actuales
  const slotsUsed = computeSlots(selectedProducts);
  const totalProducts = currentProducts.length;
  const categories = new Set(
    currentProducts.map((item) => {
      const meta = productMetadata.find((p) => p.slug === item.productSlug);
      return getVisualCategory(item.productSlug, item.name, meta?.category);
    })
  ).size;
  
  // Calcular precio con extras de swaps (usando la variante seleccionada)
  const priceInfo = useMemo(() => {
    return computeBoxPrice(box.id, box.price.amount, selectedProducts, selectedVariant);
  }, [box.id, box.price.amount, selectedProducts, selectedVariant]);
  
  const totalPrice = priceInfo.price + priceInfo.extras;

  const boxImage =
    propBoxImage ||
    box.heroImage ||
    (box.id === "box-1" || box.slug.includes("caribbean")
      ? "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png"
      : box.id === "box-2" || box.slug.includes("island")
      ? "/images/boxes/box-2-island-weekssential-veggie-product.jpg"
      : "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg");

  // Filtrar productos disponibles según la variante
  const getAvailableProductsForVariant = (variant: VariantType): Product[] => {
    // Categorías que NUNCA pueden estar en las cajas (siempre extras)
    const EXCLUDED_CATEGORIES = [
      "productos-caseros",
      "jugos",
      "jugos-naturales",
      "productos-de-granja",
      "cajas",
      "otros", // Excluir TODOS los productos de la categoría "otros" (aceites, granos, etc.)
    ];

    return availableProducts.filter((product) => {
      const slugLower = product.slug.toLowerCase();
      const isBaby = slugLower.includes("baby") || product.tags?.some((tag) => tag.toLowerCase() === "baby-only");
      // Ocultar baby del catálogo general; solo aparecen si vienen en contenidos base
      const boxIdLower = box.id.toLowerCase();
      const isSmallBox = boxIdLower.includes("box-1") || boxIdLower.includes("gd-caja-001");
      if (isBaby && !isSmallBox) {
        return false;
      }

      // Excluir categorías que nunca pueden estar en las cajas
      if (EXCLUDED_CATEGORIES.includes(product.categoryId)) {
        return false;
      }
      
      const meta = productMetadata.find((p) => p.slug === product.slug);
      // También verificar en metadata
      if (meta?.category && EXCLUDED_CATEGORIES.includes(meta.category)) {
        return false;
      }
      
      // Obtener categoría visual del producto
      const category = getVisualCategory(product.slug, product.name.es, meta?.category);
      const nameLower = product.name.es.toLowerCase();
      
      // Identificar aromáticas de cocina (no deben estar en fruity)
      const isCookingAromatic = 
        slugLower.includes("ajo") ||
        slugLower.includes("cebolla") ||
        slugLower.includes("apio") ||
        slugLower.includes("perejil") ||
        slugLower.includes("cilantro") ||
        nameLower.includes("ajo") ||
        nameLower.includes("cebolla") ||
        nameLower.includes("apio") ||
        nameLower.includes("perejil") ||
        nameLower.includes("cilantro");

      // EXCLUIR cualquier producto que no sea claramente fruta o vegetal
      // Solo categorías válidas: fruit_large, fruit_small, citrus, leafy, root, aromatic
      const isValidFruitOrVegetable = 
        category === "fruit_large" ||
        category === "fruit_small" ||
        category === "citrus" ||
        category === "leafy" ||
        category === "root" ||
        category === "aromatic";
      
      // Si no es fruta o vegetal válido, excluir
      if (!isValidFruitOrVegetable) {
        return false;
      }

      // Filtrar según la variante seleccionada
      if (variant === "mix") {
        // MIX: puede tener frutas Y vegetales (solo productos frescos válidos)
        return true; // Ya validamos que es fruta o vegetal válido arriba
      } else if (variant === "fruity") {
        // FRUITY: solo frutas (sin aromáticas de cocina)
        return (
          (category === "fruit_large" ||
           category === "fruit_small" ||
           category === "citrus") &&
          !isCookingAromatic
        );
      } else {
        // VEGGIE: solo vegetales (sin frutas)
        return (
          category === "leafy" ||
          category === "root" ||
          category === "aromatic"
        );
      }
    });
  };

  const availableProductsForVariant = getAvailableProductsForVariant(selectedVariant);

  const handleSwap = (oldSlug: string, newSlug: string, newQuantity?: number) => {
    const oldQuantity = selectedProducts[oldSlug] || 0;
    const quantity = Math.max(1, Math.min((newQuantity ?? oldQuantity) || 1, oldQuantity || 1));
    const newSelection = { ...selectedProducts };
    
    const remainingOld = Math.max(0, oldQuantity - quantity);
    if (remainingOld > 0) {
      newSelection[oldSlug] = remainingOld;
    } else {
      delete newSelection[oldSlug];
    }
    newSelection[newSlug] = (newSelection[newSlug] ?? 0) + quantity;
    
    // Marcar ambos productos como cambiados (el viejo y el nuevo)
    setSwappedProducts((prev) => {
      const updated = new Set(prev);
      updated.add(oldSlug);
      updated.add(newSlug);
      return updated;
    });
    
    setSelectedProducts(newSelection);
    setProductToSwap(null);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    // Calcular precio final con extras (usando la variante seleccionada)
    const finalPriceInfo = computeBoxPrice(box.id, box.price.amount, selectedProducts, selectedVariant);
    const finalPrice = finalPriceInfo.price + finalPriceInfo.extras;
    
    addItem({
      slug: `${box.slug}-${selectedVariant}`,
      type: "box",
      name: `${box.name.es} (${selectedVariant.toUpperCase()})`,
      quantity: 1,
      price: finalPrice, // Incluir extras en el precio
      slotValue: 0,
      weightKg: 0,
    });
    setTimeout(() => {
      setIsAdding(false);
      onAddToCart();
    }, 500);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-20">
        <div className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b-2 border-[var(--gd-color-leaf)]/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
                Personaliza tu {box.name.es}
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

                  {/* Precio con extras */}
                  <div className="pt-3 border-t border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
                      Precio
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent">
                          RD${priceInfo.price.toLocaleString("es-DO")}
                        </p>
                        {priceInfo.extras > 0 && (
                          <span className="text-sm font-semibold text-orange-600">
                            +{priceInfo.extras.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      {priceInfo.extras > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-orange-600 font-semibold">
                            Extras: +RD${priceInfo.extras.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-lg font-bold text-[var(--gd-color-forest)]">
                            Total: RD${totalPrice.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de productos con botón de swap */}
              <div className="mt-6 pt-6 border-t border-[var(--gd-color-leaf)]/20">
                <p className="text-xs font-semibold text-[var(--gd-color-forest)] mb-3">
                  Productos incluidos (haz clic en 🔄 para cambiar):
                </p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {currentProducts.map((item, index) => {
                    const hasBeenSwapped = swappedProducts.has(item.productSlug);
                    const shouldShake = hasAnimated && !hasBeenSwapped;
                    
                    // Intentar diferentes variaciones del nombre de archivo
                    // Primero el slug exacto, luego variaciones del nombre del producto
                    const nameVariations = [
                      item.productSlug,
                      item.productSlug.toLowerCase(),
                      item.name.toLowerCase(),
                      item.name.replace(/\s+/g, '-').toLowerCase(),
                      item.name.replace(/\s+/g, '').toLowerCase(),
                      // Variaciones específicas para cebolla
                      ...(item.name.toLowerCase().includes('cebolla') ? [
                        'cebolla-morada-amarilla',
                        'Cebolla morada amarilla',
                        'Cebolla morada',
                        'Cebolla amarilla',
                        'cebolla-moradaamarilla',
                      ] : []),
                    ];
                    
                    const imageVariations = nameVariations.flatMap(name => [
                      `/images/products/${name}.jpg`,
                      `/images/products/${name}.png`,
                      `/images/products/${name.replace(/\s+/g, '-')}.jpg`,
                      `/images/products/${name.replace(/\s+/g, '-')}.png`,
                      `/images/products/${name.replace(/\s+/g, '')}.jpg`,
                      `/images/products/${name.replace(/\s+/g, '')}.png`,
                    ]);
                    
                    return (
                      <div
                        key={item.productSlug}
                        className={`group relative flex flex-col items-center rounded-lg bg-white/60 p-2 border border-[var(--gd-color-leaf)]/10 hover:border-[var(--gd-color-leaf)] transition-all ${
                          shouldShake ? 'animate-shake-slow' : ''
                        }`}
                        style={
                          shouldShake
                            ? {
                                animationDelay: `${index * 0.1}s`,
                              }
                            : {}
                        }
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-background-muted)] mb-1">
                          <ProductImageWithFallback
                            productSlug={item.productSlug}
                            productName={item.name}
                            imageVariations={imageVariations}
                          />
                          {/* Icono de swap centrado */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const meta = getProductMeta(item.productSlug);
                              setProductToSwap({
                                slug: item.productSlug,
                                name: item.name,
                                quantity: item.quantity,
                                slotValue: meta?.slotValue ?? 1,
                                weightKg: meta?.weightKg ?? 0.5,
                              });
                            }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm"
                            title="Cambiar producto"
                          >
                            <span className="w-8 h-8 rounded-full bg-[var(--gd-color-leaf)] text-white text-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              🔄
                            </span>
                          </button>
                        </div>
                        <p className="text-xs text-center font-medium text-[var(--color-foreground)] truncate w-full">
                          {item.name}
                        </p>
                        <p className="text-xs text-[var(--gd-color-forest)] font-bold">
                          x{item.quantity}
                        </p>
                      </div>
                    );
                  })}
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
            </div>
          </div>
        </div>
      </div>

      {/* Modal de swap */}
      {productToSwap && (
        <SwapProductModal
          isOpen={!!productToSwap}
          onClose={() => setProductToSwap(null)}
          productToSwap={productToSwap}
          availableProducts={availableProductsForVariant}
          selectedProducts={selectedProducts}
          slotBudget={slotBudget}
          slotsUsed={slotsUsed}
          variant={selectedVariant}
          boxId={box.id}
          onSwap={(newSlug, quantity) => handleSwap(productToSwap.slug, newSlug, quantity)}
        />
      )}
    </>
  );
}
