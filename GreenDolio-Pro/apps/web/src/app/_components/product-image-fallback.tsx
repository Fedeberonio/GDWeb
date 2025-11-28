"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/modules/catalog/types";

type ProductImageFallbackProps = {
  product?: Product;
  slug?: string;
  name?: string;
  image?: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
};

// Función para generar variaciones de nombres de archivo
function generateImageVariations(slug: string, name?: string): string[] {
  const variations: string[] = [];
  const basePath = "/images/products/";
  
  // Normalizar el slug
  const slugLower = slug.toLowerCase();
  const slugWithSpaces = slug.replace(/-/g, " ");
  const slugCapitalized = slugWithSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  // Si tenemos el nombre, generar variaciones del nombre también
  if (name) {
    const nameNormalized = name
      .replace(/\(.*?\)/g, "") // Remover paréntesis y su contenido
      .trim()
      .toLowerCase();
    const nameWithSpaces = nameNormalized.replace(/-/g, " ");
    const nameCapitalized = nameWithSpaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    // Variaciones del nombre
    variations.push(`${basePath}${nameCapitalized}.jpg`);
    variations.push(`${basePath}${nameNormalized}.jpg`);
    variations.push(`${basePath}${nameNormalized.replace(/\s+/g, "-")}.jpg`);
    variations.push(`${basePath}${nameNormalized.replace(/\s+/g, "")}.jpg`);
    variations.push(`${basePath}${nameCapitalized}.png`);
    variations.push(`${basePath}${nameNormalized}.png`);
  }
  
  // Variaciones del slug
  variations.push(`${basePath}${slug}.jpg`);
  variations.push(`${basePath}${slugLower}.jpg`);
  variations.push(`${basePath}${slugCapitalized}.jpg`);
  variations.push(`${basePath}${slugWithSpaces}.jpg`);
  variations.push(`${basePath}${slug.replace(/-/g, "")}.jpg`);
  variations.push(`${basePath}${slug}.png`);
  variations.push(`${basePath}${slugLower}.png`);
  
  // Casos especiales conocidos
  const specialCases: Record<string, string[]> = {
    "rosa-maravillosa-1-porcion": ["Rosa Maravillosa.jpg", "rosa-maravillosa.jpg"],
    "china-chinola-1-porcion": ["China Chinola.jpg", "china-chinola.jpg"],
    "pepinada-1-porcion": ["Pepinada.jpg"],
    "tropicalote-1-porcion": ["Tropicalote.jpg"],
    "chimichurri-9-5-oz": ["chimichurri-95-oz.png", "Chimichurri.jpg", "Chimichurri.png"],
  };
  
  if (specialCases[slug]) {
    specialCases[slug].forEach((filename) => {
      variations.push(`${basePath}${filename}`);
    });
  }
  
  // Remover duplicados manteniendo el orden
  return Array.from(new Set(variations));
}

export function ProductImageFallback({
  product,
  slug,
  name,
  image,
  className = "",
  sizes = "(max-width: 768px) 100vw, 400px",
  fill = true,
  width,
  height,
  objectFit = "cover",
}: ProductImageFallbackProps) {
  const productSlug = product?.slug || slug || "";
  const productName = product?.name?.es || name || "";
  const productImage = product?.image || image;

  const [imageSrc, setImageSrc] = useState<string>(`/images/products/${productSlug}.jpg`);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const imageSources = useMemo(() => {
    const sources: string[] = [];
    
    // 1. Si tiene product.image explícito, usarlo primero
    if (productImage && !productImage.startsWith("http")) {
      sources.push(productImage);
    }
    
    // 2. Generar todas las variaciones posibles del slug y nombre
    const variations = generateImageVariations(productSlug, productName);
    variations.forEach((variation) => {
      if (!sources.includes(variation)) {
        sources.push(variation);
      }
    });
    
    // 3. Si product.image es una URL remota, agregarla después de las locales
    if (productImage && productImage.startsWith("http")) {
      sources.push(productImage);
    }
    
    // 4. Intentar URL remota como último recurso
    const remoteVariations = [
      `https://greendolio.shop/images/products/${productSlug}.jpg`,
      `https://greendolio.shop/images/products/${productSlug.toLowerCase()}.jpg`,
      `https://greendolio.shop/images/products/${productSlug}.png`,
    ];
    remoteVariations.forEach((remote) => {
      if (!sources.includes(remote)) {
        sources.push(remote);
      }
    });
    
    return sources;
  }, [productSlug, productName, productImage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setImageSrc(imageSources[0]);
      setHasError(false);
      setAttempt(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [productSlug, imageSources]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const nextAttempt = attempt + 1;
    if (nextAttempt < imageSources.length) {
      setAttempt(nextAttempt);
      const newSrc = imageSources[nextAttempt];
      setImageSrc(newSrc);
      const target = e.target as HTMLImageElement;
      target.onerror = null;
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-muted)] bg-[var(--color-background-muted)]">
        Foto en preparación
      </div>
    );
  }

  const imageProps = fill
    ? {
        fill: true,
        sizes,
      }
    : {
        width: width || 400,
        height: height || 400,
      };

  return (
    <Image
      key={`${productSlug}-${attempt}`}
      src={imageSrc}
      alt={productName}
      {...imageProps}
      className={`${className} object-${objectFit}`}
      onError={handleError}
      unoptimized={imageSrc.startsWith("http")}
    />
  );
}
