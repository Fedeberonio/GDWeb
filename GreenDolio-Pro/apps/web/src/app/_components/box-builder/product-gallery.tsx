"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/modules/catalog/types";
import { ProductSeasonalBadge } from "../product-seasonal-badge";
import { getVisualCategory, type VariantType } from "../box-selector/helpers";
import { ProductImageFallback } from "../product-image-fallback";

const FRUITY_CATEGORIES = new Set(["fruit_large", "fruit_small", "citrus"]);

type ProductGalleryProps = {
  products: Product[];
  selection: Record<string, number>;
  onToggle: (product: Product) => void;
  variantFilter?: VariantType;
  limit?: number;
};

export function ProductGallery({ products, selection, onToggle, variantFilter, limit }: ProductGalleryProps) {
  const [recentlyToggled, setRecentlyToggled] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  // Contar productos únicos seleccionados (con cantidad > 0)
  const selectedCount = useMemo(() => {
    return Object.values(selection).filter((quantity) => quantity && quantity > 0).length;
  }, [selection]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    const isBaby = (p: Product) =>
      p.slug.toLowerCase().includes("baby") || p.tags?.some((tag) => tag.toLowerCase() === "baby-only");
    const visibleProducts = products.filter((p) => !isBaby(p)); // Ocultar baby del catálogo público

    let filtered = visibleProducts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.es.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          p.categoryId.toLowerCase().includes(query)
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((p) => p.categoryId === filterCategory);
    }

    return filtered;
  }, [products, searchQuery, filterCategory]);

  const variantFilteredProducts = useMemo(() => {
    return filteredProducts.filter((product) => {
      if (!variantFilter || variantFilter === "mix") return true;
      const category = getVisualCategory(product.slug, product.name.es, product.categoryId);
      if (variantFilter === "fruity") {
        return FRUITY_CATEGORIES.has(category);
      }
      return !FRUITY_CATEGORIES.has(category);
    });
  }, [filteredProducts, variantFilter]);

  const visibleProducts = typeof limit === "number" ? variantFilteredProducts.slice(0, limit) : variantFilteredProducts;

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.categoryId) cats.add(p.categoryId);
    });
    return Array.from(cats).sort();
  }, [products]);

  const handleToggle = (product: Product) => {
    onToggle(product);
    // Agregar feedback visual temporal
    setRecentlyToggled((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      setTimeout(() => {
        setRecentlyToggled((current) => {
          const updated = new Set(current);
          updated.delete(product.id);
          return updated;
        });
      }, 600);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">Productos disponibles</p>
          <p className="text-sm text-[var(--color-muted)]">
            Haz clic para agregar o quitar productos. <strong className="text-[var(--color-brand)]">Todos provienen de productores locales</strong> y son elegidos el mismo día.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-muted)]">
            {selectedCount} {selectedCount === 1 ? "producto" : "productos"} seleccionado{selectedCount !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--gd-color-leaf)]/30 bg-white px-4 py-2.5 text-sm focus:border-[var(--gd-color-leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/20"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={filterCategory || ""}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            className="rounded-xl border-2 border-[var(--gd-color-leaf)]/30 bg-white px-4 py-2.5 text-sm focus:border-[var(--gd-color-leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/20 min-w-[180px]"
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

      {variantFilteredProducts.length === 0 ? (
        <div className="text-center py-12 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-muted)]">
          <p className="text-lg text-[var(--color-muted)] mb-2">No se encontraron productos</p>
          <p className="text-sm text-[var(--color-muted)]">
            Intenta con otros términos de búsqueda o cambia el filtro de categoría
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => {
          const quantity = selection[product.slug] ?? 0;
          const isSelected = quantity > 0;
          const wasJustToggled = recentlyToggled.has(product.id);
          
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => handleToggle(product)}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                isSelected
                  ? "border-[var(--gd-color-leaf)] bg-gradient-to-br from-[var(--gd-color-sprout)]/30 to-white shadow-lg scale-[1.02]"
                  : "border-[var(--color-border)] bg-white hover:border-[var(--gd-color-leaf)]/60 hover:shadow-md hover:-translate-y-1"
              } ${
                wasJustToggled ? "animate-pulse scale-105" : ""
              }`}
              title={isSelected ? `Quitar ${product.name.es} de tu caja` : `Agregar ${product.name.es} a tu caja`}
            >
              {/* Overlay de acción */}
              {wasJustToggled && (
                <div className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm ${
                  isSelected ? "bg-green-500/20" : "bg-red-500/20"
                } animate-pulse`}>
                  <div className={`rounded-full px-6 py-3 font-bold text-white shadow-xl ${
                    isSelected ? "bg-green-500" : "bg-red-500"
                  }`}>
                    {isSelected ? "✓ Agregado" : "✕ Removido"}
                  </div>
                </div>
              )}
              <div className="relative h-40 w-full overflow-hidden bg-[var(--color-background-muted)]">
                <ProductImageFallback
                  product={product}
                  className="object-cover"
                />
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                  {product.isFeatured && (
                    <span className="rounded-full bg-[var(--color-brand)] px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                      ⭐
                    </span>
                  )}
                  {/* Badge de temporada */}
                  {product.status === "active" && (
                    <ProductSeasonalBadge 
                      isSeasonal={true} 
                      isRefrigerated={product.tags.some(tag => tag.toLowerCase().includes("refrigerado") || tag.toLowerCase().includes("refrigerated"))}
                      className="text-[10px]"
                    />
                  )}
                  {product.status === "coming_soon" && (
                    <ProductSeasonalBadge isSeasonal={false} className="text-[10px]" />
                  )}
                </div>
                {isSelected && (
                  <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)] to-[var(--gd-color-avocado)] px-3 py-1.5 text-xs font-bold text-white shadow-xl flex items-center gap-1.5 z-10">
                    <span className="text-sm">✓</span>
                    <span>x{quantity}</span>
                  </span>
                )}
              </div>
              <div className="p-4 text-left">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)] mb-1">
                  {product.categoryId}
                </p>
                <p className={`font-display text-lg mb-1 transition-colors ${
                  isSelected ? "text-[var(--gd-color-forest)] font-bold" : "text-[var(--color-foreground)]"
                }`}>
                  {product.name.es}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-muted)]">
                    RD${product.price?.amount?.toLocaleString("es-DO") ?? "N/A"}
                  </p>
                  {isSelected && (
                    <span className="text-xs font-semibold text-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/40 px-2 py-0.5 rounded-full">
                      En tu caja
                    </span>
                  )}
                  {!isSelected && (
                    <span className="text-xs text-[var(--color-muted)] italic">
                      Clic para agregar
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        </div>
      )}
    </div>
  );
}
