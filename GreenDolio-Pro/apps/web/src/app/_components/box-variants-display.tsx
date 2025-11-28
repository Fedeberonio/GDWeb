"use client";

import { useEffect, useState } from "react";
import { getVariantInfo, getVisualCategory, type VariantType } from "./box-selector/helpers";
import { getBoxContentsForVariant } from "@/modules/box-builder/utils";
import productMetadata from "@/data/productMetadata.json";
import { ProductImageFallback } from "./product-image-fallback";

type BoxVariantsDisplayProps = {
  baseContents: Array<{ productSlug: string; quantity: number; name: string }>;
  boxId?: string; // ID de la caja para obtener contenidos específicos por variante
  compact?: boolean; // Si es true, muestra versión compacta inicialmente
  onVariantSelect?: (variant: VariantType) => void; // Callback cuando se selecciona una variante
  initialVariant?: VariantType; // Variante preseleccionada (ej: desde la tarjeta)
};

export function BoxVariantsDisplay({
  baseContents,
  boxId,
  compact = false,
  onVariantSelect,
  initialVariant,
}: BoxVariantsDisplayProps) {
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(initialVariant ?? null);
  const [expandedVariant, setExpandedVariant] = useState<VariantType | null>(initialVariant ?? null);
  const variants: VariantType[] = ["mix", "fruity", "veggie"];

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

  // Filtrar contenido según la variante
  // Si hay boxId, usar getBoxContentsForVariant para obtener contenidos específicos
  const getFilteredContents = (variant: VariantType) => {
    // Si hay boxId y existe contenido específico para la variante, usarlo
    if (boxId) {
      const variantContents = getBoxContentsForVariant(boxId, variant);
      if (variantContents.length > 0) {
        return variantContents.map((item) => ({
          ...item,
          name: productMetadata.find((p) => p.slug === item.productSlug)?.name ?? item.productSlug,
        }));
      }
    }

    // Fallback: filtrar baseContents como antes
    if (variant === "mix") {
      // Mix: muestra todo el contenido base (balanceado)
      return baseContents;
    } else if (variant === "fruity") {
      // Fruity: solo frutas tropicales y cítricos, SIN aromáticas de cocina (ajo, cebolla, etc.)
      return baseContents.filter((item) => {
        const meta = productMetadata.find((p) => p.slug === item.productSlug);
        const category = getVisualCategory(item.productSlug, item.name, meta?.category);
        const slugLower = item.productSlug.toLowerCase();
        const nameLower = item.name.toLowerCase();
        
        // Excluir aromáticas de cocina (ajo, cebolla, apio, perejil, cilantro)
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

  const filteredContents = selectedVariant ? getFilteredContents(selectedVariant) : [];
  const variantInfo = selectedVariant ? getVariantInfo(selectedVariant) : { tagline: "", description: "", icon: "" };

  // Agrupar por categoría para mostrar mejor
  const contentsByCategory = filteredContents.reduce((acc, item) => {
    const meta = productMetadata.find((p) => p.slug === item.productSlug);
    const category = getVisualCategory(item.productSlug, item.name, meta?.category);
    const categoryKey = category === "fruit_large" || category === "fruit_small" ? "fruit" : category;
    
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(item);
    return acc;
  }, {} as Record<string, typeof baseContents>);

  const categoryLabels: Record<string, { icon: string; label: string }> = {
    aromatic: { icon: "🌶️", label: "Aromáticas" },
    leafy: { icon: "🥬", label: "Hojas verdes" },
    fruit: { icon: "🍎", label: "Frutas" },
    root: { icon: "🥔", label: "Raíces" },
    citrus: { icon: "🍊", label: "Cítricos" },
    otros: { icon: "📦", label: "Otros" },
  };

  const handleVariantClick = (variant: VariantType) => {
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
    <div className="space-y-3">
      {/* Selector de variantes - Compacto */}
      <div className="flex gap-2">
        {variants.map((variant) => {
          const info = getVariantInfo(variant);
          const isSelected = selectedVariant === variant;
          const isExpanded = expandedVariant === variant;
          const variantContents = getFilteredContents(variant);
          const variantCount = variantContents.length;
          
          return (
            <button
              key={variant}
              type="button"
              onClick={() => handleVariantClick(variant)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 relative border-2 ${
                isSelected && isExpanded
                  ? "bg-[var(--gd-color-leaf)] text-white shadow-md border-[var(--gd-color-leaf)]"
                  : "bg-white/60 text-[var(--color-muted)] hover:bg-[var(--gd-color-sprout)]/40 border-transparent hover:border-[var(--gd-color-leaf)]/30"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">{info.icon}</span>
                <span>{variant.toUpperCase()}</span>
                {compact && (
                  <span className="text-[10px] opacity-75">
                    {variantCount} productos
                  </span>
                )}
              </div>
              {isExpanded && compact && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20">
                  <div className="w-2 h-2 bg-[var(--gd-color-leaf)] rotate-45 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido expandido de la variante seleccionada */}
      {expandedVariant && expandedVariant === selectedVariant && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-center p-3 rounded-lg bg-[var(--gd-color-sprout)]/20 border border-[var(--gd-color-leaf)]/20">
            <p className="text-xs font-bold text-[var(--gd-color-forest)] mb-1">
              {variantInfo.tagline}
            </p>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {variantInfo.description}
            </p>
          </div>

          {/* Contenido completo agrupado por categoría */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {Object.keys(contentsByCategory).length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] text-center py-4">
                Contenido en proceso...
              </p>
            ) : (
              Object.entries(contentsByCategory).map(([category, items]) => {
                const label = categoryLabels[category] || { icon: "📦", label: category };
                const total = items.reduce((sum, item) => sum + item.quantity, 0);
                
                return (
                  <div key={category} className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--gd-color-forest)] flex items-center gap-1.5">
                        <span className="text-base">{label.icon}</span>
                        <span>{label.label}</span>
                      </span>
                      <span className="text-xs font-bold text-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/40 px-2 py-1 rounded-full">
                        {total} unidades
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.productSlug}
                          className="flex items-center justify-between text-xs bg-white/60 rounded px-2 py-1.5"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="relative w-8 h-8 rounded overflow-hidden bg-[var(--color-background-muted)] flex-shrink-0">
                              <ProductImageFallback
                                slug={item.productSlug}
                                name={item.name}
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                            <span className="text-[var(--color-foreground)] font-medium truncate">{item.name}</span>
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

          <div className="pt-2 border-t border-[var(--gd-color-leaf)]/20 text-center">
            <p className="text-xs text-[var(--color-muted)]">
              <strong className="text-[var(--gd-color-forest)]">Total:</strong> {filteredContents.length} productos diferentes · {filteredContents.reduce((sum, item) => sum + item.quantity, 0)} unidades
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
