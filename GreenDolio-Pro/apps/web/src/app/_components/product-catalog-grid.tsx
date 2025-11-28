"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Product, ProductCategory } from "@/modules/catalog/types";
import { useCart } from "@/modules/cart/context";
import { ProductSeasonalBadge } from "./product-seasonal-badge";
import { ProductImageFallback } from "./product-image-fallback";

type ProductCatalogGridProps = {
  products: Product[];
  categories: ProductCategory[];
};


export function ProductCatalogGrid({ products, categories }: ProductCatalogGridProps) {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // Escuchar eventos personalizados de filtrado desde CategoryCard
  useEffect(() => {
    const handleCategoryFilter = (event: Event) => {
      const customEvent = event as CustomEvent<{ categoryId: string }>;
      if (customEvent.detail?.categoryId) {
        setSelectedCategory(customEvent.detail.categoryId);
      }
    };

    window.addEventListener("categoryFilter", handleCategoryFilter);
    return () => {
      window.removeEventListener("categoryFilter", handleCategoryFilter);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Función para detectar productos baby
    const isBaby = (product: Product) =>
      product.slug.toLowerCase().includes("baby") || 
      product.tags?.some((tag) => tag.toLowerCase() === "baby-only");

    return products
      .filter((product) => {
        // Ocultar productos baby del catálogo principal
        if (isBaby(product)) return false;
        if (onlyAvailable && product.status !== "active") return false;
        if (selectedCategory !== "all" && product.categoryId !== selectedCategory) return false;
        if (onlyFeatured && !product.isFeatured) return false;
        if (normalizedQuery.length > 0) {
          const haystack = [
            product.name.es,
            product.description?.es,
            product.slug,
            product.tags.join(" "),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(normalizedQuery)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }
        return a.name.es.localeCompare(b.name.es);
      });
  }, [products, onlyAvailable, selectedCategory, onlyFeatured, query]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(amount);

  const categoryFilters = [
    { id: "all", label: "Todas las categorías" },
    ...categories.map((category) => ({ id: category.id, label: category.name.es })),
  ];

  return (
    <div className="space-y-6">
      {/* Filtros Sticky */}
      <div className="sticky top-0 z-40 rounded-3xl border border-[var(--color-border)] bg-white/95 backdrop-blur-md p-6 shadow-lg space-y-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-brand)]">Filtros</p>
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-sm"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand)]/5"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] focus-within:border-[var(--color-brand)] transition">
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto, categoría o etiqueta..."
              className="flex-1 border-none bg-transparent text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => setOnlyFeatured((state) => !state)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              onlyFeatured
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            }`}
          >
            ⭐ Solo destacados
          </button>

          <button
            type="button"
            onClick={() => setOnlyAvailable((state) => !state)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              onlyAvailable
                ? "bg-[var(--color-success)] text-white shadow-sm"
                : "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-success)] hover:text-[var(--color-success)]"
            }`}
          >
            {onlyAvailable ? "✓ Activos" : "Incluir inactivos"}
          </button>
        </div>
        
        {/* Contador de resultados */}
        <div className="text-xs text-[var(--color-muted)] font-medium">
          {filteredProducts.length} {filteredProducts.length === 1 ? "producto encontrado" : "productos encontrados"}
        </div>
      </div>

      {/* Grid mejorado - 4 columnas en desktop */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product, index) => {
          const price = formatCurrency(product.price.amount);
          const salePrice = product.salePrice ? formatCurrency(product.salePrice.amount) : null;
          const isAdded = addedProductId === product.id;
          const statusLabel =
            product.status === "active"
              ? null
              : product.status === "coming_soon"
                ? "Próximamente"
                : product.status === "inactive"
                  ? "Temporalmente no disponible"
                  : "Descatalogado";

          const nutritionBadges: Array<{ label: string; tone: "green" | "amber" }> = [];
          if (product.nutrition?.organic) nutritionBadges.push({ label: "Orgánico", tone: "green" });
          if (product.nutrition?.vegan) nutritionBadges.push({ label: "Vegano", tone: "green" });
          if (product.nutrition?.glutenFree) nutritionBadges.push({ label: "Gluten Free", tone: "amber" });

          const tagBadges = product.tags.slice(0, 4).map((tag) => ({ label: `#${tag}`, tone: "neutral" as const }));

          // Determinar el estilo de imagen basado en el tipo de producto
          const productName = product.name.es.toLowerCase();
          const productSlug = product.slug.toLowerCase();
          const productTags = product.tags.join(" ").toLowerCase();
          const isBottleProduct = productName.includes("jugo") || productName.includes("juice") || 
                                  productName.includes("china chinola") ||
                                  productSlug.includes("jugo") || productSlug.includes("juice") ||
                                  productSlug.includes("china-chinola") ||
                                  productTags.includes("jugo") || productTags.includes("juice");
          const isPackageProduct = productName.includes("arroz") || productName.includes("habichuela") || 
                                   productName.includes("frijol") || productName.includes("grano") ||
                                   productName.includes("lenteja") || productName.includes("quinoa") ||
                                   productSlug.includes("arroz") || productSlug.includes("habichuela") ||
                                   productSlug.includes("frijol") || productSlug.includes("grano") ||
                                   productSlug.includes("lenteja") || productSlug.includes("quinoa") ||
                                   productTags.includes("arroz") || productTags.includes("habichuela") ||
                                   productTags.includes("lenteja") || productTags.includes("quinoa");
          const isOilProduct = productName.includes("aceite") || productName.includes("oil") ||
                                productSlug.includes("aceite") || productSlug.includes("oil") ||
                                productTags.includes("aceite") || productTags.includes("oil");
          
          // Detectar si es una ensalada
          const isSalad = productName.includes("ensalada") || productSlug.includes("ensalada") ||
                          productTags.includes("ensalada") || productTags.includes("salad") ||
                          product.categoryId?.toLowerCase().includes("ensalada") ||
                          product.categoryId?.toLowerCase().includes("salad");
          
          // Productos que necesitan verse completos (botellas, paquetes, aceites)
          const needsFullView = isBottleProduct || isPackageProduct || isOilProduct;
          const imageClassName = needsFullView 
            ? "object-contain object-center bg-white p-6" 
            : "object-cover";

          // Si es ensalada, mostrar diseño compacto
          if (isSalad) {
            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[var(--color-border)] bg-white shadow-md transition-all duration-300 hover:shadow-lg hover:border-[var(--gd-color-leaf)]"
              >
                {/* Imagen compacta */}
                <div className="relative h-40 w-full overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name.es}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[var(--color-background-muted)] text-xs text-[var(--color-muted)]">
                      Foto en preparación
                    </div>
                  )}
                  {product.isFeatured && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-[var(--color-brand)] shadow-sm">
                      Destacado
                    </span>
                  )}
                </div>
                
                {/* Contenido compacto */}
                <div className="flex flex-1 flex-col space-y-2 p-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-[var(--color-foreground)] line-clamp-2">
                      {product.name.es}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--color-muted)]">{product.unit?.es || "Porción"}</p>
                      <p className="text-base font-bold text-[var(--color-foreground)]">{price}</p>
                    </div>
                  </div>

                  {/* Badges nutricionales compactos */}
                  {(nutritionBadges.length > 0 || product.tags.length > 0) && (
                    <div className="flex flex-wrap gap-1 text-xs">
                      {[...nutritionBadges, ...tagBadges.slice(0, 2)].map((badge) => (
                        <span
                          key={`${product.id}-${badge.label}`}
                          className={`rounded-full px-2 py-0.5 ${
                            badge.tone === "green"
                              ? "bg-[color:rgba(212,229,184,0.5)] text-[var(--color-brand)]"
                              : badge.tone === "amber"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-[var(--color-background-muted)] text-[var(--color-muted)]"
                          }`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Botones */}
                  <div className="mt-auto flex flex-col gap-2">
                    <button
                      onClick={() => {
                        addItem({
                          type: "product",
                          slug: product.slug,
                          name: product.name.es,
                          quantity: 1,
                          price: product.price.amount,
                          image: product.image,
                          slotValue: 1,
                          weightKg: product.logistics?.weightKg ?? 0,
                        });
                        setAddedProductId(product.id);
                        toast.success(`${product.name.es} agregado al carrito 🛒`, {
                          icon: "✅",
                        });
                        setTimeout(() => setAddedProductId(null), 2000);
                      }}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition ${
                        isAdded
                          ? "bg-[var(--gd-color-leaf)]"
                          : "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:from-[var(--gd-color-leaf)] hover:to-[var(--gd-color-avocado)]"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <span>✓</span>
                          <span>Agregado</span>
                        </>
                      ) : (
                        <>
                          <span>🛒</span>
                          <span>Agregar al carrito</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedProductDetails(product)}
                      className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] transition hover:border-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)]"
                    >
                      Ver detalles nutricionales
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          }

          // Diseño normal para otros productos
          return (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-[var(--color-border)] bg-white shadow-soft transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)]"
            >
              <div className={`relative h-56 w-full overflow-hidden ${needsFullView ? "bg-[var(--color-background-muted)]" : ""}`}>
                <ProductImageFallback
                  product={product}
                  className={imageClassName}
                  objectFit={needsFullView ? "contain" : "cover"}
                />
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {product.isFeatured && (
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-brand)] shadow-sm">
                      Destacado
                    </span>
                  )}
                  {/* Badge de temporada - productos activos son de temporada por defecto */}
                  {product.status === "active" && (
                    <ProductSeasonalBadge 
                      isSeasonal={true} 
                      isRefrigerated={product.tags.some(tag => tag.toLowerCase().includes("refrigerado") || tag.toLowerCase().includes("refrigerated"))}
                    />
                  )}
                </div>
                {statusLabel && (
                  <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                    {statusLabel}
                  </span>
                )}
                {/* Badge para productos fuera de temporada */}
                {product.status === "coming_soon" && (
                  <div className="absolute right-4 bottom-4">
                    <ProductSeasonalBadge isSeasonal={false} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col space-y-4 p-5">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg text-[var(--color-foreground)]">{product.name.es}</p>
                      {product.unit?.es && (
                        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">{product.unit.es}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{price}</p>
                      {salePrice && (
                        <p className="text-xs text-[var(--color-muted)] line-through">{salePrice}</p>
                      )}
                    </div>
                  </div>
                  {product.description?.es && (
                    <p className="text-sm text-[var(--color-muted)]">{product.description.es}</p>
                  )}
                </div>

                {(nutritionBadges.length > 0 || product.tags.length > 0) && (
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                    {[...nutritionBadges, ...tagBadges].map((badge) => (
                      <span
                        key={`${product.id}-${badge.label}`}
                        className={`rounded-full px-3 py-1 ${
                          badge.tone === "green"
                            ? "bg-[color:rgba(212,229,184,0.5)] text-[var(--color-brand)]"
                            : badge.tone === "amber"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-[var(--color-background-muted)] text-[var(--color-muted)]"
                        }`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      addItem({
                        type: "product",
                        slug: product.slug,
                        name: product.name.es,
                        quantity: 1,
                        price: product.price.amount,
                        image: product.image,
                        slotValue: 1,
                        weightKg: product.logistics?.weightKg ?? 0,
                      });
                      setAddedProductId(product.id);
                      toast.success(`${product.name.es} agregado al carrito 🛒`, {
                        icon: "✅",
                      });
                      setTimeout(() => setAddedProductId(null), 2000);
                    }}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
                      isAdded
                        ? "bg-[var(--gd-color-leaf)]"
                        : "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:from-[var(--gd-color-leaf)] hover:to-[var(--gd-color-avocado)]"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <span>✓</span>
                        <span>Agregado</span>
                      </>
                    ) : (
                      <>
                        <span>🛒</span>
                        <span>Agregar al carrito</span>
                      </>
                    )}
                  </motion.button>
                  <Link
                    href="#contacto"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)]"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="rounded-3xl border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-muted)]">
          No hay productos que coincidan con los filtros seleccionados. Ajusta la búsqueda o consulta directamente por
          WhatsApp.
        </div>
      )}

      {/* Modal de detalles nutricionales */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedProductDetails(null)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedProductDetails(null)}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-[var(--color-muted)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-foreground)] transition"
            >
              ✕
            </button>
            
            <div className="p-6 space-y-6">
              {/* Imagen */}
              {selectedProductDetails.image && (
                <div className="relative h-64 w-full overflow-hidden rounded-xl">
                  <Image
                    src={selectedProductDetails.image}
                    alt={selectedProductDetails.name.es}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover"
                  />
                </div>
              )}
              
              {/* Información principal */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
                  {selectedProductDetails.name.es}
                </h2>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-muted)]">{selectedProductDetails.unit?.es || "Porción"}</p>
                  <p className="text-xl font-bold text-[var(--color-foreground)]">{formatCurrency(selectedProductDetails.price.amount)}</p>
                </div>
                {selectedProductDetails.description?.es && (
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {selectedProductDetails.description.es}
                  </p>
                )}
              </div>

              {/* Información nutricional */}
              {selectedProductDetails.nutrition && (() => {
                const nutrition = selectedProductDetails.nutrition as
                  | Partial<{
                      calories: number;
                      protein: number;
                      carbs: number;
                      fats: number;
                      fiber: number;
                      sugars: number;
                      vegan: boolean;
                      glutenFree: boolean;
                      organic: boolean;
                    }>
                  | undefined;
                const hasNutritionData =
                  !!nutrition &&
                  (nutrition.calories ||
                    nutrition.protein ||
                    nutrition.carbs ||
                    nutrition.fats ||
                    nutrition.fiber ||
                    nutrition.sugars);
                
                if (!hasNutritionData) return null;
                
                return (
                  <div className="rounded-xl bg-gradient-to-br from-[var(--gd-color-sprout)]/40 to-white p-4 border-2 border-[var(--gd-color-leaf)]/30 space-y-4">
                    <h3 className="text-sm font-bold text-[var(--gd-color-forest)] uppercase">Información Nutricional</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {nutrition.calories && (
                        <div>
                          <span className="text-[var(--color-muted)]">Calorías:</span>
                          <span className="font-semibold ml-2">{nutrition.calories}</span>
                        </div>
                      )}
                      {nutrition.protein && (
                        <div>
                          <span className="text-[var(--color-muted)]">Proteínas:</span>
                          <span className="font-semibold ml-2">{nutrition.protein}g</span>
                        </div>
                      )}
                      {nutrition.carbs && (
                        <div>
                          <span className="text-[var(--color-muted)]">Carbohidratos:</span>
                          <span className="font-semibold ml-2">{nutrition.carbs}g</span>
                        </div>
                      )}
                      {nutrition.fats && (
                        <div>
                          <span className="text-[var(--color-muted)]">Grasas:</span>
                          <span className="font-semibold ml-2">{nutrition.fats}g</span>
                        </div>
                      )}
                      {nutrition.fiber && (
                        <div>
                          <span className="text-[var(--color-muted)]">Fibra:</span>
                          <span className="font-semibold ml-2">{nutrition.fiber}g</span>
                        </div>
                      )}
                      {nutrition.sugars && (
                        <div>
                          <span className="text-[var(--color-muted)]">Azúcares:</span>
                          <span className="font-semibold ml-2">{nutrition.sugars}g</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Badges nutricionales */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedProductDetails.nutrition.organic && (
                        <span className="rounded-full bg-[color:rgba(212,229,184,0.5)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                          Orgánico
                        </span>
                      )}
                      {selectedProductDetails.nutrition.vegan && (
                        <span className="rounded-full bg-[color:rgba(212,229,184,0.5)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                          Vegano
                        </span>
                      )}
                      {selectedProductDetails.nutrition.glutenFree && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Gluten Free
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Botón agregar al carrito */}
              <button
                onClick={() => {
                  addItem({
                    type: "product",
                    slug: selectedProductDetails.slug,
                    name: selectedProductDetails.name.es,
                    quantity: 1,
                    price: selectedProductDetails.price.amount,
                    image: selectedProductDetails.image,
                    slotValue: 1,
                    weightKg: selectedProductDetails.logistics?.weightKg ?? 0,
                  });
                  setAddedProductId(selectedProductDetails.id);
                  setTimeout(() => {
                    setAddedProductId(null);
                    setSelectedProductDetails(null);
                  }, 1500);
                }}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg transition ${
                  addedProductId === selectedProductDetails.id
                    ? "bg-[var(--gd-color-leaf)]"
                    : "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:from-[var(--gd-color-leaf)] hover:to-[var(--gd-color-avocado)]"
                }`}
              >
                {addedProductId === selectedProductDetails.id ? (
                  "✓ Agregado al carrito"
                ) : (
                  "🛒 Agregar al carrito"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
