"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Product, ProductCategory } from "@/modules/catalog/types";
import { useCart } from "@/modules/cart/context";
import { ProductSeasonalBadge } from "@/app/_components/product-seasonal-badge";
import { ProductImageFallback } from "@/app/_components/product-image-fallback";
import { ProductCard } from "@/app/_components/product-card";
import { useTranslation } from "@/modules/i18n/use-translation";

type CategoryProductGridProps = {
  category: ProductCategory;
  products: Product[];
  allCategories: ProductCategory[];
};

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CategoryProductGrid({ category, products, allCategories }: CategoryProductGridProps) {
  const { addItem } = useCart();
  const { t, tData } = useTranslation();
  const [query, setQuery] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

  // Obtener imágenes de fondo por categoría (mismas que en el homepage)
  const getCategoryImage = (categoryId: string) => {
    const images: Record<string, string> = {
      frutas: "/assets/images/categories/frutas.png",
      vegetales: "/assets/images/categories/vegetales.png",
      "productos-caseros": "/assets/images/categories/productos-caseros.png",
      "productos-de-granja": "/assets/images/categories/productos-de-granja.png",
      "productos-granja": "/assets/images/categories/productos-de-granja.png",
      "jugos-naturales": "/assets/images/categories/jugos.png",
      jugos: "/assets/images/categories/jugos.png",
      "hierbas-y-especias": "/assets/images/categories/hierbas-y-especias.png",
      ensaladas: "/assets/images/products/placeholder.png",
      ingredientes: "/assets/images/products/placeholder.png",
      legumbres: "/assets/images/categories/otros.png",
      otros: "/assets/images/categories/otros.png",
    };
    return images[categoryId] || "/assets/images/hero/hero-rainbow-abundance.jpg";
  };

  const cleanCategoryLabel = (label: string) =>
    label
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

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
  }, [products, onlyAvailable, onlyFeatured, query, tData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(amount);

  // Get other categories for navigation
  const otherCategories = allCategories.filter((cat) => cat.id !== "cajas" && cat.id !== category.id);

  const getQuantity = (key: string) => Math.max(1, productQuantities[key] ?? 1);
  const updateQuantity = (key: string, delta: number) => {
    setProductQuantities((prev) => {
      const current = prev[key] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [key]: next };
    });
  };
  const resetQuantity = (key: string) => {
    setProductQuantities((prev) => ({ ...prev, [key]: 1 }));
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
        <div className="sticky top-20 z-[var(--z-sticky)] rounded-2xl border border-[var(--color-border)] bg-white/95 backdrop-blur-md p-4 shadow-md space-y-3">
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
            const displayPrice = formatCurrency(product.salePrice ?? product.price);
            const originalPrice = product.salePrice ? formatCurrency(product.price) : null;
            const isAdded = addedProductId === product.id;
            const quantityKey = product.slug || product.id;
            const quantity = getQuantity(quantityKey);
            const statusLabel =
              product.status === "active"
                ? null
                : product.status === "coming_soon"
                  ? t("catalog.status_coming_soon")
                  : product.status === "inactive"
                    ? t("catalog.status_temp_unavailable")
                    : null;

            const tags = product.tags ?? [];

            const productName = tData(product.name).toLowerCase();
            const productSlug = product.slug.toLowerCase();
            const productTags = tags.join(" ").toLowerCase();
            const isJuiceProduct = productName.includes("jugo") || productName.includes("juice") ||
              productSlug.includes("jugo") || productSlug.includes("juice") ||
              product.categoryId === "jugos-naturales" || product.categoryId === "jugos" ||
              productTags.includes("jugo") || productTags.includes("juice");
            const isPackageProduct = productName.includes("arroz") || productName.includes("habichuela") ||
              productName.includes("lenteja") || productName.includes("quinoa") ||
              productName.includes("rice") || productName.includes("lentil") ||
              productSlug.includes("arroz") || productSlug.includes("habichuela") ||
              productSlug.includes("lenteja") || productSlug.includes("quinoa") ||
              productTags.includes("lenteja") || productTags.includes("quinoa");
            const isOilProduct = productName.includes("aceite") || productName.includes("oil") ||
              productSlug.includes("aceite") || productSlug.includes("oil") ||
              productTags.includes("aceite") || productTags.includes("oil");
            const needsFullView = !isJuiceProduct && (isPackageProduct || isOilProduct);
            const containerClassExtras = needsFullView
              ? "bg-[var(--color-background-muted)] flex items-center justify-center"
              : "";

            const imageKey = product.sku ?? product.id ?? product.slug;
            const resolvedImage = product.image || (imageKey ? `/assets/images/products/${imageKey}.png` : undefined);

            const nutritionHighlights: Array<{ icon: string; label: string; value: string }> = [];
            const calories = toFiniteNumber(product.nutrition?.calories);
            const protein = toFiniteNumber(product.nutrition?.protein);
            const fiber = toFiniteNumber(product.nutrition?.fiber);

            if (calories > 0) nutritionHighlights.push({ icon: "🔥", label: t("salads.calories"), value: `${calories} kcal` });
            if (protein > 0) nutritionHighlights.push({ icon: "💪", label: t("salads.protein"), value: `${protein} g` });
            if (fiber > 0) nutritionHighlights.push({ icon: "🌿", label: t("category.fiber"), value: `${fiber} g` });

            const cardBadges = [
              product.isFeatured ? { label: t("category.featured"), tone: "forest" as const } : null,
              product.nutrition?.organic ? { label: t("catalog.organic"), tone: "leaf" as const } : null,
              product.nutrition?.glutenFree ? { label: t("catalog.gluten_free"), tone: "glutenFree" as const } : null,
              statusLabel ? { label: statusLabel, tone: "neutral" as const } : null,
            ].filter(Boolean).slice(0, 3) as Array<{
              label: string;
              tone: "forest" | "leaf" | "red" | "neutral" | "popular" | "bestValue" | "unit" | "glutenFree";
            }>;

            const addToCart = (quantityToAdd: number, resetAfterAdd: boolean) => {
              addItem({
                type: "product",
                slug: product.slug,
                name: tData(product.name),
                quantity: quantityToAdd,
                price: product.price,
                image: resolvedImage,
                slotValue: 1,
                weightKg: product.logistics?.weightKg ?? 0,
              });

              setAddedProductId(product.id);
              toast.success(`${tData(product.name)} ${t("common.added").toLowerCase()} 🛒`, {
                icon: "✅",
              });

              if (resetAfterAdd) {
                resetQuantity(quantityKey);
              }

              setTimeout(() => {
                setAddedProductId((current) => (current === product.id ? null : current));
              }, 1400);
            };

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="h-full"
              >
                <ProductCard
                  type="catalog"
                  title={tData(product.name)}
                  description={product.description ? tData(product.description) : undefined}
                  imageNode={
                    <ProductImageFallback
                      product={product}
                      image={resolvedImage}
                      objectFit="contain"
                      containerClassName={`${containerClassExtras} !aspect-square !h-full !w-full !rounded-none ${isJuiceProduct ? "!p-1 md:!p-2" : needsFullView ? "!p-2" : "!p-4"}`}
                    />
                  }
                  imageContainerClassName="aspect-square bg-white"
                  detailsNode={
                    <div className="space-y-2">
                      {originalPrice && (
                        <p className="text-xs text-[var(--color-muted)] line-through">
                          {t("common.price")} {originalPrice}
                        </p>
                      )}
                      {product.status === "active" && (
                        <ProductSeasonalBadge
                          isSeasonal={true}
                          isRefrigerated={tags.some((tag) => tag.toLowerCase().includes("refrigerado"))}
                        />
                      )}
                    </div>
                  }
                  backContent={
                    <div className="mx-auto w-full max-w-md space-y-4 text-center">
                      <p className="text-sm leading-relaxed text-[var(--gd-color-forest)]">
                        {product.description ? tData(product.description) : t("catalog.details_placeholder")}
                      </p>

                      {nutritionHighlights.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {nutritionHighlights.slice(0, 4).map((item) => (
                            <div
                              key={`${product.id}-${item.label}`}
                              className="rounded-xl border border-[var(--gd-color-leaf)]/25 bg-white/75 px-3 py-2"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                {item.icon} {item.label}
                              </p>
                              <p className="text-sm font-bold text-[var(--gd-color-forest)]">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {tags.slice(0, 4).map((tag) => (
                            <span
                              key={`${product.id}-${tag}`}
                              className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[var(--gd-color-forest)]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                  badges={cardBadges}
                  priceLabel={displayPrice}
                  unitLabel={product.unit ? tData(product.unit).toUpperCase() : undefined}
                  quantity={quantity}
                  onDecrease={() => updateQuantity(quantityKey, -1)}
                  onIncrease={() => updateQuantity(quantityKey, 1)}
                  onAdd={() => addToCart(quantity, true)}
                  addLabel={t("common.add_to_cart")}
                  isAdded={isAdded}
                  controlsPlacement="both"
                />
              </motion.div>
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
                const categoryImage = getCategoryImage(cat.id);
                const categoryLabel = cleanCategoryLabel(tData(cat.name));
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
                        alt={categoryLabel}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Content */}
                    <div className="relative z-10 w-full p-3 text-center">
                      <span className="text-xs font-bold text-white drop-shadow-md line-clamp-2">
                        {categoryLabel}
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
