"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion, useInView } from "framer-motion";
import { useCart } from "@/modules/cart/context";
import type { Box, BoxRule, Product } from "@/modules/catalog/types";
import { Info } from "lucide-react";

import { useTranslation } from "@/modules/i18n/use-translation";
import { ProductCard } from "./product-card";
import { BoxVariantsDisplay } from "./box-variants-display";
import { BoxAddModeDialog } from "./box-add-mode-dialog";
import { BoxPreferencesModal } from "./box-preferences-modal";
import type { VariantType } from "./box-selector/helpers";

function resolveBoxImage(heroImage: string | undefined, boxId: string): string {
  const normalizedHeroImage = typeof heroImage === "string" ? heroImage.trim() : "";
  return normalizedHeroImage || `/assets/images/boxes/${boxId}.png`;
}

type BoxesGridProps = {
  boxes: Box[];
  prebuiltBoxes: Array<{
    box: Box;
    rule?: BoxRule;
    baseContents: Array<{
      productSku: string;
      quantity: number;
      name: string;
    }>;
  }>;
  products: Product[];
  boxRules: BoxRule[];
};

export function BoxesGrid({ boxes, prebuiltBoxes, products, boxRules }: BoxesGridProps) {
  const { t, tData } = useTranslation();
  const { addItem } = useCart();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const isGridInView = useInView(gridRef, { once: true, margin: "-15%" });
  const [editingBox, setEditingBox] = useState<{ box: Box; quantity: number } | null>(null);
  const [addChoiceBox, setAddChoiceBox] = useState<{ box: Box; quantity: number } | null>(null);
  void prebuiltBoxes;

  // Restore missing state
  const [addedBoxId, setAddedBoxId] = useState<string | null>(null);
  const [boxQuantities, setBoxQuantities] = useState<Record<string, number>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantType>>({});
  const [flippedBoxes, setFlippedBoxes] = useState<Record<string, boolean>>({});

  const rulesById = useMemo(() => new Map(boxRules.map((rule) => [rule.id, rule])), [boxRules]);
  const ensureDefaultVariant = (boxId: string) => {
    setSelectedVariants((prev) => (prev[boxId] ? prev : { ...prev, [boxId]: "mix" }));
  };
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => {
      if (product.slug) map.set(product.slug, product);
      if (product.sku) map.set(product.sku, product);
      map.set(product.id, product);
      if (product.slug) map.set(product.slug.toLowerCase(), product);
      if (product.sku) map.set(product.sku.toLowerCase(), product);
      map.set(product.id.toLowerCase(), product);
    });
    return map;
  }, [products]);

  const resolveBoxContents = useCallback(
    (box: Box, variant: VariantType) => {
      const variantData =
        box.variants.find((item) => item.id === variant || item.slug === variant) ??
        (variant === "mix" ? box.variants[0] : undefined);

      if (variantData?.referenceContents?.length) {
        return variantData.referenceContents
          .map((content) => {
            const productSku = String(content.productId ?? "").trim();
            const fallbackName = content.name?.es ?? content.name?.en ?? productSku;
            return {
              productSku,
              quantity: Number(content.quantity) || 1,
              name: tData(productMap.get(productSku)?.name) || fallbackName || productSku,
            };
          })
          .filter((content) => content.productSku || content.name);
      }

      const ruleKey = box.ruleId || box.id || box.slug;
      const rule = ruleKey ? rulesById.get(ruleKey) : undefined;
      return (
        rule?.baseContents?.map((content) => ({
          ...content,
          name: tData(productMap.get(content.productSku)?.name) || content.productSku,
        })) ?? []
      );
    },
    [productMap, rulesById, tData],
  );

  const getQuantity = (boxId: string) => Math.max(1, boxQuantities[boxId] ?? 1);
  const updateQuantity = (boxId: string, delta: number) => {
    setBoxQuantities((prev) => {
      const current = prev[boxId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [boxId]: next };
    });
  };
  const resetQuantity = (boxId: string) => {
    setBoxQuantities((prev) => ({ ...prev, [boxId]: 1 }));
  };
  const setBoxFlipped = (boxId: string, flipped: boolean) => {
    setFlippedBoxes((prev) => ({ ...prev, [boxId]: flipped }));
  };

  const addBoxToCart = ({
    box,
    quantity,
    variant,
    likes,
    dislikes,
  }: {
    box: Box;
    quantity: number;
    variant: VariantType;
    likes: string[];
    dislikes: string[];
  }) => {
    const imageSrc = resolveBoxImage(box.heroImage, box.id);

    addItem({
      slug: box.slug,
      type: "box",
      name: tData(box.name),
      quantity,
      price: box.price.amount,
      slotValue: 0,
      weightKg: 0,
      image: imageSrc,
      configuration: {
        boxId: box.id,
        variant: variant,
        mix: variant === "fruity" ? "frutas" : variant === "veggie" ? "vegetales" : "mix",
        selectedProducts: {},
        likes,
        dislikes,
        price: {
          base: box.price.amount,
          extras: 0,
          final: box.price.amount,
          isACarta: false,
        },
      },
    });

    setAddedBoxId(box.id);
    toast.success(`${tData(box.name)} ${t("common.added").toLowerCase()}`);
    resetQuantity(box.id);
    setBoxFlipped(box.id, false);
    setTimeout(() => setAddedBoxId(null), 1000);
  };

  const handleConfirmBox = ({
    variant,
    likes,
    dislikes,
  }: {
    variant: VariantType;
    likes: string[];
    dislikes: string[];
  }) => {
    if (!editingBox) return;

    addBoxToCart({
      box: editingBox.box,
      quantity: editingBox.quantity,
      variant,
      likes,
      dislikes,
    });
    setEditingBox(null);
  };

  const handleAutoModeAdd = ({ box, quantity }: { box: Box; quantity: number }) => {
    const variant = selectedVariants[box.id] ?? "mix";
    addBoxToCart({
      box,
      quantity,
      variant,
      likes: [],
      dislikes: [],
    });
    setAddChoiceBox(null);
  };

  return (
    <div className="space-y-4">
      <motion.div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto pt-6"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
        }}
        initial="hidden"
        animate={isGridInView ? "visible" : "hidden"}
      >
        {boxes.map((box, index) => {
          const imageSrc = resolveBoxImage(box.heroImage, box.id);
          const secondaryImage =
            (box as Box & { secondaryImage?: string; hoverImage?: string }).secondaryImage ||
            (box as Box & { hoverImage?: string }).hoverImage ||
            imageSrc;
          const quantity = getQuantity(box.id);
          const isAdded = addedBoxId === box.id;
          const isFlipped = Boolean(flippedBoxes[box.id]);
          const ruleKey = box.ruleId || box.id || box.slug;
          const rule = ruleKey ? rulesById.get(ruleKey) : undefined;
          const baseContents = resolveBoxContents(box, "mix");
          const unitLabel = box.durationDays
            ? `${box.durationDays} ${t("boxes.duration_days").toUpperCase()}`
            : t("boxes.flexible").toUpperCase();
          const approxWeight = typeof box.weightLabel === "string" ? box.weightLabel.trim() : "";

          const badges = box.isFeatured
            ? [{ label: t("category.featured"), tone: "forest" as const }]
            : [];

          return (
            <motion.div
              key={box.id}
              custom={index}
              variants={{
                hidden: (cardIndex: number) => ({ opacity: 0, x: cardIndex % 2 === 0 ? -92 : 92 }),
                visible: { opacity: 1, x: 0, transition: { duration: 1, ease: "easeOut" } },
              }}
            >
              <ProductCard
                type="box"
                title={tData(box.name)}
                description={box.description ? tData(box.description) : undefined}
                detailsNode={
                  <div className="pt-1">
                    <BoxVariantsDisplay
                      baseContents={baseContents}
                      boxRule={rule}
                      productMap={productMap}
                      boxVariants={box.variants}
                      compact
                      initialVariant={selectedVariants[box.id] ?? "mix"}
                      onVariantSelect={(variant) => {
                        setSelectedVariants((prev) => ({ ...prev, [box.id]: variant }));
                        setBoxFlipped(box.id, true);
                      }}
                    />
                  </div>
                }
                backContent={
                  <div className="w-full space-y-3 text-left">
                    <p className="text-center text-sm text-[var(--gd-color-forest)]/85">
                      {box.description ? tData(box.description) : t("discover.box_description")}
                    </p>
                    <BoxVariantsDisplay
                      baseContents={baseContents}
                      boxRule={rule}
                      productMap={productMap}
                      boxVariants={box.variants}
                      initialVariant={selectedVariants[box.id] ?? "mix"}
                      onVariantSelect={(variant) => {
                        setSelectedVariants((prev) => ({ ...prev, [box.id]: variant }));
                        setBoxFlipped(box.id, true);
                      }}
                    />
                  </div>
                }
                imageAction={
                  <button
                    type="button"
                    onClick={() => {
                      ensureDefaultVariant(box.id);
                      setBoxFlipped(box.id, true);
                    }}
                    aria-label={t("common.view_details")}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-orange)] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gd-color-orange)] shadow-md ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--gd-color-orange)] hover:text-white active:translate-y-0 md:text-sm"
                  >
                    <Info className="h-4 w-4" />
                    <span>{t("common.view_details")}</span>
                  </button>
                }
                image={{ src: imageSrc, alt: tData(box.name), fit: "cover", priority: index < 3 }}
                secondaryImage={{ src: secondaryImage, alt: `${tData(box.name)} topdown`, fit: "cover" }}
                imageContainerClassName="bg-gradient-to-b from-[#f6f1e4] via-[#f2ead8] to-[#eaddc3]"
                badges={badges}
                priceLabel={`RD$${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}`}
                unitLabel={unitLabel}
                quantity={quantity}
                onDecrease={() => updateQuantity(box.id, -1)}
                onIncrease={() => updateQuantity(box.id, 1)}
                onAdd={() => {
                  ensureDefaultVariant(box.id);
                  setAddChoiceBox({ box, quantity });
                }}
                addLabel={t("common.add_to_cart")}
                detailsCtaLabel={t("common.view_details")}
                isAdded={isAdded}
                footerNote={approxWeight ? `${approxWeight}\n${t("boxes.disclaimer")}` : t("boxes.disclaimer")}
                controlsPlacement="both"
                compactControls
                isFlipped={isFlipped}
                onFlipChange={(next) => {
                  if (next) ensureDefaultVariant(box.id);
                  setBoxFlipped(box.id, next);
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>
      <p className="pt-3 text-center text-xs font-medium text-[var(--gd-color-text-muted)]">
        {t("common.currency_notice")}
      </p>

      {addChoiceBox && (
        <BoxAddModeDialog
          isOpen={true}
          boxName={tData(addChoiceBox.box.name)}
          onClose={() => setAddChoiceBox(null)}
          onCustomize={() => {
            ensureDefaultVariant(addChoiceBox.box.id);
            setBoxFlipped(addChoiceBox.box.id, true);
            setEditingBox(addChoiceBox);
            setAddChoiceBox(null);
          }}
          onAutoMode={() => handleAutoModeAdd(addChoiceBox)}
        />
      )}

      {editingBox && (
        <BoxPreferencesModal
          isOpen={true}
          onClose={() => setEditingBox(null)}
          box={editingBox.box}
          // Resolve rule for the editing box
          boxRule={
            (editingBox.box.ruleId || editingBox.box.id)
              ? rulesById.get(editingBox.box.ruleId || editingBox.box.id)
              : undefined
          }
          productMap={productMap}
          initialVariant={selectedVariants[editingBox.box.id] || "mix"}
          onConfirm={handleConfirmBox}
        />
      )}
    </div>
  );
}
