"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductCategory } from "@/modules/catalog/types";
import { useScrollFadeStagger } from "./use-scroll-fade";

type CategoryHighlightSectionProps = {
  categories: ProductCategory[];
};

const CATEGORY_CONFIG: Record<string, { color: string; description: string; image: string }> = {
  "productos-de-granja": {
    color: "from-green-600 to-emerald-700",
    description: "Productos frescos directamente del campo",
    image: "/images/categories/Productos_de_granja.png",
  },
  "productos-caseros": {
    color: "from-orange-500 to-red-600",
    description: "Elaboración propia, hechos con amor",
    image: "/images/categories/productos_caseros.png",
  },
  "jugos-naturales": {
    color: "from-yellow-400 to-orange-500",
    description: "Jugos naturales de almacén",
    image: "/images/categories/Jugos.png",
  },
  "frutas": {
    color: "from-red-400 to-pink-500",
    description: "Frutas frescas de temporada",
    image: "/images/categories/Frutas.png",
  },
  "vegetales": {
    color: "from-green-500 to-teal-600",
    description: "Vegetales frescos locales",
    image: "/images/categories/Vegetales.png",
  },
  "cajas": {
    color: "from-lime-500 to-green-600",
    description: "Cajas semanales variadas",
    image: "/images/categories/Gemini_Generated_Image_5cai8k5cai8k5cai.png",
  },
  "hierbas-y-especias": {
    color: "from-green-400 to-emerald-500",
    description: "Hierbas aromáticas y especias",
    image: "/images/categories/hierbas_y_especias.png",
  },
  "otros": {
    color: "from-gray-500 to-slate-600",
    description: "Granos y complementos",
    image: "/images/categories/Otros.png",
  },
};

export function CategoryHighlightSection({ categories }: CategoryHighlightSectionProps) {
  // Mostrar todas las categorías activas que tengan configuración (o todas si queremos)
  // Ahora que todas tienen config, filtramos por las que existen en el config para asegurar imagen
  const highlightedCategories = categories
    .filter((cat) => Object.keys(CATEGORY_CONFIG).includes(cat.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const { getItemProps } = useScrollFadeStagger<HTMLAnchorElement>(
    highlightedCategories.length,
    {
      threshold: 0.1,
      rootMargin: "50px",
      delay: 100,
    }
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)]/30 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] text-[var(--gd-color-forest)] shadow-sm">
          🛒 Nuestras Categorías
        </p>
        <h2 className="font-display text-3xl bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] bg-clip-text text-transparent sm:text-4xl">
          Productos Frescos Organizados por Tipo
        </h2>
        <p className="text-sm text-[var(--color-muted)] max-w-2xl mx-auto">
          Explora nuestras categorías principales. Cada producto es seleccionado el mismo día y siempre de temporada.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {highlightedCategories.map((category, index) => {
          const itemProps = getItemProps(index);
          const config = CATEGORY_CONFIG[category.id] || {
            color: "from-gray-500 to-gray-600",
            description: category.description?.es || "",
            image: "/images/hero/hero-mixed-box.jpg",
          };

          return (
            <Link
              key={category.id}
              {...itemProps}
              href="#catalogo"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                window.dispatchEvent(
                  new CustomEvent("categoryFilter", {
                    detail: { categoryId: category.id },
                  })
                );
                document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`group relative overflow-hidden rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[var(--gd-color-leaf)] min-h-[280px] ${itemProps.className}`}
              style={itemProps.style}
            >
              {/* Imagen de fondo - Mucho más visible */}
              <div className="absolute inset-0">
                <Image
                  src={config.image || "/images/hero/hero-mixed-box.jpg"}
                  alt={category.name.es}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  priority={false}
                />
              </div>

              {/* Overlay oscuro para legibilidad del texto */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/60 group-hover:from-black/50 group-hover:via-black/20 group-hover:to-black/50 transition-all duration-300" />

              {/* Overlay de color sutil para darle personalidad */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />

              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-bold text-white drop-shadow-lg">
                    {category.name.es}
                  </h3>
                  <p className="text-sm text-white/90 leading-relaxed font-medium drop-shadow-md">
                    {config.description || category.description?.es}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white mt-4 pt-4 border-t border-white/30 backdrop-blur-sm bg-white/10 rounded-lg px-3 py-2 w-fit">
                  <span>Ver productos</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

