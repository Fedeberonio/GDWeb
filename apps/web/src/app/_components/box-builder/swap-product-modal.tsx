"use client";
/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/modules/catalog/types";
import { getProductMeta } from "@/modules/box-builder/utils";
import { ProductSeasonalBadge } from "../product-seasonal-badge";
import productMetadata from "@/data/productMetadata.json";
import { getVisualCategory, type VariantType } from "../box-selector/helpers";

// Componente para manejar imágenes con múltiples fallbacks
function ProductImageWithFallback({ 
  product, 
  className = "" 
}: { 
  product: Product; 
  className?: string;
}) {
  const [imageSrc, setImageSrc] = useState<string>(`/images/products/${product.slug}.jpg`);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const imageSources = useMemo(() => {
    const sources: string[] = [];
    const isBaby = product.slug.toLowerCase().includes("baby");
    const nonBabySlug = isBaby ? product.slug.replace(/-baby/gi, "").replace(/baby-/gi, "") : product.slug;
    
    // 1. Intentar imagen local primero
    sources.push(`/images/products/${product.slug}.jpg`);
    // 2. Si es baby, intentar también sin "-baby"
    if (isBaby && nonBabySlug !== product.slug) {
      sources.push(`/images/products/${nonBabySlug}.jpg`);
    }
    // 3. Si tiene product.image, usarlo
    if (product.image && product.image !== `/images/products/${product.slug}.jpg`) {
      sources.push(product.image);
    }
    // 4. Intentar URL remota como último recurso
    sources.push(`https://greendolio.shop/images/products/${product.slug}.jpg`);
    if (isBaby && nonBabySlug !== product.slug) {
      sources.push(`https://greendolio.shop/images/products/${nonBabySlug}.jpg`);
    }
    return sources;
  }, [product.slug, product.image]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setImageSrc(imageSources[0]);
      setHasError(false);
      setAttempt(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [product.slug, imageSources]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const nextAttempt = attempt + 1;
    if (nextAttempt < imageSources.length) {
      setAttempt(nextAttempt);
      // Forzar re-render con nueva fuente
      const newSrc = imageSources[nextAttempt];
      setImageSrc(newSrc);
      // Resetear el error del elemento
      const target = e.target as HTMLImageElement;
      target.onerror = null; // Reset error handler
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-muted)] bg-[var(--color-background-muted)]">
        Foto en preparación
      </div>
    );
  }

  return (
    <Image
      key={`${product.slug}-${attempt}`}
      src={imageSrc}
      alt={product.name.es}
      fill
      sizes="(max-width: 768px) 100vw, 300px"
      className={className}
      onError={handleError}
      unoptimized={imageSrc.startsWith('http')}
    />
  );
}

// Componente para imagen del producto a intercambiar
function ProductImageForSwap({ 
  slug, 
  name,
  className = "" 
}: { 
  slug: string; 
  name: string;
  className?: string;
}) {
  const [imageSrc, setImageSrc] = useState<string>(`/images/products/${slug}.jpg`);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const imageSources = useMemo(() => {
    const sources: string[] = [];
    const isBaby = slug.toLowerCase().includes("baby");
    const nonBabySlug = isBaby ? slug.replace(/-baby/gi, "").replace(/baby-/gi, "") : slug;
    
    // Intentar con el slug original
    sources.push(`/images/products/${slug}.jpg`);
    // Si es baby, intentar también sin "-baby"
    if (isBaby && nonBabySlug !== slug) {
      sources.push(`/images/products/${nonBabySlug}.jpg`);
    }
    // URLs remotas
    sources.push(`https://greendolio.shop/images/products/${slug}.jpg`);
    if (isBaby && nonBabySlug !== slug) {
      sources.push(`https://greendolio.shop/images/products/${nonBabySlug}.jpg`);
    }
    return sources;
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setImageSrc(imageSources[0]);
      setHasError(false);
      setAttempt(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [slug, imageSources]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const nextAttempt = attempt + 1;
    if (nextAttempt < imageSources.length) {
      setAttempt(nextAttempt);
      const newSrc = imageSources[nextAttempt];
      setImageSrc(newSrc);
      const target = e.target as HTMLImageElement;
      target.onerror = null;
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-lg bg-[var(--gd-color-sprout)]/20">
        🔄
      </div>
    );
  }

  return (
    <Image
      key={`${slug}-${attempt}`}
      src={imageSrc}
      alt={name}
      fill
      sizes="48px"
      className={className}
      onError={handleError}
      unoptimized={imageSrc.startsWith('http')}
    />
  );
}

type SwapProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productToSwap: {
    slug: string;
    name: string;
    quantity: number;
    slotValue: number;
    weightKg: number;
  } | null;
  availableProducts: Product[];
  selectedProducts: Record<string, number>;
  slotBudget?: number;
  slotsUsed: number;
  variant?: VariantType; // Variante seleccionada para filtrar correctamente
  boxId?: string; // Para manejar reglas especiales (ej. productos baby solo Box 1)
  onSwap: (newProductSlug: string, quantity?: number) => void;
};

const PRICE_TOLERANCE = 10; // RD$ tolerancia para permitir swaps sin recargo

export function SwapProductModal({
  isOpen,
  onClose,
  productToSwap,
  availableProducts,
  selectedProducts,
  slotBudget,
  slotsUsed,
  variant = "mix",
  boxId,
  onSwap,
}: SwapProductModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [swapQuantity, setSwapQuantity] = useState<number>(1);

  useEffect(() => {
    if (productToSwap) {
      const timer = setTimeout(() => setSwapQuantity(productToSwap.quantity || 1), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [productToSwap]);

  if (!isOpen || !productToSwap) return null;

  const productMeta = getProductMeta(productToSwap.slug);
  const currentCategory = productMeta?.category;
  const swapTargets = useMemo(() => {
    const oldMeta = getProductMeta(productToSwap.slug);
    const targetWeight = (oldMeta?.weightKg ?? productToSwap.weightKg) * swapQuantity;
    const targetPrice =
      (oldMeta?.wholesaleCost ? oldMeta.wholesaleCost * 1.5 : 0) * swapQuantity;
    const targetSlots = (oldMeta?.slotValue ?? productToSwap.slotValue) * swapQuantity;
    const currentSlotsWithoutSwap = slotsUsed - targetSlots;
    return { targetWeight, targetPrice, targetSlots, currentSlotsWithoutSwap };
  }, [productToSwap, slotsUsed, swapQuantity]);

  const classifyProduct = useCallback((product: Product) => {
    const meta = productMetadata.find((pm) => pm.slug === product.slug);
    const visualCategory = getVisualCategory(product.slug, product.name.es, meta?.category || product.categoryId);
    const categoryHint = (meta?.category || product.categoryId || "").toLowerCase();

    const isFruit =
      visualCategory === "fruit_large" ||
      visualCategory === "fruit_small" ||
      visualCategory === "citrus" ||
      categoryHint.includes("frut");

    const isAromatic =
      visualCategory === "aromatic" ||
      categoryHint.includes("hierb") ||
      categoryHint.includes("arom") ||
      categoryHint.includes("especia");

    const isVegetable =
      visualCategory === "leafy" ||
      visualCategory === "root" ||
      isAromatic ||
      categoryHint.includes("veget") ||
      categoryHint.includes("tuberc") ||
      categoryHint.includes("raiz") ||
      categoryHint.includes("raíz");

    return { visualCategory, isFruit, isAromatic, isVegetable };
  }, []);

  const computeRecommendedQuantity = useCallback((
    weight: number,
    slotValue: number,
    price: number
  ) => {
    const { targetWeight, targetPrice, targetSlots, currentSlotsWithoutSwap } = swapTargets;
    const maxCandidate = Math.max(productToSwap.quantity + 3, Math.ceil(targetWeight / weight) + 2, 3);

    let best = {
      quantity: 1,
      score: Number.POSITIVE_INFINITY,
      weightDiff: targetWeight - weight,
      priceDiff: targetPrice - price,
      slotDiff: targetSlots - slotValue,
      weightRatio: 1,
      priceRatio: 1,
    };

    for (let q = 1; q <= maxCandidate; q++) {
      const slotsAfterSwap = currentSlotsWithoutSwap + slotValue * q;
      if (slotBudget && slotsAfterSwap > slotBudget) continue;

      const weightDiff = targetWeight - weight * q;
      const priceDiff = targetPrice - price * q;
      const slotDiff = targetSlots - slotValue * q;

      const weightRatio = Math.abs(weightDiff) / Math.max(targetWeight, weight * q, 0.1);
      const priceRatio = Math.abs(priceDiff) / Math.max(targetPrice || price * q, 1);
      const slotRatio = Math.abs(slotDiff) / Math.max(targetSlots || slotValue * q, 1);

      const score = weightRatio * 0.5 + priceRatio * 0.3 + slotRatio * 0.2;

      if (score < best.score || (Math.abs(score - best.score) < 0.01 && q < best.quantity)) {
        best = { quantity: q, score, weightDiff, priceDiff, slotDiff, weightRatio, priceRatio };
      }
    }

    return best;
  }, [swapQuantity, slotBudget, swapTargets]);

  // Filtrar productos disponibles (excluir el que se está intercambiando y los ya seleccionados)
  const suggestedProducts = useMemo(() => {
    const EXCLUDED_CATEGORIES = [
      "productos-caseros",
      "jugos",
      "jugos-naturales",
      "productos-de-granja",
      "cajas",
    ];

    const isBaby = (p: Product) =>
      p.slug.toLowerCase().includes("baby") || p.tags?.some((tag) => tag.toLowerCase() === "baby-only");
    const allowBaby =
      (boxId && boxId.toLowerCase().includes("box-1")) ||
      (boxId && boxId.toLowerCase().includes("gd-caja-001")) ||
      productToSwap.slug.toLowerCase().includes("baby");

    const baseProducts = availableProducts.filter((p) => {
      if (p.slug === productToSwap.slug) return false;
      if (selectedProducts[p.slug]) return false;
      const meta = productMetadata.find((pm) => pm.slug === p.slug);
      const categoryId = (meta?.category || p.categoryId || "").toLowerCase();
      if (EXCLUDED_CATEGORIES.includes(categoryId)) return false;
      if (isBaby(p) && !allowBaby) return false; // Ocultar baby salvo Box 1 o swaps entre baby

      const { isFruit, isVegetable, isAromatic } = classifyProduct(p);

      if (variant === "mix") {
        return isFruit || isVegetable || isAromatic;
      }
      if (variant === "fruity") {
        return isFruit && !isAromatic;
      }
      // veggie
      return (isVegetable || isAromatic) && !isFruit;
    });

    const targetCategory = getVisualCategory(
      productToSwap.slug,
      productToSwap.name,
      currentCategory || productMeta?.category
    );

    const scored = baseProducts
      .map((p) => {
        const meta = getProductMeta(p.slug);
        const classification = classifyProduct(p);
        const weight = meta?.weightKg ?? 0.5;
        const slotValue = meta?.slotValue ?? 1;
        const price = meta?.wholesaleCost ? meta.wholesaleCost * 1.5 : p.price?.amount ?? 0;
        const category = meta?.category || classification.visualCategory;
        const recommendation = computeRecommendedQuantity(weight, slotValue, price);

        let score = 0;
        const visualCategory = classification.visualCategory;
        if (category === currentCategory || visualCategory === targetCategory) score += 10;

        const weightRatio = Math.abs(recommendation.weightDiff) / Math.max(swapTargets.targetWeight, weight * recommendation.quantity, 0.1);
        if (weightRatio < 0.25) score += 6;
        else if (weightRatio < 0.45) score += 3;

        if (slotValue === productToSwap.slotValue) score += 2;

        const slotsAfterSwap = swapTargets.currentSlotsWithoutSwap + slotValue * recommendation.quantity;
        if (!slotBudget || slotsAfterSwap <= slotBudget) score += 1;

        return { product: p, score, meta, weight, slotValue, category, recommendation, visualCategory };
      })
      .sort((a, b) => b.score - a.score);

    return scored;
  }, [availableProducts, productToSwap, selectedProducts, currentCategory, slotBudget, variant, productMeta?.category, swapTargets, classifyProduct, computeRecommendedQuantity]);

  // Filtrar por búsqueda y categoría
  const filteredProducts = useMemo(() => {
    let filtered = suggestedProducts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.product.name.es.toLowerCase().includes(query) ||
          item.product.slug.toLowerCase().includes(query)
      );
    }

    if (filterCategory) {
      filtered = filtered.filter(
        (item) => item.category === filterCategory || item.visualCategory === filterCategory
      );
    }

    return filtered;
  }, [suggestedProducts, searchQuery, filterCategory]);

  // Obtener categorías únicas para el filtro
  const categories = useMemo(() => {
    const cats = new Set<string>();
    suggestedProducts.forEach((item) => {
      if (item.category) {
        cats.add(item.category);
      } else if (item.visualCategory) {
        cats.add(item.visualCategory);
      }
    });
    return Array.from(cats).sort();
  }, [suggestedProducts]);

  const handleSelectProduct = (product: Product, quantityHint?: number) => {
    const desiredQuantity = Math.max(1, Math.min(swapQuantity, productToSwap.quantity || 1));
    const validation = getProductValidation(product, quantityHint ?? desiredQuantity);
    const quantity = Math.max(1, Math.min(validation.recommendedQuantity ?? desiredQuantity, desiredQuantity));
    
    // Solo permitir swap si cumple todas las condiciones
    if (!validation.canSwap) {
      return; // Restringir swaps que no cumplan reglas
    }
    
    onSwap(product.slug, quantity);
    onClose();
  };

  const getProductValidation = (product: Product, quantityHint?: number) => {
    const meta = getProductMeta(product.slug);
    const slotValue = meta?.slotValue ?? 1;
    const weight = meta?.weightKg ?? 0.5;
    const price = meta?.wholesaleCost ? meta.wholesaleCost * 1.5 : product.price?.amount ?? 0;

    const desiredQuantity = Math.max(1, Math.min(quantityHint ?? swapQuantity, productToSwap.quantity));
    const recommendation = computeRecommendedQuantity(weight, slotValue, price);
    const recommendedQuantity = Math.max(1, quantityHint ?? recommendation.quantity);
    const slotsAfterSwap = swapTargets.currentSlotsWithoutSwap + slotValue * recommendedQuantity;

    const targetWeight = swapTargets.targetWeight || weight * recommendedQuantity;
    const targetPrice = swapTargets.targetPrice || price * recommendedQuantity;

    const totalWeight = weight * recommendedQuantity;
    const totalPrice = price * recommendedQuantity;

    const weightDiff = totalWeight - targetWeight;
    const targetPriceSafe = targetPrice && targetPrice > 0 ? targetPrice : totalPrice;
    const priceDiff = totalPrice - targetPriceSafe;

    // Validación de peso: permite hasta 45% de diferencia
    const weightRatio = Math.abs(weightDiff) / Math.max(targetWeight, totalWeight, 0.1);
    const weightSimilar = weightRatio < 0.45;
    const weightCompatible = weightRatio < 0.25; // Muy compatible (< 25% diferencia)
    const weightWarning = weightRatio >= 0.25 && weightRatio < 0.45; // Advertencia (25-45%)

    // Validación de precio
    const isPriceHigher = priceDiff > PRICE_TOLERANCE;
    const isPriceLower = priceDiff < -0.01;
    const priceAllowed = !isPriceHigher; // Se permite hasta la tolerancia
    const extraCost = priceDiff > PRICE_TOLERANCE ? priceDiff : 0;
    
    // Validación de espacios
    const isWithinBudget = !slotBudget || slotBudget <= 0 || slotsAfterSwap <= slotBudget;
    const isExceedingBudget = slotBudget && slotsAfterSwap > slotBudget;
    const wasAlreadyExceeding = slotBudget && slotsUsed > slotBudget;
    const doesNotWorsen = wasAlreadyExceeding && slotsAfterSwap <= slotsUsed;
    
    // Permitir si cabe en el presupuesto O si no empeora cuando ya estábamos excedidos
    const canFitSlots = isWithinBudget || doesNotWorsen;
    const slotsExceeded = isExceedingBudget && !doesNotWorsen;
    const slotsOverflow = slotsAfterSwap - (slotBudget || 0);

    // Lógica mejorada: solo permitir swap si:
    // 1. El peso es similar (dentro de tolerancia)
    // 2. El precio está permitido (dentro de tolerancia) O tiene costo extra explícito
    // 3. Los espacios caben O no empeoran si ya estábamos excedidos
    const canSwap = weightSimilar && priceAllowed && canFitSlots;
    const canSwapWithExtra = weightSimilar && extraCost > 0 && canFitSlots; // Permite con costo extra

    return {
      recommendedQuantity: Math.min(recommendedQuantity, desiredQuantity),
      weightDiff,
      priceDiff,
      weightRatio,
      weightSimilar,
      weightCompatible,
      weightWarning,
      canFitSlots,
      slotsExceeded,
      slotsOverflow,
      priceAllowed,
      isPriceHigher,
      isPriceLower,
      canSwap: canSwap || canSwapWithExtra,
      needsExtra: extraCost > 0 && canFitSlots && weightSimilar,
      extraCost,
      wasAlreadyExceeding,
      doesNotWorsen,
    };
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-[151]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--gd-color-leaf)]/20 to-[var(--gd-color-sprout)]/20 p-6 border-b-2 border-[var(--gd-color-leaf)]/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-display text-2xl text-[var(--gd-color-forest)] mb-2">
                Intercambiar producto
              </h2>
              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-[var(--gd-color-leaf)]/20">
                <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--color-background-muted)] border border-[var(--gd-color-leaf)]/20">
                  <ProductImageForSwap
                    slug={productToSwap.slug}
                    name={productToSwap.name}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                    {productToSwap.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Cantidad: x{productToSwap.quantity} · {productToSwap.slotValue} espacio{productToSwap.slotValue !== 1 ? "s" : ""} · {productToSwap.weightKg.toFixed(2)} kg
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
              {productToSwap.quantity > 1 && (
                <div className="mt-3 p-3 bg-white/80 rounded-xl border border-[var(--gd-color-leaf)]/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-[var(--gd-color-forest)] block mb-1">
                        Cantidad a intercambiar
                      </span>
                      <p className="text-xs text-[var(--color-muted)]">
                        {swapQuantity < productToSwap.quantity 
                          ? `Intercambiarás ${swapQuantity} unidad${swapQuantity !== 1 ? "es" : ""} y quedarán ${productToSwap.quantity - swapQuantity} del producto original`
                          : `Intercambiarás todas las ${productToSwap.quantity} unidades`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSwapQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-full border border-[var(--gd-color-leaf)]/40 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30 transition-all"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold min-w-[2ch] text-center">{swapQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setSwapQuantity((q) => Math.min(productToSwap.quantity, q + 1))}
                        className="w-8 h-8 rounded-full border border-[var(--gd-color-leaf)]/40 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-white/90 hover:bg-white border-2 border-[var(--gd-color-leaf)]/30 flex items-center justify-center text-[var(--gd-color-forest)] hover:scale-110 transition-all z-10 relative"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="p-4 bg-[var(--gd-color-sprout)]/10 border-b border-[var(--gd-color-leaf)]/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--gd-color-leaf)]/30 bg-white px-4 pr-10 py-2.5 text-sm focus:border-[var(--gd-color-leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none z-10">🔍</span>
            </div>
            {categories.length > 0 && (
              <select
                value={filterCategory || ""}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="rounded-xl border-2 border-[var(--gd-color-leaf)]/30 bg-white px-4 py-2.5 text-sm focus:border-[var(--gd-color-leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/20"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[var(--color-muted)]">💡</span>
            <p className="text-xs text-[var(--color-muted)]">
              Los productos están ordenados por relevancia. Los marcados con <span className="font-semibold text-[var(--gd-color-forest)]">⭐ Sugerido</span> son de la misma categoría y peso similar.
            </p>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-6 relative z-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-[var(--color-muted)] mb-2">No se encontraron productos</p>
              <p className="text-sm text-[var(--color-muted)]">
                Intenta con otros términos de búsqueda o cambia el filtro de categoría
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 relative z-0">
              {filteredProducts.map((item) => {
                const product = item.product;
                const slotValue = item.slotValue;
                const weight = item.weight;
                const isSuggested =
                  (item.category === currentCategory ||
                    item.visualCategory === currentCategory ||
                    item.visualCategory === getVisualCategory(productToSwap.slug, productToSwap.name, currentCategory || productMeta?.category)) &&
                  item.score >= 10;
                const validation = getProductValidation(product, item.recommendation?.quantity);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product, validation.recommendedQuantity)}
                    className={`group relative flex flex-col overflow-visible rounded-2xl border-2 transition-all duration-300 text-left ${
                      validation.canSwap
                        ? "border-[var(--gd-color-leaf)]/40 bg-white hover:border-[var(--gd-color-leaf)] hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                        : validation.needsExtra
                        ? "border-orange-300 bg-orange-50/50 hover:border-orange-400 hover:shadow-md cursor-pointer"
                        : "border-[var(--color-border)] bg-[var(--color-background-muted)] opacity-60 cursor-not-allowed"
                    } ${isSuggested ? "ring-2 ring-[var(--gd-color-leaf)]/30" : ""}`}
                  >
                    <div className="relative h-32 w-full overflow-hidden bg-[var(--color-background-muted)] rounded-t-2xl">
                      {isSuggested && (
                        <div className="absolute top-2 left-2 z-20 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)] to-[var(--gd-color-avocado)] px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                          ⭐ Sugerido
                        </div>
                      )}
                      <ProductImageWithFallback
                        product={product}
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute right-2 top-2 z-20 flex flex-col gap-1">
                        {product.isFeatured && (
                          <span className="rounded-full bg-[var(--color-brand)] px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                            ⭐
                          </span>
                        )}
                        {product.status === "active" && (
                          <ProductSeasonalBadge
                            isSeasonal={true}
                            isRefrigerated={product.tags.some(
                              (tag) =>
                                tag.toLowerCase().includes("refrigerado") ||
                                tag.toLowerCase().includes("refrigerated")
                            )}
                            className="text-[10px]"
                          />
                        )}
                      </div>
                    </div>
                    <div className="p-4 space-y-2 relative z-0">
                      <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                        {product.categoryId}
                      </p>
                      <p className="font-display text-base text-[var(--color-foreground)] line-clamp-2">
                        {product.name.es}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-muted)]">
                            {slotValue} espacio{slotValue !== 1 ? "s" : ""} · {weight.toFixed(2)} kg
                          </span>
                          <span className="font-semibold text-[var(--gd-color-forest)]">
                            RD${product.price?.amount?.toLocaleString("es-DO") ?? "N/A"}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted)]">
                          Sugerido: <strong className="text-[var(--gd-color-forest)]">x{validation.recommendedQuantity}</strong> para equilibrar peso/precio
                        </p>
                        
                        {/* Mensajes de validación mejorados - con contenedor para evitar superposiciones */}
                        <div className="space-y-1 min-h-[60px]">
                          {validation.canSwap && (
                            <>
                              {validation.weightCompatible && (
                                <p className="text-xs text-green-600 font-semibold">
                                  ✅ Peso compatible
                                </p>
                              )}
                              {validation.weightWarning && (
                                <p className="text-xs text-orange-600 font-semibold">
                                  ⚠️ Peso ligeramente diferente ({validation.weightDiff > 0 ? "+" : ""}{validation.weightDiff.toFixed(2)} kg)
                                </p>
                              )}
                              {validation.needsExtra && (
                                <p className="text-xs text-orange-700 font-semibold bg-orange-50 px-2 py-1 rounded">
                                  💡 Costo adicional: +RD${Math.abs(validation.extraCost).toFixed(0)}
                                </p>
                              )}
                              {/* Ocultar mensaje de ahorro - solo mostrar costos extra */}
                              {validation.wasAlreadyExceeding && validation.doesNotWorsen && (
                                <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                                  ℹ️ Ya excedías el presupuesto, pero este cambio no lo empeora
                                </p>
                              )}
                              <p className="text-xs text-green-600 font-semibold">
                                ✅ Listo para intercambiar
                              </p>
                            </>
                          )}
                          
                          {!validation.canSwap && (
                            <>
                              {validation.slotsExceeded && (
                                <p className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                                  ❌ No cabe: necesitas {validation.slotsOverflow} espacio{validation.slotsOverflow !== 1 ? "s" : ""} más
                                </p>
                              )}
                              {validation.canFitSlots && !validation.weightSimilar && (
                                <p className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                                  ❌ Peso muy diferente ({validation.weightDiff > 0 ? "+" : ""}{validation.weightDiff.toFixed(2)} kg) - fuera de tolerancia
                                </p>
                              )}
                              {validation.canFitSlots && validation.weightSimilar && validation.isPriceHigher && (
                                <p className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                                  ❌ Precio demasiado alto: +RD${Math.abs(validation.priceDiff).toFixed(0)} (máximo permitido: RD${PRICE_TOLERANCE})
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--gd-color-sprout)]/10 border-t border-[var(--gd-color-leaf)]/20">
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex-1">
              {slotBudget ? (
                <div className="space-y-1">
                  <span className="text-[var(--color-muted)]">
                    Espacios usados: <strong className="text-[var(--gd-color-forest)]">{slotsUsed}</strong> / <strong className="text-[var(--gd-color-forest)]">{slotBudget}</strong>
                  </span>
                  {slotsUsed > slotBudget && (
                    <p className="text-orange-600 font-semibold">
                      ⚠️ Excedido por {slotsUsed - slotBudget} espacio{slotsUsed - slotBudget !== 1 ? "s" : ""}
                    </p>
                  )}
                  {slotsUsed <= slotBudget && (
                    <p className="text-green-600">
                      Disponibles: <strong>{slotBudget - slotsUsed}</strong> espacio{slotBudget - slotsUsed !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-[var(--color-muted)]">
                  Espacios: <strong className="text-[var(--gd-color-forest)]">Sin límite</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[var(--color-border)] hover:border-[var(--gd-color-leaf)] hover:bg-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
