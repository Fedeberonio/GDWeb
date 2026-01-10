"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { getBoxRule, getProductMeta } from "@/modules/box-builder/utils";
import productMetadata from "@/data/productMetadata.json";
import type { Box } from "@/modules/catalog/types";
import { getVariantInfo, type VariantType } from "../box-selector/helpers";
import { ProductImageFallback } from "../product-image-fallback";

type DiscoverBoxViewProps = {
  box: Box;
  variant?: VariantType; // Variante seleccionada (por defecto "mix")
  onAccept: () => void;
  onCustomize: () => void;
};

type BaseItem = {
  slug: string;
  name: string;
  quantity: number;
  category?: string;
  image?: string;
};

// Mapeo de categorías del catálogo a categorías visuales
const categoryMapping: Record<string, string> = {
  "frutas": "fruit_large",
  "vegetales": "root",
  "jugos": "fruit_small",
  "productos-caseros": "otros",
  "productos-de-granja": "otros",
  "otros": "otros",
};

// Función para determinar categoría visual basada en el nombre del producto
function getVisualCategory(slug: string, name: string, catalogCategory?: string): string {
  const nameLower = name.toLowerCase();
  
  // Mapeo específico por nombre
  if (nameLower.includes("lechuga") || nameLower.includes("espinaca") || nameLower.includes("acelga")) {
    return "leafy";
  }
  if (nameLower.includes("limón") || nameLower.includes("limon") || nameLower.includes("naranja") || nameLower.includes("toronja")) {
    return "citrus";
  }
  if (nameLower.includes("ajo") || nameLower.includes("cebolla") || nameLower.includes("cilantro") || nameLower.includes("perejil") || nameLower.includes("jengibre")) {
    return "aromatic";
  }
  if (nameLower.includes("zanahoria") || nameLower.includes("batata") || nameLower.includes("yuca") || nameLower.includes("ñame") || nameLower.includes("papas")) {
    return "root";
  }
  if (nameLower.includes("mango") || nameLower.includes("piña") || nameLower.includes("pina") || nameLower.includes("aguacate") || nameLower.includes("papaya")) {
    return "fruit_large";
  }
  if (nameLower.includes("chinola") || nameLower.includes("fresa") || nameLower.includes("mora")) {
    return "fruit_small";
  }
  
  // Mapeo por categoría del catálogo
  if (catalogCategory && categoryMapping[catalogCategory]) {
    return categoryMapping[catalogCategory];
  }
  
  return "otros";
}

const BOX_RULE_KEY_MAP: Record<string, string> = {
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

function resolveRuleKey(box: Box): string | undefined {
  if (BOX_RULE_KEY_MAP[box.id]) return BOX_RULE_KEY_MAP[box.id];
  if (BOX_RULE_KEY_MAP[box.slug]) return BOX_RULE_KEY_MAP[box.slug];
  if (box.slug.includes("caribbean")) return "GD-CAJA-001";
  if (box.slug.includes("island")) return "GD-CAJA-002";
  if (box.slug.includes("allgreen")) return "GD-CAJA-003";
  return undefined;
}

export function DiscoverBoxView({ box, variant = "mix", onAccept, onCustomize }: DiscoverBoxViewProps) {
  // Expandir todas las categorías por defecto
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const ruleKey = resolveRuleKey(box) || box.id;
  const rule = getBoxRule(ruleKey);
  const baseContents = useMemo(() => rule?.baseContents ?? [], [rule]);
  const variantInfo = getVariantInfo(variant);

  // Filtrar contenido según variante
  const filteredContents = useMemo(() => {
    if (variant === "mix") {
      return baseContents;
    } else if (variant === "fruity") {
      // Fruity: solo frutas tropicales y cítricos, SIN aromáticas de cocina (ajo, cebolla, etc.)
      return baseContents.filter((item: { productSlug: string; quantity: number }) => {
        const meta = productMetadata.find((p) => p.slug === item.productSlug);
        const name = meta?.name ?? item.productSlug;
        const productMeta = getProductMeta(item.productSlug);
        const category = getVisualCategory(item.productSlug, name, productMeta?.category);
        const slugLower = item.productSlug.toLowerCase();
        const nameLower = name.toLowerCase();
        
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
      // veggie
      return baseContents.filter((item: { productSlug: string; quantity: number }) => {
        const meta = productMetadata.find((p) => p.slug === item.productSlug);
        const name = meta?.name ?? item.productSlug;
        const productMeta = getProductMeta(item.productSlug);
        const category = getVisualCategory(item.productSlug, name, productMeta?.category);
        return (
          category === "leafy" ||
          category === "root" ||
          category === "aromatic" ||
          (category !== "fruit_large" && category !== "fruit_small" && category !== "citrus")
        );
      });
    }
  }, [baseContents, variant]);

  const baseItems = useMemo<BaseItem[]>(() => {
    return filteredContents.map((item: { productSlug: string; quantity: number }) => {
      const meta = productMetadata.find((p) => p.slug === item.productSlug);
      const productMeta = getProductMeta(item.productSlug);
      const name = meta?.name ?? item.productSlug;
      
      return {
        slug: item.productSlug,
        name,
        quantity: item.quantity,
        category: getVisualCategory(item.productSlug, name, productMeta?.category),
        image: `/images/products/${item.productSlug}.jpg`,
      };
    });
  }, [filteredContents]);

  // Agrupar productos por categoría
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, BaseItem[]>();
    baseItems.forEach((item) => {
      const category = item.category ?? "otros";
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });
    return grouped;
  }, [baseItems]);

  // Expandir todas las categorías al montar
  useEffect(() => {
    if (itemsByCategory.size > 0 && expandedCategories.size === 0) {
      const timer = setTimeout(() => setExpandedCategories(new Set(itemsByCategory.keys())), 0);
      return () => clearTimeout(timer);
    }
  }, [itemsByCategory, expandedCategories.size]);

  const totalItems = baseItems.reduce((sum, item) => sum + item.quantity, 0);
  const categoryCount = itemsByCategory.size;
  const totalWeight = baseItems.reduce((sum, item) => {
    const meta = getProductMeta(item.slug);
    const weight = meta?.weightKg ?? 0.5;
    return sum + (weight * item.quantity);
  }, 0);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Mapeo de imágenes de cajas
  const boxImages: Record<string, string> = {
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

  const boxImage = boxImages[box.id] || boxImages[box.slug] || box.heroImage || "/images/boxes/placeholder.jpg";

  const categoryLabels: Record<string, string> = {
    leafy: "🥬 Hojas Verdes",
    fruit_large: "🍊 Frutas Grandes",
    fruit_small: "🍓 Frutas Pequeñas",
    root: "🥕 Raíces y Tubérculos",
    aromatic: "🌿 Aromáticas",
    citrus: "🍋 Cítricos",
    otros: "📦 Otros",
  };

  return (
    <div className="space-y-8">
      {/* Header con información destacada */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-sprout)]/40 to-[var(--gd-color-leaf)]/40 px-6 py-2 border-2 border-[var(--gd-color-leaf)]/30">
          <span className="text-2xl">📦</span>
          <span className="text-sm font-bold text-[var(--gd-color-forest)] uppercase tracking-wider">
            Descubre tu caja
          </span>
        </div>
        <h2 className="font-display text-3xl text-[var(--color-foreground)]">
          {box.name.es}
        </h2>
        {/* Badge de variante */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--gd-color-leaf)]/20 px-4 py-2 border-2 border-[var(--gd-color-leaf)]/30">
          <span className="text-xl">{variantInfo.icon}</span>
          <span className="text-sm font-bold text-[var(--gd-color-forest)] uppercase">
            {variant.toUpperCase()} - {variantInfo.tagline}
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed">
          Tu caja viene <strong className="text-[var(--gd-color-forest)]">pre-armada con productos frescos</strong> seleccionados especialmente para ti el mismo día. 
          Todos los productos son de temporada y provienen de productores locales. 💚
        </p>
      </div>

      {/* Resumen rápido */}
      {baseItems.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white p-6 border-2 border-[var(--gd-color-leaf)]/30">
          <h3 className="text-sm font-bold text-[var(--gd-color-forest)] mb-4 uppercase">
            📦 Resumen rápido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--gd-color-forest)]">{totalItems}</p>
              <p className="text-xs text-[var(--color-muted)]">productos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--gd-color-forest)]">{categoryCount}</p>
              <p className="text-xs text-[var(--color-muted)]">categorías</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--gd-color-forest)]">{totalWeight.toFixed(1)}</p>
              <p className="text-xs text-[var(--color-muted)]">kg</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--gd-color-forest)]">
                RD${box.price.amount.toLocaleString("es-DO")}
              </p>
              <p className="text-xs text-[var(--color-muted)]">precio</p>
            </div>
          </div>
          {/* Grid de productos principales */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {baseItems.slice(0, 6).map((item) => (
              <div
                key={item.slug}
                className="flex flex-col items-center rounded-lg bg-white/60 p-2 border border-[var(--gd-color-leaf)]/10"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-background-muted)] mb-1">
                  <ProductImageFallback
                    slug={item.slug}
                    name={item.name}
                    image={item.image}
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <p className="text-xs text-center font-medium text-[var(--color-foreground)] truncate w-full">
                  {item.name}
                </p>
                <p className="text-xs text-[var(--gd-color-forest)] font-bold">x{item.quantity}</p>
              </div>
            ))}
            {baseItems.length > 6 && (
              <div className="flex flex-col items-center justify-center rounded-lg bg-[var(--gd-color-sprout)]/20 p-2 border-2 border-dashed border-[var(--gd-color-leaf)]/30">
                <p className="text-2xl mb-1">+</p>
                <p className="text-xs text-center font-medium text-[var(--gd-color-forest)]">
                  {baseItems.length - 6} más
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista principal: Imagen de caja + Stats */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Imagen de la caja */}
        <div className="relative">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white border-2 border-[var(--gd-color-leaf)]/30 shadow-2xl">
            <Image
              src={boxImage}
              alt={box.name.es}
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-contain object-center p-8"
              priority
            />
            {/* Overlay decorativo */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
          </div>
          
          {/* Badges flotantes con información */}
          <div className="absolute -top-4 -right-4 flex flex-col gap-3 z-10">
            <div className="rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-[var(--gd-color-leaf)]/40 shadow-xl px-4 py-3 text-center min-w-[120px] opacity-0 animate-[fadeIn_0.5s_ease-out_0s_forwards]">
              <p className="text-2xl font-bold text-[var(--gd-color-forest)]">{totalItems}</p>
              <p className="text-xs text-[var(--color-muted)] font-medium">productos</p>
            </div>
            <div className="rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-[var(--gd-color-leaf)]/40 shadow-xl px-4 py-3 text-center min-w-[120px] opacity-0 animate-[fadeIn_0.5s_ease-out_0.1s_forwards]">
              <p className="text-2xl font-bold text-[var(--gd-color-forest)]">{categoryCount}</p>
              <p className="text-xs text-[var(--color-muted)] font-medium">categorías</p>
            </div>
            <div className="rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-[var(--gd-color-leaf)]/40 shadow-xl px-4 py-3 text-center min-w-[120px] opacity-0 animate-[fadeIn_0.5s_ease-out_0.2s_forwards]">
              <p className="text-2xl font-bold text-[var(--gd-color-forest)]">{totalWeight.toFixed(1)}</p>
              <p className="text-xs text-[var(--color-muted)] font-medium">kg</p>
            </div>
          </div>
        </div>

        {/* Información y contenido */}
        <div className="space-y-6">
          {/* Stats destacados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-[var(--gd-color-sprout)]/30 to-white p-4 border-2 border-[var(--gd-color-leaf)]/20">
              <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">Duración</p>
              <p className="text-xl font-bold text-[var(--gd-color-forest)]">
                {box.durationDays ? `${box.durationDays} días` : "Flexible"}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[var(--gd-color-sprout)]/30 to-white p-4 border-2 border-[var(--gd-color-leaf)]/20">
              <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">Precio</p>
              <p className="text-xl font-bold text-[var(--gd-color-forest)]">
                RD${box.price.amount.toLocaleString("es-DO")}
              </p>
            </div>
          </div>

          {/* Contenido organizado por categorías */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[var(--gd-color-forest)]">
                Contenido de tu caja
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-muted)]">
                  {baseItems.length} tipos de productos
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (expandedCategories.size === itemsByCategory.size) {
                      setExpandedCategories(new Set());
                    } else {
                      setExpandedCategories(new Set(itemsByCategory.keys()));
                    }
                  }}
                  className="text-xs font-semibold text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] transition-colors"
                >
                  {expandedCategories.size === itemsByCategory.size ? "Ocultar todo" : "Ver todo"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {Array.from(itemsByCategory.entries()).map(([category, items]) => {
                const isExpanded = expandedCategories.has(category);
                const categoryTotal = items.reduce((sum, item) => sum + item.quantity, 0);
                
                return (
                  <div
                    key={category}
                    className="rounded-xl border-2 border-[var(--gd-color-leaf)]/20 bg-white overflow-hidden transition-all hover:border-[var(--gd-color-leaf)]/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[var(--gd-color-sprout)]/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {categoryLabels[category]?.split(" ")[0] || "📦"}
                        </span>
                        <div className="text-left">
                          <p className="font-semibold text-sm text-[var(--color-foreground)]">
                            {categoryLabels[category]?.split(" ").slice(1).join(" ") || category}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {items.length} {items.length === 1 ? "producto" : "productos"} · {categoryTotal} unidades
                          </p>
                        </div>
                      </div>
                      <span className={`text-[var(--gd-color-leaf)] transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-[var(--gd-color-leaf)]/20 bg-[var(--gd-color-sprout)]/5 p-4 space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.slug}
                            className="flex items-center gap-3 rounded-lg bg-white/60 p-3 border border-[var(--gd-color-leaf)]/10"
                          >
                            <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--color-background-muted)] border border-[var(--gd-color-leaf)]/10">
                              <ProductImageFallback
                                slug={item.slug}
                                name={item.name}
                                image={item.image}
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-[var(--color-muted)]">
                                Cantidad: <strong className="text-[var(--gd-color-forest)]">x{item.quantity}</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Información adicional */}
          <div className="rounded-2xl bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white p-5 border-2 border-[var(--gd-color-leaf)]/30 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">✨</span>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-[var(--gd-color-forest)]">
                  Seleccionados el mismo día
                </p>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Todos los productos son elegidos el mismo día de tu pedido, garantizando máxima frescura y calidad.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2 border-t border-[var(--gd-color-leaf)]/20">
              <span className="text-xl">🌱</span>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-[var(--gd-color-forest)]">
                  Productos de temporada
                </p>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Solo incluimos productos que están en su mejor momento, respetando los ciclos naturales de la tierra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)] to-[var(--gd-color-avocado)] px-8 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
        >
          💚 Me encanta así, continuar
        </button>
        <button
          type="button"
          onClick={onCustomize}
          className="flex-1 rounded-full border-2 border-[var(--gd-color-leaf)] bg-white/90 px-8 py-4 text-base font-bold text-[var(--gd-color-forest)] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:bg-[var(--gd-color-sprout)]/20"
        >
          ✏️ Quiero personalizarla
        </button>
      </div>
    </div>
  );
}
