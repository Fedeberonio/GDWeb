"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { Info } from "lucide-react";
import type { Product, ProductCategory } from "@/modules/catalog/types";
import { useCart } from "@/modules/cart/context";
import { ProductSeasonalBadge } from "@/app/_components/product-seasonal-badge";
import { ProductImageFallback } from "@/app/_components/product-image-fallback";
import { useTranslation } from "@/modules/i18n/use-translation";

type CategoryProductGridProps = {
  category: ProductCategory;
  products: Product[];
  allCategories: ProductCategory[];
};

export function CategoryProductGrid({ category, products, allCategories }: CategoryProductGridProps) {
  const { addItem } = useCart();
  const { t, tData } = useTranslation();
  const [query, setQuery] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Obtener iconos por categoría
  const getCategoryIcon = (categoryId: string) => {
    const icons: Record<string, string> = {
      frutas: "🍎",
      vegetales: "🥦",
      "productos-caseros": "🏠",
      "productos-de-granja": "🥚",
      "jugos-naturales": "🥤",
      "hierbas-y-especias": "🌿",
      otros: "📦",
    };
    return icons[categoryId] || "📦";
  };

  // Obtener imágenes de fondo por categoría (mismas que en el homepage)
  const getCategoryImage = (categoryId: string) => {
    const images: Record<string, string> = {
      frutas: "/assets/images/categories/frutas.png",
      vegetales: "/assets/images/categories/vegetales.png",
      "productos-caseros": "/assets/images/categories/productos-caseros.png",
      "productos-de-granja": "/assets/images/categories/productos-de-granja.png",
      "jugos-naturales": "/assets/images/categories/jugos.png",
      "hierbas-y-especias": "/assets/images/categories/hierbas-y-especias.png",
      otros: "/assets/images/categories/otros.png",
    };
    return images[categoryId] || "/assets/images/hero/hero-rainbow-abundance.jpg";
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const resolveStatus = (product: Product) => product.status ?? (product.isActive ? "active" : "inactive");

    // Función para detectar productos baby
    const isBaby = (product: Product) =>
      product.slug.toLowerCase().includes("baby") ||
      product.tags?.some((tag) => tag.toLowerCase() === "baby-only");

    return products
      .filter((product) => {
        // Ocultar productos baby del catálogo principal
        if (isBaby(product)) return false;
        if (onlyAvailable && resolveStatus(product) !== "active") return false;
        if (onlyFeatured && !product.isFeatured) return false;
        if (normalizedQuery.length > 0) {
          const haystack = [
            tData(product.name),
            tData(product.description),
            product.slug,
            product.tags?.join(" ") ?? "",
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
        return tData(a.name).localeCompare(tData(b.name));
      });
  }, [products, onlyAvailable, onlyFeatured, query]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(amount);

  const categoryIcon = getCategoryIcon(category.id);

  // Get other categories for navigation
  const otherCategories = allCategories.filter((cat) => cat.id !== "cajas" && cat.id !== category.id);

  const getQuantity = (slug: string) => Math.max(1, productQuantities[slug] ?? 1);
  const updateQuantity = (slug: string, delta: number) => {
    setProductQuantities((prev) => {
      const current = prev[slug] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [slug]: next };
    });
  };
  const resetQuantity = (slug: string) => {
    setProductQuantities((prev) => ({ ...prev, [slug]: 1 }));
  };
  const renderQuantitySelector = (slug: string) => {
    const quantity = getQuantity(slug);
    return (
      <div className="flex w-full max-w-xs items-center justify-between rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
          {t("common.quantity")}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuantity(slug, -1)}
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
            className={`h-7 w-7 rounded-full border text-sm font-semibold transition ${
              quantity <= 1
                ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-40"
                : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background-muted)]"
            }`}
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => updateQuantity(slug, 1)}
            aria-label="Aumentar cantidad"
            className="h-7 w-7 rounded-full border border-[var(--color-border)] text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-background-muted)]"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero de categoría - Compacto */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-avocado)] py-8 md:py-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-white/80">
            <Link href="/" className="hover:text-white transition">
              {t("category.breadcrumb_home")}
            </Link>
            <span>→</span>
            <Link href="/#catalogo" className="hover:text-white transition">
              {t("category.breadcrumb_catalog")}
            </Link>
            <span>→</span>
            <span className="text-white font-semibold">{tData(category.name)}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="text-6xl md:text-7xl">{categoryIcon}</div>
            <div className="flex-1 space-y-3">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white drop-shadow-lg">
                {tData(category.name)}
              </h1>
              {category.description && (
                <p className="text-base md:text-lg text-white/90 max-w-3xl leading-relaxed">
                  {tData(category.description)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-white/80">
                <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  {filteredProducts.length} {filteredProducts.length === 1 ? t("category.product") : t("category.product_plural")}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  {t("category.fresh_today")}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  {t("category.organic")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filtros */}
        <div className="sticky top-20 z-30 rounded-2xl border border-[var(--color-border)] bg-white/95 backdrop-blur-md p-4 shadow-md space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] focus-within:border-[var(--color-brand)] transition">
              <span className="text-xs">🔍</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`${t("category.search_placeholder")} ${tData(category.name).toLowerCase()}...`}
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
              ⭐ {t("catalog.only_featured")}
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
              {onlyAvailable ? t("category.active") : t("category.include_inactive")}
            </button>
          </div>

          {/* Contador de resultados */}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
            <span className="text-xs text-[var(--color-muted)] font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? t("category.product_found") : t("category.products_found")}
            </span>
            <Link
              href="/#catalogo"
              className="text-xs font-semibold text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] transition"
            >
              {t("category.back_all_categories")}
            </Link>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, index) => {
            const price = formatCurrency(product.price);
            const salePrice = product.salePrice ? formatCurrency(product.salePrice) : null;
            const isAdded = addedProductId === product.id;
            const quantity = getQuantity(product.slug);
            const statusLabel =
              product.status === "active"
                ? null
                : product.status === "coming_soon"
                  ? t("catalog.status_coming_soon")
                  : product.status === "inactive"
                    ? t("catalog.status_temp_unavailable")
                    : null;

            const nutritionBadges: Array<{ label: string; tone: "green" | "amber" }> = [];
            if (product.nutrition?.organic) nutritionBadges.push({ label: t("catalog.organic"), tone: "green" });
            if (product.nutrition?.vegan) nutritionBadges.push({ label: t("catalog.vegan"), tone: "green" });
            if (product.nutrition?.glutenFree) nutritionBadges.push({ label: t("catalog.gluten_free"), tone: "amber" });

            const tags = product.tags ?? [];
            const tagBadges = tags.slice(0, 4).map((tag) => ({ label: `#${tag}`, tone: "neutral" as const }));

            // Determinar el estilo de imagen
            const productName = tData(product.name).toLowerCase();
            const productSlug = product.slug.toLowerCase();
            const productTags = tags.join(" ").toLowerCase();
            const isBottleProduct = productName.includes("jugo") || productName.includes("juice") || 
              productSlug.includes("jugo") || productSlug.includes("juice") ||
              product.categoryId === "jugos-naturales" || productTags.includes("jugo") || productTags.includes("juice");
            const isPackageProduct = productName.includes("arroz") || productName.includes("habichuela") || 
              productName.includes("lenteja") || productName.includes("quinoa") ||
              productName.includes("rice") || productName.includes("lentil") ||
              productSlug.includes("arroz") || productSlug.includes("habichuela") ||
              productSlug.includes("lenteja") || productSlug.includes("quinoa") ||
              productTags.includes("lenteja") || productTags.includes("quinoa");
            const isOilProduct = productName.includes("aceite") || productName.includes("oil") ||
              productSlug.includes("aceite") || productSlug.includes("oil") ||
              productTags.includes("aceite") || productTags.includes("oil");
            const needsFullView = isBottleProduct || isPackageProduct || isOilProduct;
            const containerClassExtras = needsFullView
              ? "bg-[var(--color-background-muted)] flex items-center justify-center"
              : "";

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group perspective-1000 h-full"
              >
                <div className={`relative preserve-3d h-full min-h-[540px] transition-transform duration-600 ${flippedCards[product.id] ? "rotate-y-180" : ""}`}>
                  <div className="absolute inset-0 backface-hidden">
                    <div className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-[var(--color-border)] bg-white shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:border-[var(--gd-color-leaf)]">
                      <div className="relative aspect-square w-full overflow-hidden">
                        <ProductImageFallback
                          product={product}
                          containerClassName={containerClassExtras}
                          objectFit="contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFlippedCards((prev) => ({ ...prev, [product.id]: true }))
                          }
                          aria-label={t("common.view_details")}
                          className="absolute right-4 top-4 rounded-full border border-[var(--gd-color-orange)] bg-white/90 p-2 text-[var(--gd-color-orange)] transition duration-200 hover:bg-[var(--gd-color-orange)] hover:text-white"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <div className="absolute left-4 top-4 flex flex-col gap-2">
                          {product.isFeatured && (
                            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-brand)] shadow-sm">
                              {t("category.featured")}
                            </span>
                          )}
                          {product.status === "active" && (
                            <ProductSeasonalBadge
                              isSeasonal={true}
                              isRefrigerated={tags.some(tag => tag.toLowerCase().includes("refrigerado"))}
                            />
                          )}
                        </div>
                        {statusLabel && (
                          <span className="absolute right-4 top-14 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                            {statusLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col space-y-4 p-5 text-center items-center">
                        <div className="space-y-2 w-full flex flex-col items-center">
                          <div className="flex flex-col items-center gap-1 w-full">
                            <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-foreground)] w-full">{tData(product.name)}</p>
                            {product.unit && (
                              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">{tData(product.unit)}</p>
                            )}
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-sm sm:text-base font-semibold text-[var(--color-foreground)]">{price}</p>
                              {salePrice && (
                                <p className="text-xs text-[var(--color-muted)] line-through">{salePrice}</p>
                              )}
                            </div>
                          </div>
                          {product.description && (
                            <p className="text-sm sm:text-base text-[var(--color-muted)] line-clamp-2 max-w-md">{tData(product.description)}</p>
                          )}
                        </div>

                        {(nutritionBadges.length > 0 || tags.length > 0) && (
                          <div className="flex flex-wrap justify-center gap-2 text-xs text-[var(--color-muted)]">
                            {[...nutritionBadges, ...tagBadges].slice(0, 4).map((badge) => (
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

                        <div className="mt-auto flex flex-col gap-2 w-full items-center">
                          {renderQuantitySelector(product.slug)}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const imageKey = product.sku ?? product.id ?? product.slug;
                              addItem({
                                type: "product",
                                slug: product.slug,
                                name: tData(product.name),
                                quantity,
                                price: product.price,
                                image: product.image || (imageKey ? `/assets/images/products/${imageKey}.png` : undefined),
                                slotValue: 1,
                                weightKg: product.logistics?.weightKg ?? 0,
                              });
                              setAddedProductId(product.id);
                              toast.success(`${tData(product.name)} ${t("common.added").toLowerCase()} 🛒`, {
                                icon: "✅",
                              });
                              resetQuantity(product.slug);
                              setTimeout(() => setAddedProductId(null), 2000);
                            }}
                            className={`inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                              isAdded
                                ? "bg-[var(--gd-color-leaf)]"
                                : "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:from-[var(--gd-color-leaf)] hover:to-[var(--gd-color-avocado)]"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <span>✓</span>
                                <span>{t("common.added")}</span>
                              </>
                            ) : (
                              <>
                                <span>🛒</span>
                                <span>{t("common.add_to_cart")}</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 rotate-y-180 backface-hidden">
                    <div className="flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl border-2 border-[var(--color-border)] bg-[var(--gd-color-beige)] p-6 text-[var(--gd-color-forest)] text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setFlippedCards((prev) => ({ ...prev, [product.id]: false }))
                        }
                        className="self-center text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gd-color-orange)]"
                      >
                        {t("common.back")}
                      </button>
                      <div className="space-y-3 text-sm leading-relaxed flex flex-col items-center">
                        <p className="font-display text-xl font-semibold">{t("catalog.details_title")}</p>
                        <p className="max-w-md">{product.description ? tData(product.description) : t("catalog.details_placeholder")}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--gd-color-text-muted)]">
                        {t("common.price")} • {price}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-12 text-center space-y-3">
            <p className="text-2xl">🔍</p>
            <p className="text-lg font-semibold text-[var(--color-foreground)]">{t("category.no_matches")}</p>
            <p className="text-sm text-[var(--color-muted)]">
              {t("category.no_matches_desc")}
            </p>
          </div>
        )}

        {/* Otras categorías - Compacto */}
        {otherCategories.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--gd-color-sprout)]/10 to-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-[var(--gd-color-forest)]">
                {t("category.explore_other")}
              </h2>
              <Link
                href="/#catalogo"
                className="text-sm font-semibold text-[var(--gd-color-leaf)] hover:text-[var(--gd-color-forest)] transition"
              >
                {t("category.view_all")}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {otherCategories.slice(0, 5).map((cat) => {
                const icon = getCategoryIcon(cat.id);
                const categoryImage = getCategoryImage(cat.id);
                return (
                  <Link
                    key={cat.id}
                    href={`/categoria/${cat.slug}`}
                    className="group relative flex flex-col items-center justify-end gap-2 rounded-xl border-2 border-[var(--color-border)] overflow-hidden min-h-[140px] transition-all hover:border-[var(--gd-color-leaf)] hover:shadow-lg hover:-translate-y-1"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <Image
                        src={categoryImage}
                        alt={tData(cat.name)}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    
                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    
                    {/* Content */}
                    <div className="relative z-10 w-full p-3 text-center">
                      <span className="text-2xl mb-1 block drop-shadow-lg">{icon}</span>
                      <span className="text-xs font-bold text-white drop-shadow-md line-clamp-2">
                        {tData(cat.name)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA de regreso */}
        <div className="text-center py-8">
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <span>←</span>
            <span>{t("category.back_full_catalog")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
