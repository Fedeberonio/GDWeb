"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductCategory } from "@/modules/catalog/types";

type CategoryCardProps = {
  category: ProductCategory;
  productCount: number;
};

// Mapeo de categorías a imágenes representativas
// Mapeo de categorías a imágenes representativas
const categoryImages: Record<string, string> = {
  "jugos-naturales": "/images/categories/Jugos.png",
  "cajas": "/images/categories/Gemini_Generated_Image_5cai8k5cai8k5cai.png",
  "productos-caseros": "/images/categories/productos_caseros.png",
  "productos-de-granja": "/images/categories/Productos_de_granja.png",
  "otros": "/images/categories/Otros.png",
  "frutas": "/images/categories/Frutas.png",
  "vegetales": "/images/categories/Vegetales.png",
  "hierbas-y-especias": "/images/categories/hierbas_y_especias.png",
};

export function CategoryCard({ category, productCount }: CategoryCardProps) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const href = `#a-la-carta?category=${category.id}`;
  const categoryImage = categoryImages[category.slug] || categoryImages[category.id];

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("a-la-carta");
    if (target) {
      // Disparar evento personalizado para que ProductCatalogGrid actualice el filtro
      window.dispatchEvent(new CustomEvent("categoryFilter", { detail: { categoryId: category.id } }));
      // Scroll suave a la sección después de un pequeño delay para que el filtro se actualice
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="group relative block w-full overflow-hidden rounded-3xl bg-[var(--color-background-muted)] shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Background Image with Zoom Effect */}
      <div className="aspect-[4/5] w-full overflow-hidden">
        {categoryImage ? (
          <Image
            src={categoryImage}
            alt={category.name.es}
            fill
            sizes="(max-width: 768px) 50vw, 300px"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--gd-color-leaf)]/20 to-[var(--gd-color-sprout)]/20" />
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gd-color-forest)]/90 via-[var(--gd-color-forest)]/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        <div className="translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wider font-bold backdrop-blur-md ${productCount > 0
                ? "bg-white/20 text-white border border-white/30"
                : "bg-amber-500/80 text-white border border-white/20"
                }`}
            >
              {productCount > 0 ? `${productCount} items` : "Próximamente"}
            </span>
          </div>

          <h3 className="font-display text-2xl leading-tight text-white mb-1 drop-shadow-sm">
            {category.name.es}
          </h3>

          {category.description?.es && (
            <p className="text-xs text-white/80 line-clamp-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 delay-75">
              {category.description.es}
            </p>
          )}

          {isDevelopment && (
            <div className="mt-2 text-[10px] text-white/50 font-mono">
              {category.slug}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
