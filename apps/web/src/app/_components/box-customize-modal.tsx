"use client";
/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useCart } from "@/modules/cart/context";
import type { Box, BoxRule, Product } from "@/modules/catalog/types";
import { getVariantInfo, getVisualCategory, type VariantType } from "./box-selector/helpers";
import { computeBoxPrice, computeWeight, getProductMeta } from "@/modules/box-builder/utils";
import { useTranslation } from "@/modules/i18n/use-translation";

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
      className="object-contain p-1"
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
  boxRule?: BoxRule;
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
  boxRule,
  boxImage: propBoxImage,
  dimensions,
  weight,
  availableProducts,
  slotBudget: _slotBudget,
  initialVariant,
  onClose,
  onAddToCart,
}: BoxCustomizeModalProps) {
  const { addItem } = useCart();
  const { t, tData, locale } = useTranslation();
  const boxName = tData(box.name);
  const [selectedVariant, setSelectedVariant] = useState<VariantType>(initialVariant ?? "mix");
  const [isAdding, setIsAdding] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [dislikedProducts, setDislikedProducts] = useState<Set<string>>(new Set());
  const productMap = useMemo(
    () => new Map((availableProducts || []).map((product) => [product.slug, product])),
    [availableProducts]
  );
  const priceLookup = useMemo(
    () => Object.fromEntries((availableProducts || []).map((product) => [product.slug, product.price?.amount ?? 0])),
    [availableProducts],
  );

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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
    setLikedProducts(new Set());
    setDislikedProducts(new Set());
  }, [box.id, initialVariant]);

  // Obtener contenido inicial según la variante seleccionada
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const variantToUse = initialVariant ?? "mix";
    const initialContents = boxRule?.variantContents?.[variantToUse] ?? baseContents;
    initialContents.forEach((item) => {
      initial[item.productSlug] = item.quantity;
    });
    return initial;
  });

  // Actualizar selectedProducts cuando cambia la variante
  useEffect(() => {
    const newContents = boxRule?.variantContents?.[selectedVariant] ?? baseContents;
    const newSelection: Record<string, number> = {};
    newContents.forEach((item) => {
      newSelection[item.productSlug] = item.quantity;
    });
    setSelectedProducts(newSelection);
  }, [selectedVariant, baseContents, boxRule]);
  const handleVariantChange = (newVariant: VariantType) => {
    if (newVariant !== selectedVariant) {
      setSelectedVariant(newVariant);
    }
  };

  // Filtrar contenido según variante
  // Usar getBoxContentsForVariant si existe contenido específico para la variante
  const getFilteredContents = (variant: VariantType) => {
    if (boxRule?.variantContents?.[variant]?.length) {
      return boxRule.variantContents[variant]!.map((item) => ({
        ...item,
        name: productMap.get(item.productSlug)?.name?.es ?? item.productSlug,
      }));
    }

    // Fallback: filtrar baseContents como antes
    if (variant === "mix") {
      return baseContents;
    } else if (variant === "fruity") {
      return baseContents.filter((item) => {
        const product = productMap.get(item.productSlug);
        const category = getVisualCategory(item.productSlug, item.name, product?.categoryId);
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
        const product = productMap.get(item.productSlug);
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

  const getProductLabel = (slug: string, fallback?: string) => {
    const product = productMap.get(slug);
    const localizedName = product ? tData(product.name) : fallback ?? slug;
    const isBaby =
      slug.toLowerCase().includes("baby") ||
      product?.tags?.some((tag) => tag.toLowerCase() === "baby-only");
    return isBaby ? `${localizedName} (baby)` : localizedName;
  };

  const buildImageVariations = (slug: string, name: string) => {
    const normalizedName = name.toLowerCase();
    const nameVariations = [
      slug,
      slug.toLowerCase(),
      normalizedName,
      normalizedName.replace(/\s+/g, "-"),
      normalizedName.replace(/\s+/g, ""),
      ...(normalizedName.includes("cebolla")
        ? [
            "cebolla-morada-amarilla",
            "Cebolla morada amarilla",
            "Cebolla morada",
            "Cebolla amarilla",
            "cebolla-moradaamarilla",
          ]
        : []),
    ];

    return nameVariations.flatMap((variation) => [
      `/images/products/${variation}.jpg`,
      `/images/products/${variation}.png`,
    ]);
  };

  const baseProducts = filteredContents.map((item) => ({
    ...item,
    name: getProductLabel(item.productSlug, item.name),
  }));

  // Calcular estadísticas actuales
  const totalProducts = baseProducts.length;
  const categories = new Set(
    baseProducts.map((item) => {
      const product = productMap.get(item.productSlug);
      const meta = getProductMeta(item.productSlug);
      return getVisualCategory(item.productSlug, item.name, product?.categoryId ?? meta?.categoryId);
    })
  ).size;

  // Calcular precio de la caja
  const priceInfo = useMemo(() => {
    return computeBoxPrice(box.ruleId ?? box.id, box.price.amount, selectedProducts, selectedVariant, priceLookup);
  }, [box.id, box.ruleId, box.price.amount, selectedProducts, selectedVariant, priceLookup]);

  const totalPrice = priceInfo.price + priceInfo.extras;

  // Calcular peso dinámico
  const currentWeightKg = useMemo(() => {
    return computeWeight(selectedProducts);
  }, [selectedProducts]);

  const currentWeightLb = currentWeightKg * 2.20462;
  const formattedWeight = `${currentWeightLb.toFixed(1)} lb (${currentWeightKg.toFixed(1)} kg)`;

  const boxImage = propBoxImage || box.heroImage || "/images/boxes/placeholder.jpg";

  // Filtrar productos disponibles según la variante
  const getAvailableProductsForVariant = (variant: VariantType): Product[] => {
    // Categorías que NUNCA pueden estar en las cajas (siempre extras)
    const EXCLUDED_CATEGORIES = [
      "productos-caseros",
      "jugos",
      "jugos-naturales",
      "productos-de-granja",
      "cajas",
      "otros",
    ];

    return availableProducts.filter((product) => {
      const slugLower = product.slug.toLowerCase();
      const isBaby = slugLower.includes("baby") || product.tags?.some((tag) => tag.toLowerCase() === "baby-only");
      // Ocultar baby del catálogo general; solo aparecen si vienen en contenidos base
      const boxIdLower = (box.ruleId ?? box.id).toLowerCase();
      const isSmallBox = boxIdLower.includes("box-1") || boxIdLower.includes("gd-caja-001");
      if (isBaby && !isSmallBox) {
        return false;
      }

      // Excluir categorías que nunca pueden estar en las cajas
      if (EXCLUDED_CATEGORIES.includes(product.categoryId)) {
        return false;
      }

      const meta = getProductMeta(product.slug);
      if (meta?.categoryId && EXCLUDED_CATEGORIES.includes(meta.categoryId)) {
        return false;
      }

      // Obtener categoría visual del producto
      const category = getVisualCategory(product.slug, product.name.es, meta?.categoryId ?? product.categoryId);
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

      // Permitir frutas y vegetales frescos
      const isValidProduct =
        category === "fruit_large" ||
        category === "fruit_small" ||
        category === "citrus" ||
        category === "leafy" ||
        category === "root" ||
        category === "aromatic";

      // Si no es un producto válido, excluir
      if (!isValidProduct) {
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

  const availableProductsForVariant = useMemo(
    () => getAvailableProductsForVariant(selectedVariant),
    [selectedVariant, availableProducts, box.id]
  );

  const preferenceProducts = useMemo(() => {
    const nameFor = (product: Product) => tData(product.name) || product.name.es;
    return [...availableProductsForVariant].sort((a, b) =>
      nameFor(a).localeCompare(nameFor(b), locale === "en" ? "en" : "es")
    );
  }, [availableProductsForVariant, locale, tData]);

  useEffect(() => {
    const allowed = new Set(availableProductsForVariant.map((product) => product.slug));
    setLikedProducts((prev) => new Set([...prev].filter((slug) => allowed.has(slug))));
    setDislikedProducts((prev) => new Set([...prev].filter((slug) => allowed.has(slug))));
  }, [availableProductsForVariant]);

  const toggleLike = (slug: string) => {
    setLikedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
    setDislikedProducts((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  };

  const toggleDislike = (slug: string) => {
    setDislikedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
    setLikedProducts((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  };

  const sortedLikes = Array.from(likedProducts).sort((a, b) =>
    getProductLabel(a).localeCompare(getProductLabel(b), locale === "en" ? "en" : "es")
  );
  const sortedDislikes = Array.from(dislikedProducts).sort((a, b) =>
    getProductLabel(a).localeCompare(getProductLabel(b), locale === "en" ? "en" : "es")
  );
  const likeLabels = sortedLikes.map((slug) => getProductLabel(slug));
  const dislikeLabels = sortedDislikes.map((slug) => getProductLabel(slug));

  const handleAddToCart = async () => {
    setIsAdding(true);
    // Calcular precio final con extras (usando la variante seleccionada)
    const finalPriceInfo = computeBoxPrice(
      box.ruleId ?? box.id,
      box.price.amount,
      selectedProducts,
      selectedVariant,
      priceLookup,
    );
    const finalPrice = finalPriceInfo.price + finalPriceInfo.extras;

    addItem({
      slug: `${box.slug}-${selectedVariant}`,
      type: "box",
      name: `${boxName} (${selectedVariant.toUpperCase()})`,
      quantity: 1,
      price: finalPrice, // Incluir extras en el precio
      slotValue: 0,
      weightKg: 0,
      configuration: {
        boxId: box.id,
        variant: selectedVariant,
        mix: selectedVariant === "fruity" ? "frutas" : selectedVariant === "veggie" ? "vegetales" : "mix",
        selectedProducts,
        likes: likeLabels,
        dislikes: dislikeLabels,
        price: {
          base: finalPriceInfo.price,
          extras: finalPriceInfo.extras,
          final: finalPrice,
          isACarta: finalPriceInfo.isACarta,
        },
      },
    });
    setTimeout(() => {
      setIsAdding(false);
      onAddToCart();
    }, 500);
  };

  // Render using Portal to escape parent stacking contexts
  if (typeof window === "undefined") return null;

  return createPortal(
    <>
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
                {t("box_customize.title")} {tData(box.name)}
                {box.durationDays && (
                  <span className="text-lg font-normal text-[var(--color-muted)]">
                    {" "}({box.durationDays} {box.durationDays === 1 
                      ? (locale === "en" ? "week" : "semana")
                      : (locale === "en" ? "weeks" : "semanas")})
                  </span>
                )}
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
                {t("box_customize.choose_variant")}
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
                      onClick={() => handleVariantChange(variant)}
                      className={`rounded-xl p-4 border-2 transition-all duration-200 ${isSelected
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
                  {boxImage ? (
                    <Image
                      src={boxImage}
                      alt={boxName}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-contain object-center p-4"
                      unoptimized={boxImage?.startsWith('http') || boxImage?.startsWith('https')}
                      onError={(e) => {
                        // Si falla, intentar con fallbacks
                        const target = e.target as HTMLImageElement;
                        const fallbacks = [
                          box.heroImage,
                          "/images/boxes/placeholder.jpg",
                          "https://greendolio.shop/images/boxes/" + (box.id || box.slug) + ".jpg",
                          "https://greendolio.shop/images/boxes/" + (box.id || box.slug) + ".png",
                        ].filter(Boolean);
                        const currentSrc = target.src;
                        const nextFallback = fallbacks.find(fb => fb && fb !== currentSrc);
                        if (nextFallback && target.src !== nextFallback) {
                          target.src = nextFallback;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--color-background-muted)] text-sm text-[var(--color-muted)]">
                      {boxName}
                    </div>
                  )}
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
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                      <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
                        {totalProducts}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">{t("box_customize.products")}</p>
                    </div>
                    <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🧺</span>
                        <div>
                          <p className="text-sm font-bold text-[var(--gd-color-forest)]">
                            {categories} {t("box_customize.categories")}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted)]">{t("box_customize.in_selection")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tamaño y Peso */}
                  {(dimensions || weight) && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {dimensions && (
                        <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)] mb-1">
                            {t("box_customize.size")}
                          </p>
                          <p className="text-sm font-semibold text-[var(--color-foreground)]">
                            {dimensions}
                          </p>
                        </div>
                      )}
                      {weight && (
                        <div className="rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/20">
                          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)] mb-1">
                            {t("box_customize.calculated_weight")}
                          </p>
                          <p className="text-sm font-semibold text-[var(--color-foreground)]">
                            {formattedWeight}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Precio con extras */}
                  <div className="pt-3 border-t border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
                      {t("box_customize.price")}
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
                            {t("box_customize.extras")}: +RD${priceInfo.extras.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-lg font-bold text-[var(--gd-color-forest)]">
                            {t("box_customize.total")}: RD${totalPrice.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido aproximado */}
              <div className="mt-6 pt-6 border-t border-[var(--gd-color-leaf)]/20">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-xs font-semibold text-[var(--gd-color-forest)]">
                    {t("box_customize.approx_contents")}
                  </p>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {t("box_customize.approx_contents_hint")}
                  </span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {baseProducts.map((item) => {
                    const imageVariations = buildImageVariations(item.productSlug, item.name);
                    return (
                      <div
                        key={item.productSlug}
                        className="flex flex-col items-center rounded-lg bg-white/60 p-2 border border-[var(--gd-color-leaf)]/10"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-background-muted)] mb-1">
                          <ProductImageWithFallback
                            productSlug={item.productSlug}
                            productName={item.name}
                            imageVariations={imageVariations}
                          />
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

            {/* Preferencias */}
            <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/30 bg-white p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--gd-color-forest)]">
                    {t("box_customize.preferences_title")}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {t("box_customize.preferences_subtitle")}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-sprout)]/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--gd-color-forest)]">
                  {t("box_customize.preferences_not_guaranteed")}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)]">
                {t("box_customize.preferences_disclaimer")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {preferenceProducts.map((product) => {
                  const displayName = getProductLabel(product.slug, tData(product.name));
                  const isLiked = likedProducts.has(product.slug);
                  const isDisliked = dislikedProducts.has(product.slug);
                  const imageVariations = buildImageVariations(product.slug, displayName);
                  return (
                    <div
                      key={product.slug}
                      className={`flex flex-col items-center rounded-xl border p-3 transition ${
                        isLiked
                          ? "border-emerald-500/60 bg-emerald-50/40"
                          : isDisliked
                            ? "border-rose-400/60 bg-rose-50/40"
                            : "border-[var(--gd-color-leaf)]/20 bg-white"
                      }`}
                    >
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[var(--color-background-muted)] mb-2">
                        <ProductImageWithFallback
                          productSlug={product.slug}
                          productName={displayName}
                          imageVariations={imageVariations}
                        />
                      </div>
                      <p className="text-xs text-center font-medium text-[var(--color-foreground)] leading-tight">
                        {displayName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleLike(product.slug)}
                          aria-pressed={isLiked}
                          className={`h-7 w-7 rounded-full border text-sm transition ${
                            isLiked
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-[var(--gd-color-leaf)]/30 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30"
                          }`}
                          title={t("box_customize.like_title")}
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDislike(product.slug)}
                          aria-pressed={isDisliked}
                          className={`h-7 w-7 rounded-full border text-sm transition ${
                            isDisliked
                              ? "border-rose-600 bg-rose-600 text-white"
                              : "border-[var(--gd-color-leaf)]/30 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30"
                          }`}
                          title={t("box_customize.dislike_title")}
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--gd-color-leaf)]/20 bg-white/70 p-3">
                  <p className="text-[0.6rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)]">
                    👍 {t("box_customize.likes_label")}
                  </p>
                  {sortedLikes.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {sortedLikes.map((slug) => (
                        <span
                          key={slug}
                          className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                        >
                          {getProductLabel(slug)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-[var(--color-muted)]">{t("box_customize.no_likes")}</p>
                  )}
                </div>
                <div className="rounded-xl border border-[var(--gd-color-leaf)]/20 bg-white/70 p-3">
                  <p className="text-[0.6rem] uppercase tracking-[0.25em] text-[var(--gd-color-forest)]">
                    👎 {t("box_customize.dislikes_label")}
                  </p>
                  {sortedDislikes.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {sortedDislikes.map((slug) => (
                        <span
                          key={slug}
                          className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700"
                        >
                          {getProductLabel(slug)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-[var(--color-muted)]">{t("box_customize.no_dislikes")}</p>
                  )}
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
                {isAdding ? t("box_customize.adding") : t("box_customize.confirm_add")}
              </button>
            </div>
          </div>
        </div>
      </div>

    </>,
    document.body
  );
}
