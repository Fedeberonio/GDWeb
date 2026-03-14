"use client";

import { Apple, Citrus, Leaf, Package, Salad } from "lucide-react";
import { useEffect, useState } from "react";
import { getVariantInfo, getVisualCategory, type VariantType } from "./box-selector/helpers";
import { useTranslation } from "@/modules/i18n/use-translation";
import type { BoxRule, BoxVariant, Product } from "@/modules/catalog/types";

type BoxVariantsDisplayProps = {
  baseContents: Array<{ productSku: string; quantity: number; name: string }>;
  boxRule?: BoxRule;
  productMap?: Map<string, Product>;
  boxVariants?: BoxVariant[];
  compact?: boolean; // Si es true, muestra versión compacta inicialmente
  onVariantSelect?: (variant: VariantType) => void; // Callback cuando se selecciona una variante
  initialVariant?: VariantType; // Variante preseleccionada (ej: desde la tarjeta)
};

export function BoxVariantsDisplay({
  baseContents,
  boxRule,
  productMap,
  boxVariants,
  compact = false,
  onVariantSelect,
  initialVariant,
}: BoxVariantsDisplayProps) {
  const { t, locale, tData } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(initialVariant ?? null);
  const [expandedVariant, setExpandedVariant] = useState<VariantType | null>(initialVariant ?? null);
  const variants: VariantType[] = ["mix", "fruity", "veggie"];
  const variantIcons: Record<VariantType, React.ReactNode> = {
    mix: <Apple className="w-4 h-4 text-red-500" />,
    fruity: <Citrus className="w-4 h-4 text-orange-500" />,
    veggie: <Salad className="w-4 h-4 text-green-600" />,
  };
  const resolveProduct = (sku: string) => {
    if (!productMap) return undefined;
    return (
      productMap.get(sku) ||
      productMap.get(sku.toLowerCase()) ||
      productMap.get(sku.toUpperCase())
    );
  };

  const resolveProductLabel = (sku: string, fallback?: string) => {
    const product = resolveProduct(sku);
    const localized = product ? tData(product.name) : "";
    return localized || fallback || sku;
  };

  // Sincronizar la variante inicial cuando viene del padre (ej. selección previa en la tarjeta)
  useEffect(() => {
    if (initialVariant) {
      const timer = setTimeout(() => {
        setSelectedVariant(initialVariant);
        setExpandedVariant(initialVariant);
      }, 0);
      return () => clearTimeout(timer);
    } else if (!initialVariant) {
      const timer = setTimeout(() => {
        setSelectedVariant(null);
        setExpandedVariant(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [initialVariant]);

  const normalizedBaseContents = baseContents.map((item) => ({
    ...item,
    name: resolveProductLabel(item.productSku, item.name),
  }));

  const getVariantContentsFromBox = (variant: VariantType) => {
    const variantData = resolveVariantData(variant);
    if (!variantData?.referenceContents?.length) return [];

    return variantData.referenceContents
      .map((item) => {
        const productSku = String(item.productId ?? "").trim();
        const fallbackName = item.name?.[locale] ?? item.name?.es ?? item.name?.en ?? productSku;
        return {
          productSku,
          quantity: Number(item.quantity) || 1,
          name: productSku ? resolveProductLabel(productSku, fallbackName) : fallbackName,
        };
      })
      .filter((item) => item.productSku || item.name);
  };

  // Filtrar contenido según la variante
  const getFilteredContents = (variant: VariantType) => {
    const boxContents = getVariantContentsFromBox(variant);
    if (boxContents.length) {
      return boxContents;
    }

    // Si hay contenido específico para la variante, usarlo
    if (boxRule?.variantContents?.[variant]?.length) {
      return boxRule.variantContents[variant]!.map((item) => ({
        ...item,
        name: resolveProductLabel(item.productSku),
      }));
    }

    // Fallback: filtrar baseContents como antes
    if (variant === "mix") {
      // Mix: muestra todo el contenido base (balanceado)
      return normalizedBaseContents;
    } else if (variant === "fruity") {
      // Fruity: solo frutas tropicales y cítricos, SIN aromáticas de cocina (ajo, cebolla, etc.)
      return normalizedBaseContents.filter((item) => {
        const product = resolveProduct(item.productSku);
        const localizedName = item.name || resolveProductLabel(item.productSku);
        const category = getVisualCategory(item.productSku, localizedName, product?.categoryId);
        const skuLower = item.productSku.toLowerCase();
        const nameLower = localizedName.toLowerCase();

        // Excluir aromáticas de cocina (ajo, cebolla, apio, perejil, cilantro)
        const isCookingAromatic =
          skuLower.includes("ajo") ||
          skuLower.includes("cebolla") ||
          skuLower.includes("apio") ||
          skuLower.includes("perejil") ||
          skuLower.includes("cilantro") ||
          nameLower.includes("ajo") ||
          nameLower.includes("cebolla") ||
          nameLower.includes("apio") ||
          nameLower.includes("perejil") ||
          nameLower.includes("cilantro");

        // Solo incluir frutas y cítricos
        return (
          (category === "fruit_large" ||
            category === "fruit_small" ||
            category === "citrus") &&
          !isCookingAromatic
        );
      });
    } else {
      // Veggie: solo vegetales (hojas, raíces, aromáticas), sin frutas ni cítricos
      return normalizedBaseContents.filter((item) => {
        const product = resolveProduct(item.productSku);
        const localizedName = item.name || resolveProductLabel(item.productSku);
        const category = getVisualCategory(item.productSku, localizedName, product?.categoryId);
        return (
          category === "leafy" ||
          category === "root" ||
          category === "aromatic" ||
          (category !== "fruit_large" && category !== "fruit_small" && category !== "citrus")
        );
      });
    }
  };

  const resolveVariantData = (variant: VariantType) =>
    boxVariants?.find((item) => item.id === variant || item.slug === variant);
  const filteredContents = selectedVariant ? getFilteredContents(selectedVariant) : [];
  const variantInfo = selectedVariant
    ? getVariantInfo(selectedVariant, locale, resolveVariantData(selectedVariant))
    : { tagline: "", description: "", icon: "mix" as const };

  // Agrupar por categoría para mostrar mejor
  const contentsByCategory = filteredContents.reduce((acc, item) => {
    const product = resolveProduct(item.productSku);
    const category = getVisualCategory(item.productSku, item.name, product?.categoryId);
    const categoryKey = category === "fruit_large" || category === "fruit_small" ? "fruit" : category;

    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(item);
    return acc;
  }, {} as Record<string, typeof baseContents>);

  const categoryLabels: Record<string, { icon: React.ReactNode; label: string }> = {
    aromatic: { icon: <Leaf className="w-4 h-4 text-green-600" />, label: t("variants.categories.aromatic") },
    leafy: { icon: <Salad className="w-4 h-4 text-green-600" />, label: t("variants.categories.leafy") },
    fruit: { icon: <Apple className="w-4 h-4 text-red-500" />, label: t("variants.categories.fruit") },
    root: { icon: <Leaf className="w-4 h-4 text-green-600" />, label: t("variants.categories.root") },
    citrus: { icon: <Citrus className="w-4 h-4 text-orange-500" />, label: t("variants.categories.citrus") },
    otros: { icon: <Package className="w-4 h-4 text-green-600" />, label: t("variants.categories.others") },
  };

  const handleVariantClick = (variant: VariantType) => {
    if (compact) {
      setSelectedVariant(variant);
      onVariantSelect?.(variant);
      return;
    }

    // Si la variante ya está seleccionada, deseleccionarla
    if (selectedVariant === variant && expandedVariant === variant) {
      setSelectedVariant(null);
      setExpandedVariant(null);
      return;
    }

    // Seleccionar y expandir la variante
    setSelectedVariant(variant);
    setExpandedVariant(variant);

    // Notificar al componente padre
    onVariantSelect?.(variant);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {/* Selector de variantes - Compacto */}
      <div className={compact ? "grid grid-cols-3 gap-2" : "flex gap-2"}>
        {variants.map((variant) => {
          const info = getVariantInfo(variant, locale, resolveVariantData(variant));
          const isSelected = selectedVariant === variant;
          const isExpanded = expandedVariant === variant;

          return (
            <button
              key={variant}
              type="button"
              onClick={() => handleVariantClick(variant)}
              className={`rounded-lg font-semibold transition-all duration-200 relative border-2 ${
                compact
                  ? `px-2 py-1.5 text-xs md:text-[13px] ${isSelected
                      ? "bg-[var(--gd-color-leaf)] text-white shadow-sm border-[var(--gd-color-leaf)]"
                      : "bg-white/75 text-[var(--color-muted)] hover:bg-[var(--gd-color-sprout)]/45 border-transparent hover:border-[var(--gd-color-leaf)]/30"}`
                  : `flex-1 px-2 py-2 text-sm md:text-base ${isSelected && isExpanded
                      ? "bg-[var(--gd-color-leaf)] text-white shadow-md border-[var(--gd-color-leaf)]"
                      : "bg-white/60 text-[var(--color-muted)] hover:bg-[var(--gd-color-sprout)]/40 border-transparent hover:border-[var(--gd-color-leaf)]/30"}`
              }`}
            >
              <div className={`flex flex-col items-center ${compact ? "gap-0.5" : "gap-1"}`}>
                <span className={compact ? "scale-90" : "text-lg"}>{variantIcons[info.icon]}</span>
                <span className={compact ? "tracking-wide" : ""}>{variant.toUpperCase()}</span>
              </div>
              {isExpanded && compact && !onVariantSelect && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20">
                  <div className="w-2 h-2 bg-[var(--gd-color-leaf)] rotate-45 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido expandido de la variante seleccionada */}
      {!compact && expandedVariant && expandedVariant === selectedVariant && (
        <div
          key={selectedVariant}
          className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="text-center p-3 rounded-lg bg-[var(--gd-color-sprout)]/20 border border-[var(--gd-color-leaf)]/20">
            <p className="text-sm md:text-base font-bold text-[var(--gd-color-forest)] mb-1">
              {variantInfo.tagline}
            </p>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              {variantInfo.description}
            </p>
          </div>

          {/* Contenido completo agrupado por categoría */}
          <div className="space-y-2 pr-1 transition-opacity duration-300">
            {Object.keys(contentsByCategory).length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] text-center py-4">
                {t("discover.content_processing")}
              </p>
            ) : (
              Object.entries(contentsByCategory).map(([category, items]) => {
                const label = categoryLabels[category] || { icon: null, label: category };

                return (
                  <div key={category} className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm md:text-base font-bold text-[var(--gd-color-forest)] flex items-center gap-1.5">
                        {label.icon}
                        <span>{label.label}</span>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.productSku}
                          className="flex items-center justify-between text-sm bg-white/60 rounded px-2 py-1.5"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-[var(--color-foreground)] font-medium truncate">
                              {resolveProductLabel(item.productSku, item.name)}
                            </span>
                          </div>
                          <span className="font-bold text-[var(--gd-color-forest)] whitespace-nowrap ml-2">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>


        </div>
      )}
    </div>
  );
}
