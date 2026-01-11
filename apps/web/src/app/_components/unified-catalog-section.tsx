"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product, ProductCategory } from "@/modules/catalog/types";

interface Props {
  products: Product[];
  categories: ProductCategory[];
}

export function UnifiedCatalogSection({ products, categories }: Props) {
  // Filtrar categorías relevantes (excluir "cajas")
  const visibleCategories = categories.filter((cat) => cat.id !== "cajas");

  // Obtener iconos y colores por categoría
  const getCategoryIcon = (categoryId: string) => {
    const icons: Record<string, string> = {
      frutas: "🍎",
      vegetales: "🥦",
      "productos-caseros": "🏠",
      "productos-granja": "🥚",
      "jugos-naturales": "🥤",
      hierbas: "🌿",
      otros: "📦",
    };
    return icons[categoryId] || "📦";
  };

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      frutas: "from-pink-500/80 to-red-600/80",
      vegetales: "from-green-600/80 to-emerald-700/80",
      "productos-caseros": "from-amber-600/80 to-orange-700/80",
      "productos-granja": "from-yellow-600/80 to-amber-700/80",
      "jugos-naturales": "from-cyan-600/80 to-blue-700/80",
      hierbas: "from-lime-600/80 to-green-700/80",
      otros: "from-slate-600/80 to-gray-700/80",
    };
    return colors[categoryId] || "from-slate-600/80 to-gray-700/80";
  };

  const getCategoryImage = (categoryId: string) => {
    const images: Record<string, string> = {
      frutas: "/images/hero/hero-tropical-fruits.jpg",
      vegetales: "/images/hero/hero-vegetables-left.jpg",
      "productos-caseros": "/images/combos/05_GRIEGA_SIMPLIFICADA.png",
      "productos-granja": "/images/combos/Ensaladaa_Auyama_que_llama.png",
      "jugos-naturales": "/images/combos/03_TROPICAL_QUINOA_PITAHAYA.png",
      hierbas: "/images/hero/hero-gourmet-variety.jpg",
      otros: "/images/hero/hero-mixed-box.jpg",
    };
    return images[categoryId] || "/images/hero/hero-rainbow-abundance.jpg";
  };

  return (
    <section id="catalogo" className="relative bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/20 to-[var(--gd-color-sprout)]/30 px-4 py-2 border-2 border-[var(--gd-color-leaf)]/30">
            <span className="text-sm">🛒</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gd-color-forest)]">
              Nuestras Categorías
            </span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent">
            Productos Frescos Organizados por Tipo
          </h2>

          <p className="text-base text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed">
            Explora nuestras categorías principales. Cada producto es seleccionado el mismo día y
            siempre de temporada.
          </p>
        </header>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCategories.map((category) => {
            const count = products.filter((p) => p.categoryId === category.id).length;
            if (count === 0) return null;

            const icon = getCategoryIcon(category.id);
            const colorClasses = getCategoryColor(category.id);
            const bgImage = getCategoryImage(category.id);

            return (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group relative rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-[var(--gd-color-leaf)]"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={bgImage}
                    alt={category.name.es}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                {/* Overlay gradient for text readability */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses} transition-opacity`} />

                {/* Content */}
                <div className="relative p-8 space-y-4">
                  {/* Icon */}
                  <div className="text-6xl">{icon}</div>

                  {/* Title */}
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white mb-1 drop-shadow-lg">
                      {category.name.es}
                    </h3>
                    {category.description?.es && (
                      <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">
                        {category.description.es}
                      </p>
                    )}
                  </div>

                  {/* Count */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/30">
                    <span className="text-sm font-semibold text-white drop-shadow-md">
                      {count} productos disponibles
                    </span>
                    <span className="text-white group-hover:translate-x-1 transition-transform drop-shadow-md">
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
