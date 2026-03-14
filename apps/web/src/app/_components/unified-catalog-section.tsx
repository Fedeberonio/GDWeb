"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { motion, useInView } from "framer-motion";

import type { LocalizedString, Product, ProductCategory } from "@/modules/catalog/types";
import { useTranslation } from "@/modules/i18n/use-translation";

interface Props {
  products: Product[];
  categories: ProductCategory[];
}

const CATALOG_CATEGORY_ORDER = [
  "productos-de-granja",
  "frutas",
  "vegetales",
  "hierbas-y-especias",
  "otros",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "productos-de-granja": "from-yellow-600/60 to-amber-700/60",
  frutas: "from-pink-500/60 to-red-600/60",
  vegetales: "from-green-600/60 to-emerald-700/60",
  "hierbas-y-especias": "from-lime-600/60 to-green-700/60",
  otros: "from-slate-600/60 to-gray-700/60",
};

const CATEGORY_IMAGES: Record<string, string> = {
  "productos-de-granja": "/assets/images/categories/productos-de-granja.png",
  frutas: "/assets/images/categories/frutas.png",
  vegetales: "/assets/images/categories/vegetales.png",
  "hierbas-y-especias": "/assets/images/categories/hierbas-y-especias.png",
  otros: "/assets/images/categories/otros.png",
};

const CATEGORY_LABEL_FALLBACKS: Record<string, LocalizedString> = {
  "productos-de-granja": { es: "Productos de Granja", en: "Farm Products" },
  frutas: { es: "Frutas", en: "Fruits" },
  vegetales: { es: "Vegetales", en: "Vegetables" },
  "hierbas-y-especias": { es: "Hierbas y Especias", en: "Herbs & Spices" },
  otros: { es: "Otros", en: "Others" },
};

function resolveStatus(product: Product): string {
  return String(product.status ?? (product.isActive ? "active" : "inactive")).toLowerCase();
}

function countSellableProducts(products: Product[], categoryId: string): number {
  return products.filter((product) => {
    if (String(product.categoryId ?? "") !== categoryId) return false;
    const status = resolveStatus(product);
    const unitPrice = Number(product.salePrice ?? product.price);
    return status === "active" && Number.isFinite(unitPrice) && unitPrice > 0;
  }).length;
}

export function UnifiedCatalogSection({ products, categories }: Props) {
  const { t, tData } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-15%" });

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const visibleCategories = CATALOG_CATEGORY_ORDER.map((categoryId) => {
    const existing = categoryById.get(categoryId);
    if (existing) return existing;
    return {
      id: categoryId,
      slug: categoryId,
      name: CATEGORY_LABEL_FALLBACKS[categoryId],
      sortOrder: 0,
      status: "active",
    } as ProductCategory;
  });

  return (
    <section ref={sectionRef} id="catalogo" className="relative bg-white py-12 md:py-16 scroll-mt-20 md:scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.header
          className="text-center space-y-4 mb-10"
          initial={{ opacity: 0, x: -72 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -72 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/20 to-[var(--gd-color-sprout)]/30 px-4 py-2 border-2 border-[var(--gd-color-leaf)]/30">
            <ShoppingCart className="w-4 h-4 text-[var(--gd-color-forest)]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gd-color-forest)]">
              {t("catalog.our_categories")}
            </span>
          </div>

          <h2 className="font-fredoka font-semibold text-4xl md:text-5xl text-green-800">
            {t("catalog.organized_by_type")}
          </h2>

          <p className="font-inter text-base md:text-lg text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed font-medium">
            {t("catalog.explore_categories")}
          </p>
        </motion.header>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:[&>*:nth-child(5)]:col-span-2 xl:[&>*:nth-child(5)]:col-start-2 2xl:[&>*:nth-child(5)]:col-span-1 2xl:[&>*:nth-child(5)]:col-start-auto"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } } }}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {visibleCategories.map((category, index) => {
            const count = countSellableProducts(products, category.id);
            const colorClasses = CATEGORY_COLORS[category.id] || "from-slate-600/60 to-gray-700/60";
            const bgImage = CATEGORY_IMAGES[category.id] || "/assets/images/hero/hero-lifestyle-kitchen.jpg";
            const label = tData(category.name);

            return (
              <motion.div
                key={category.id}
                custom={index}
                variants={{
                  hidden: (cardIndex: number) => ({ opacity: 0, x: cardIndex % 2 === 0 ? -80 : 80 }),
                  visible: { opacity: 1, x: 0, transition: { duration: 0.85, ease: "easeOut" } },
                }}
              >
                <Link
                  href={`/categoria/${category.slug}`}
                  className="group relative rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-[var(--gd-color-leaf)] min-h-[250px] flex flex-col justify-end"
                >
                  <div className="absolute inset-0">
                    <Image
                      src={bgImage}
                      alt={label}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses} opacity-20 mix-blend-overlay`} />

                  <div className="relative p-8 space-y-2 z-10">
                    <div>
                      <h3 className="font-caveat text-2xl md:text-3xl lg:text-4xl leading-tight text-white mb-1 drop-shadow-md">
                        {label}
                      </h3>
                      {category.description && (
                        <p className="font-inter text-sm md:text-base text-white/90 leading-relaxed drop-shadow font-medium line-clamp-2">
                          {tData(category.description)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/30">
                      <span className="text-xs font-inter font-bold uppercase tracking-wider text-white drop-shadow-md">
                        {count} {t("catalog.products_count")}
                      </span>
                      <span className="text-white group-hover:translate-x-1 transition-transform drop-shadow-md text-lg">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
