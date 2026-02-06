"use client";

import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import type { Product } from "@/modules/catalog/types";

type ProductImageFallbackProps = {
  product?: Product;
  slug?: string;
  name?: string;
  image?: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
};

export function ProductImageFallback({
  product,
  slug,
  name,
  image,
  className = "",
  containerClassName = "",
  sizes = "(max-width: 768px) 100vw, 400px",
  objectFit = "cover",
}: ProductImageFallbackProps) {
  const skuKey =
    product?.sku ||
    (product as { metadata?: { sku?: string; referenceId?: string } })?.metadata?.sku ||
    (product as { metadata?: { sku?: string; referenceId?: string } })?.metadata?.referenceId ||
    "";
  const idKey = product?.id || "";
  const slugKey = product?.slug || slug || "";
  const stableKey = skuKey || idKey || "";
  const rawKey = stableKey || slugKey;
  const rawName = product?.name?.es || product?.name?.en || name || "";
  const productKey = rawKey;
  const productName = rawName;
  const rawImage = product?.image || image;
  const isBoxProduct =
    product?.categoryId === "cajas" ||
    product?.slug?.toLowerCase().includes("box") ||
    productKey.toUpperCase().startsWith("GD-CAJA");
  const isComboProduct =
    product?.categoryId?.toLowerCase().includes("combo") ||
    product?.slug?.toLowerCase().includes("combo") ||
    productKey.toUpperCase().startsWith("GD-COMB") ||
    productKey.toUpperCase().startsWith("COMBO-");
  const comboAliasMap: Record<string, string> = {
    "COMBO-DETOX": "GD-COMB-001.png",
    "COMBO-MEDITERR": "GD-COMB-002.png",
    "COMBO-TROPICAL": "GD-COMB-003.png",
  };
  const comboAlias = comboAliasMap[productKey.toUpperCase()];

  const [imageSrc, setImageSrc] = useState<string>(`/assets/images/products/${productKey}.png`);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const imageSources = useMemo(() => {
    const sources: string[] = [];

    const isLocalImage = rawImage && !rawImage.startsWith("http");
    const isBoxImage = typeof rawImage === "string" && rawImage.includes("/assets/images/boxes/");
    const isProductImage = typeof rawImage === "string" && rawImage.includes("/assets/images/products/");
    const isComboImage = typeof rawImage === "string" && rawImage.includes("/assets/images/combos/");

    if (isLocalImage && (!isBoxProduct || isBoxImage)) {
      if (isComboProduct && !isComboImage && !rawImage?.startsWith("/")) {
        sources.push(`/assets/images/combos/${rawImage}`);
      } else {
        sources.push(rawImage as string);
      }
    }

    if (isBoxProduct && productKey) {
      sources.push(`/assets/images/boxes/${productKey}.png`);
      sources.push(`/assets/images/boxes/${productKey}.jpg`);
    }

    if (isComboProduct && productKey) {
      if (comboAlias) {
        sources.push(`/assets/images/combos/${comboAlias}`);
      }
      sources.push(`/assets/images/combos/${productKey}.png`);
      sources.push(`/assets/images/combos/${productKey}.jpg`);
      sources.push(`/assets/images/combos/${productKey}.jpeg`);
      const digits = productKey.match(/\d+/)?.[0];
      if (digits) {
        const padded = digits.padStart(3, "0");
        sources.push(`/assets/images/combos/GD-COMB-${padded}.png`);
      }
    }

    if (productKey && !isBoxProduct && !isComboProduct) {
      sources.push(`/assets/images/products/${productKey}.png`);
      sources.push(`/assets/images/products/${productKey}.jpg`);
      sources.push(`/assets/images/products/${productKey}.jpeg`);
    }

    if (rawImage && rawImage.startsWith("http")) {
      sources.push(rawImage);
    }

    if (isBoxProduct && isProductImage) {
      sources.push(rawImage as string);
    }

    if (isComboProduct && isProductImage) {
      sources.push(rawImage as string);
    }

    sources.push("/assets/images/products/placeholder.png");
    return sources;
  }, [productKey, rawImage, isBoxProduct, isComboProduct, comboAlias]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setImageSrc(imageSources[0]);
      setHasError(false);
      setAttempt(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [productKey, imageSources]);

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

  const imageClass = `${className} absolute inset-0 h-full w-full object-${objectFit} transition-transform duration-500 ease-in-out group-hover:scale-110`;
  const containerClasses = `relative aspect-square w-full overflow-hidden rounded-2xl bg-white p-4 ${containerClassName}`;

  if (hasError) {
    return (
      <div className={containerClasses}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-[var(--color-muted)]">
          <Package className="h-6 w-6 text-[var(--color-muted)]" />
          <span>Imagen no disponible</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <img
        key={`${productKey}-${attempt}`}
        src={imageSrc}
        alt={productName}
        className={imageClass}
        onError={handleError}
      />
    </div>
  );
}
