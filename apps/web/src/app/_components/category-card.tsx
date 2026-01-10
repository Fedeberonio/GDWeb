"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductCategory } from "@/modules/catalog/types";

type CategoryCardProps = {
  category: ProductCategory;
  productCount: number;
};

// Mapeo de categorías a imágenes representativas
const categoryImages: Record<string, string> = {
  "jugos-naturales": "/images/products/jugos-naturales-set.png",
  "cajas": "/images/boxes/box-1-caribbean-fresh-pack-3-dias.jpg",
  "productos-caseros": "/images/products/hummus.jpg",
  "productos-de-granja": "/images/products/huevos-marrones.png",
  "otros": "/images/products/arroz-blanco.jpg",
  "frutas": "/images/products/mango.jpg",
  "vegetales": "/images/products/tomate-redondo.jpg",
  "hierbas-y-especias": "/images/products/ajo.jpg",
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
      className="group block rounded-3xl border-2 border-[var(--color-brand-soft)] bg-white/95 p-6 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[var(--color-brand)] cursor-pointer overflow-hidden"
    >
      {categoryImage && (
        <div className="relative h-40 w-full -mx-6 -mt-6 mb-4 overflow-hidden bg-[var(--color-background-muted)] rounded-t-3xl">
          <Image
            src={categoryImage}
            alt={category.name.es}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{category.slug}</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            productCount > 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {productCount > 0 ? `${productCount} items` : "Próximamente"}
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl text-[var(--color-foreground)] group-hover:text-[var(--color-brand)] transition">
        {category.name.es}
      </h3>
      {category.description?.es && (
        <p className="mt-3 text-sm text-[var(--color-muted)]">{category.description.es}</p>
      )}
      {isDevelopment && (
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
          <span className="rounded-full bg-[color:rgba(212,229,184,0.35)] px-3 py-1">Slug: {category.slug}</span>
          <span className="rounded-full bg-[color:rgba(212,229,184,0.35)] px-3 py-1">
            Estado: {category.status === "active" ? "Activa" : "Inactiva"}
          </span>
        </div>
      )}
    </Link>
  );
}
