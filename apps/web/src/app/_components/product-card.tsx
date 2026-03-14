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

type ProductCardType = "catalog" | "prepared" | "box" | "salad";
type ProductCardControlsPlacement = "front" | "back" | "both";

type ProductCardProps = {
  type?: ProductCardType;
  title: string;
  description?: string;
  image?: ProductCardImage;
  secondaryImage?: ProductCardImage;
  imageContainerClassName?: string;
  imageClassName?: string;
  imageNode?: React.ReactNode;
  imageAction?: React.ReactNode;
  detailsNode?: React.ReactNode;
  backContent?: React.ReactNode;
  detailsCtaLabel?: string;
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
  quickAddAction?: () => void;
  quickAddLabel?: string;
  compactControls?: boolean;
  footerNote?: string;
  disabled?: boolean;
  disableFlip?: boolean;
  controlsPlacement?: ProductCardControlsPlacement;
  isFlipped?: boolean;
  onFlipChange?: (isFlipped: boolean) => void;
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

const minHeightByType: Record<ProductCardType, string> = {
  catalog: "min-h-[520px]",
  prepared: "min-h-[620px]",
  box: "min-h-[780px]",
  salad: "min-h-[620px]",
};

const backSurfaceByType: Record<ProductCardType, string> = {
  catalog: "bg-[var(--gd-color-beige)] border-[var(--color-border)]",
  prepared: "bg-[var(--gd-color-beige)] border-[var(--color-border)]",
  box: "bg-[var(--gd-color-beige)] border-[var(--color-border)]",
  salad: "bg-[var(--gd-color-beige)] border-[var(--color-border)]",
};

export function ProductCard({
  type = "catalog",
  title,
  description,
  image,
  secondaryImage,
  imageContainerClassName,
  imageClassName,
  imageNode,
  imageAction,
  detailsNode,
  backContent,
  detailsCtaLabel,
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
  quickAddAction,
  quickAddLabel,
  compactControls = false,
  footerNote,
  disabled = false,
  disableFlip = false,
  controlsPlacement = "both",
  isFlipped: controlledIsFlipped,
  onFlipChange,
}: ProductCardProps) {
  const { t } = useTranslation();
  const forceBothFaces = type === "catalog" || type === "box" || type === "salad" || type === "prepared";
  const effectiveControlsPlacement = forceBothFaces ? "both" : controlsPlacement;
  const [internalIsFlipped, setInternalIsFlipped] = useState(false);
  const isBoxCard = type === "box";
  const isSaladCard = type === "salad";
  const useCompactControls = compactControls || isBoxCard;
  const canAdjustQuantity = typeof quantity === "number" && onDecrease && onIncrease;
  const isAddDisabled = disabled || !onAdd;
  const isQuickAddDisabled = disabled || !quickAddAction;
  const resolvedAddLabel = addLabel ?? t("common.add_to_cart");
  const resolvedQuickAddLabel = quickAddLabel ?? t("common.add_to_cart");
  const addedToCartLabel = t("common.added_to_cart") || `${t("common.added")} al carrito`;
  const shouldFlip = !disableFlip;
  const isControlled = typeof controlledIsFlipped === "boolean";
  const isFlipped = isControlled ? controlledIsFlipped : internalIsFlipped;
  const backDescription =
    description && description.trim().length > 0
      ? description
      : t("catalog.details_placeholder");
  const showBackControls = effectiveControlsPlacement === "back" || effectiveControlsPlacement === "both";

  const handleFlipChange = (next: boolean) => {
    if (!isControlled) {
      setInternalIsFlipped(next);
    }
    onFlipChange?.(next);
  };

  const ControlsArea = (
    <div className={`w-full ${useCompactControls ? "space-y-2.5" : "space-y-4"}`}>
      {canAdjustQuantity && (
        <div
          className={`flex items-center justify-between rounded-full border border-gray-300 bg-white/80 ${
            useCompactControls ? "gap-3 px-3 py-1.5" : "gap-4 px-4 py-2"
          }`}
        >
          <button
            type="button"
            onClick={onDecrease}
            disabled={quantity !== undefined && quantity <= 1}
            aria-label={t("common.decrease")}
            className={`rounded-full flex items-center justify-center transition-colors ${
              useCompactControls ? "h-7 w-7 text-sm" : "h-8 w-8"
            } ${
              quantity !== undefined && quantity <= 1
                ? "cursor-not-allowed bg-gray-100 text-gray-400 opacity-60"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            −
          </button>
          <span
            className={`min-w-[2rem] text-center font-inter font-semibold text-gray-900 ${
              useCompactControls ? "text-sm" : "text-base"
            }`}
          >
            {quantity ?? 1}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            aria-label={t("common.increase")}
            className={`rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors ${
              useCompactControls ? "h-7 w-7 text-sm" : "h-8 w-8"
            }`}
          >
            +
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={isAddDisabled}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl font-inter font-semibold text-white shadow-md transition-all duration-300 ${
          useCompactControls ? "px-5 py-2.5 text-sm" : "px-6 py-3 text-base"
        } ${
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
  );

  const ImageArea = (
    <div
      className={[
        "relative w-full overflow-hidden rounded-t-[22px] bg-gray-100",
        isBoxCard ? "h-[22rem] sm:h-[24rem] md:h-[25rem] bg-[#efe8d4]" : "aspect-[4/3]",
        imageContainerClassName,
      ]
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
                `object-center transition-transform duration-500 ease-in-out ${isBoxCard ? "group-hover:scale-105" : "group-hover:scale-110"}`,
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
                  `object-center opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 ${isBoxCard ? "group-hover:scale-105" : "group-hover:scale-110"}`,
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
            (isBoxCard || isSaladCard) ? (
              <button
                type="button"
                onClick={() => handleFlipChange(true)}
                aria-label={t("common.view_details")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-orange)] bg-white/95 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gd-color-orange)] shadow-md ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--gd-color-orange)] hover:text-white active:translate-y-0 md:text-sm"
              >
                <Info className="h-4 w-4" />
                <span>{t("common.view_details")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFlipChange(true)}
                aria-label={t("common.view_details")}
                className="rounded-full border border-[var(--gd-color-orange)] bg-white/90 p-2 text-[var(--gd-color-orange)] transition duration-200 hover:bg-[var(--gd-color-orange)] hover:text-white"
              >
                <Info className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );

  const ContentArea = (
    <div className={`flex flex-1 flex-col ${isBoxCard ? "p-4 space-y-2.5" : "p-6 space-y-4"}`}>
      <div>
        <h3 className={`font-caveat leading-tight text-green-700 ${isBoxCard ? "text-[1.9rem] md:text-[2.2rem] mb-1" : "text-2xl md:text-3xl mb-2"}`}>
          {title}
        </h3>
        {description && (
          <p
            className={`font-inter text-sm md:text-base text-gray-600 leading-relaxed ${
              isBoxCard ? "line-clamp-2 mb-1.5 text-[0.95rem] md:text-[1rem]" : "mb-4"
            }`}
          >
            {description}
          </p>
        )}
        {detailsNode && <div>{detailsNode}</div>}
      </div>

      <div className={`flex items-center gap-3 ${isBoxCard ? "pt-0.5" : ""}`}>
        <span className="font-inter text-xs font-medium uppercase tracking-wider text-gray-500">
          {t("common.price")}
        </span>
        <span className="font-inter text-3xl font-bold text-green-600">{priceLabel}</span>
      </div>

      {shouldFlip && detailsCtaLabel && (
        <button
          type="button"
          onClick={() => handleFlipChange(true)}
          className={`inline-flex w-full items-center justify-center text-sm font-semibold transition-all ${
            isBoxCard
              ? "rounded-xl border border-[var(--gd-color-forest)]/25 bg-white px-4 py-2 text-[var(--gd-color-forest)] hover:border-[var(--gd-color-leaf)] hover:bg-[var(--gd-color-sprout)]/60"
              : "rounded-xl border border-[var(--gd-color-forest)]/20 bg-[var(--gd-color-sprout)]/45 px-4 py-2.5 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)] hover:text-white"
          }`}
        >
          {detailsCtaLabel}
        </button>
      )}

      {quickAddAction && (
        <button
          type="button"
          onClick={quickAddAction}
          disabled={isQuickAddDisabled}
          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            isQuickAddDisabled
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "bg-[var(--gd-color-sprout)] text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)] hover:text-white"
          }`}
        >
          + {resolvedQuickAddLabel}
        </button>
      )}

      {footerNote && (
        <p className={`font-inter text-xs text-gray-400 italic whitespace-pre-line ${isBoxCard ? "mt-0.5" : ""}`}>
          {footerNote}
        </p>
      )}

      {(effectiveControlsPlacement === "front" || effectiveControlsPlacement === "both") && (
        <div className="mt-auto">{ControlsArea}</div>
      )}
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
    <article className={`group perspective-1000 h-full ${minHeightByType[type]}`}>
      <div
        className={`relative preserve-3d h-full ${minHeightByType[type]} transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${isFlipped ? "rotate-y-180" : ""}`}
      >
        <div className="absolute inset-0 backface-hidden">
          <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_14px_30px_rgba(13,45,24,0.08)]">
            {ImageArea}
            {ContentArea}
          </div>
        </div>

        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          <div
            className={`flex h-full flex-col overflow-hidden rounded-[24px] border text-[var(--gd-color-forest)] shadow-[0_14px_30px_rgba(13,45,24,0.08)] ${
              isBoxCard ? "p-4" : "p-6"
            } ${backSurfaceByType[type]}`}
          >
            <button
              type="button"
              onClick={() => handleFlipChange(false)}
              className="self-center shrink-0 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gd-color-orange)]"
            >
              {t("common.back")}
            </button>

            <div className={`mt-2 w-full flex-1 min-h-0 ${isBoxCard ? "" : "max-w-md self-center"}`}>
              {showBackControls ? (
                <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
                  <div className="gd-scroll overflow-y-auto pr-1 pb-3">
                    <div
                      className={`w-full space-y-3 text-sm leading-relaxed ${
                        isBoxCard ? "" : "flex flex-col items-center text-center"
                      }`}
                    >
                      <p className="font-display text-xl font-semibold">{t("catalog.details_title")}</p>
                      {backContent ? (
                        <div className="w-full">{backContent}</div>
                      ) : (
                        <>
                          <p className={`max-w-md ${isBoxCard ? "text-center" : ""}`}>{backDescription}</p>
                          {detailsNode}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full shrink-0 border-t border-[var(--gd-color-forest)]/10 bg-[var(--gd-color-beige)] pt-3 pb-1">
                    {ControlsArea}
                  </div>
                </div>
              ) : (
                <div className="gd-scroll h-full overflow-y-auto pr-1">
                  <div
                    className={`w-full space-y-3 text-sm leading-relaxed ${
                      isBoxCard ? "" : "flex flex-col items-center text-center"
                    }`}
                  >
                    <p className="font-display text-xl font-semibold">{t("catalog.details_title")}</p>
                    {backContent ? (
                      <div className="w-full">{backContent}</div>
                    ) : (
                      <>
                        <p className={`max-w-md ${isBoxCard ? "text-center" : ""}`}>{backDescription}</p>
                        {detailsNode}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {footerNote && !isBoxCard && (
              <p className="shrink-0 pt-2 text-center text-xs uppercase tracking-[0.3em] text-[var(--gd-color-text-muted)]">
                {footerNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
