"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import type { Product, ProductCategory } from "@/modules/catalog/types";
import { useTranslation } from "@/modules/i18n/use-translation";

interface Props {
  products: Product[];
  categories: ProductCategory[];
}

export function UnifiedCatalogSection({ products, categories }: Props) {
  const { t, tData } = useTranslation();
  // Filtrar categorías relevantes (excluir "cajas")
  const visibleCategories = categories.filter((cat) => cat.id !== "cajas");

  // Obtener colores por categoría (overlay sutil)
  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      frutas: "from-pink-500/60 to-red-600/60",
      vegetales: "from-green-600/60 to-emerald-700/60",
      "productos-caseros": "from-amber-600/60 to-orange-700/60",
      "productos-de-granja": "from-yellow-600/60 to-amber-700/60",
      "jugos-naturales": "from-cyan-600/60 to-blue-700/60",
      "hierbas-y-especias": "from-lime-600/60 to-green-700/60",
      otros: "from-slate-600/60 to-gray-700/60",
    };
    return colors[categoryId] || "from-slate-600/60 to-gray-700/60";
  };

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
    return images[categoryId] || "/assets/images/hero/hero-lifestyle-kitchen.jpg";
  };

  return (
    <section id="catalogo" className="relative bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center space-y-4 mb-10">
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
        </header>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCategories.map((category) => {
            const count = products.filter((p) => p.categoryId === category.id).length;
            if (count === 0) return null;

            const colorClasses = getCategoryColor(category.id);
            const bgImage = getCategoryImage(category.id);

            return (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group relative rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-[var(--gd-color-leaf)] min-h-[250px] flex flex-col justify-end"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={bgImage}
                    alt={tData(category.name)}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                {/* Overlay gradient for text readability (darker at bottom) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity" />

                {/* Colored Tint Overlay (Optional, very subtle) */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses} opacity-20 mix-blend-overlay`} />

                {/* Content */}
                <div className="relative p-8 space-y-2 z-10">
                  {/* Title */}
                  <div>
                    <h3 className="font-caveat text-2xl md:text-3xl lg:text-4xl leading-tight text-white mb-1 drop-shadow-md">
                      {tData(category.name)}
                    </h3>
                    {category.description && (
                      <p className="font-inter text-sm md:text-base text-white/90 leading-relaxed drop-shadow font-medium line-clamp-2">
                        {tData(category.description)}
                      </p>
                    )}
                  </div>

                  {/* Count */}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
