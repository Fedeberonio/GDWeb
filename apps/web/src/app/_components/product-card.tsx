"use client";

import Image from "next/image";
import { useState } from "react";
import { Info } from "lucide-react";
import { useTranslation } from "@/modules/i18n/use-translation";

type ProductBadge = {
  label: React.ReactNode;
  tone?: "forest" | "leaf" | "red" | "neutral" | "popular" | "bestValue" | "unit" | "glutenFree";
};

type ProductCardImage = {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  sizes?: string;
};

type ProductCardProps = {
  title: string;
  description?: string;
  image?: ProductCardImage;
  secondaryImage?: ProductCardImage;
  imageContainerClassName?: string;
  imageClassName?: string;
  imageNode?: React.ReactNode;
  imageAction?: React.ReactNode;
  detailsNode?: React.ReactNode;
  badges?: ProductBadge[];
  priceLabel: string;
  unitLabel?: string;
  quantity?: number;
  onDecrease?: () => void;
  onIncrease?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  isAdded?: boolean;
  secondaryAction?: React.ReactNode;
  footerNote?: string;
  disabled?: boolean;
  disableFlip?: boolean;
};

const badgeStyles: Record<NonNullable<ProductBadge["tone"]>, string> = {
  forest: "bg-green-600 text-white",
  leaf: "bg-green-500 text-white",
  red: "bg-red-600 text-white",
  neutral: "bg-white/90 text-gray-700 border border-gray-200",
  popular: "flex items-center gap-1 bg-yellow-400 text-yellow-900",
  bestValue: "flex items-center gap-1 bg-green-500 text-white",
  unit: "bg-gray-100 text-gray-700",
  glutenFree: "bg-blue-100 text-blue-700",
};

export function ProductCard({
  title,
  description,
  image,
  secondaryImage,
  imageContainerClassName,
  imageClassName,
  imageNode,
  imageAction,
  detailsNode,
  badges = [],
  priceLabel,
  unitLabel,
  quantity,
  onDecrease,
  onIncrease,
  onAdd,
  addLabel,
  isAdded = false,
  secondaryAction,
  footerNote,
  disabled = false,
  disableFlip = false,
}: ProductCardProps) {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const canAdjustQuantity = typeof quantity === "number" && onDecrease && onIncrease;
  const isAddDisabled = disabled || !onAdd;
  const resolvedAddLabel = addLabel ?? t("common.add_to_cart");
  const addedToCartLabel = t("common.added_to_cart") || `${t("common.added")} al carrito`;
  const shouldFlip = !disableFlip;
  const backDescription =
    description && description.trim().length > 0
      ? description
      : t("catalog.details_placeholder");

  const ImageArea = (
    <div
      className={["relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-gray-100", imageContainerClassName]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute inset-0">
        {imageNode ?? (image && (
          <>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={image.sizes ?? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
              className={[
                `object-${image.fit ?? "cover"}`,
                "object-center transition-transform duration-500 ease-in-out group-hover:scale-110",
                secondaryImage ? "transition-opacity duration-300 group-hover:opacity-0" : "",
                imageClassName ?? "",
              ].join(" ")}
              priority={image.priority}
            />
            {secondaryImage && (
              <Image
                src={secondaryImage.src}
                alt={secondaryImage.alt}
                fill
                sizes={
                  secondaryImage.sizes ??
                  image.sizes ??
                  "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                }
                className={[
                  `object-${secondaryImage.fit ?? image.fit ?? "cover"}`,
                  "object-center opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-110",
                  imageClassName ?? "",
                ].join(" ")}
              />
            )}
          </>
        ))}
      </div>

      {unitLabel && (
        <div className="absolute top-4 left-4 z-10 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-green-700 shadow-sm">
          {unitLabel}
        </div>
      )}

      {(badges.length > 0 || imageAction || (shouldFlip && !imageAction)) && (
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
          {badges.map((badge) => {
            const tone = badge.tone ?? "neutral";
            const isUnitLike = tone === "unit" || tone === "glutenFree";
            return (
              <span
                key={`${tone}-${typeof badge.label === "string" ? badge.label : "badge"}`}
                className={[
                  "rounded-full px-3 py-1.5 shadow-sm uppercase tracking-wide",
                  isUnitLike ? "text-xs font-semibold" : "text-xs font-bold",
                  badgeStyles[tone],
                ].join(" ")}
              >
                {badge.label}
              </span>
            );
          })}

          {imageAction && <div>{imageAction}</div>}

          {shouldFlip && !imageAction && (
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              aria-label={t("common.view_details")}
              className="rounded-full border border-[var(--gd-color-orange)] bg-white/90 p-2 text-[var(--gd-color-orange)] transition duration-200 hover:bg-[var(--gd-color-orange)] hover:text-white"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  const ContentArea = (
    <div className="flex flex-1 flex-col p-6 space-y-4">
      <div>
        <h3 className="font-caveat text-2xl md:text-3xl leading-tight text-green-700 mb-2">
          {title}
        </h3>
        {description && (
          <p className="font-inter text-sm md:text-base text-gray-600 leading-relaxed mb-4">
            {description}
          </p>
        )}
        {detailsNode && <div>{detailsNode}</div>}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-inter text-xs font-medium uppercase tracking-wider text-gray-500">
          {t("common.price")}
        </span>
        <span className="font-inter text-3xl font-bold text-green-600">{priceLabel}</span>
      </div>

      {footerNote && (
        <p className="font-inter text-xs text-gray-400 italic">{footerNote}</p>
      )}

      <div className="mt-auto space-y-4">
        {canAdjustQuantity && (
          <div className="flex items-center justify-between gap-4 rounded-full border border-gray-300 px-4 py-2">
            <button
              type="button"
              onClick={onDecrease}
              disabled={quantity !== undefined && quantity <= 1}
              aria-label={t("common.decrease_quantity")}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                quantity !== undefined && quantity <= 1
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 opacity-60"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              −
            </button>
            <span className="min-w-[2rem] text-center font-inter font-semibold text-base text-gray-900">
              {quantity ?? 1}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              aria-label={t("common.increase_quantity")}
              className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onAdd}
          disabled={isAddDisabled}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-inter font-semibold text-base text-white shadow-md transition-all duration-300 ${
            isAddDisabled
              ? "cursor-not-allowed bg-gray-300"
              : isAdded
                ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:scale-[1.02]"
                : "bg-green-700 hover:bg-green-800 hover:shadow-lg hover:scale-[1.02]"
          }`}
        >
          {isAdded ? `✓ ${addedToCartLabel}` : resolvedAddLabel}
        </button>

        {secondaryAction && <div className="flex justify-start">{secondaryAction}</div>}
      </div>
    </div>
  );

  if (!shouldFlip) {
    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
        {ImageArea}
        {ContentArea}
      </article>
    );
  }

  return (
    <article className="group perspective-1000 h-full min-h-[520px]">
      <div className={`relative preserve-3d h-full min-h-[520px] transition-transform duration-600 ${isFlipped ? "rotate-y-180" : ""}`}>
        <div className="absolute inset-0 backface-hidden">
          <div className="flex h-full flex-col">
            {ImageArea}
            {ContentArea}
          </div>
        </div>
        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          <div className="flex h-full flex-col items-center justify-between overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--gd-color-beige)] p-6 text-[var(--gd-color-forest)] text-center">
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="self-center text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gd-color-orange)]"
            >
              {t("common.back")}
            </button>
            <div className="space-y-3 text-sm leading-relaxed flex flex-col items-center">
              <p className="font-display text-xl font-semibold">{t("catalog.details_title")}</p>
              <p className="max-w-md">{backDescription}</p>
              {detailsNode}
            </div>
            {footerNote && (
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--gd-color-text-muted)]">
                {footerNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
