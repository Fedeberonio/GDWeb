"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/modules/cart/context";
import type { Box, BoxRule, Product } from "@/modules/catalog/types";
import { Check, Star } from "lucide-react";

import { useTranslation } from "@/modules/i18n/use-translation";
import { ProductCard } from "./product-card";
import { BoxVariantsDisplay } from "./box-variants-display";
import { BoxPreferencesModal } from "./box-preferences-modal";
import type { VariantType } from "./box-selector/helpers";

// Helper function para obtener imágenes de cajas (product y topdown)
function getBoxImages(boxId: string): { product: string; topdown: string } {
  const boxImageMap: Record<string, { product: string; topdown: string }> = {
    "GD-CAJA-001": {
      product: "/assets/images/boxes/GD-CAJA-001.png",
      topdown: "/assets/images/boxes/GD-CAJA-001-topdown.png",
    },
    "GD-CAJA-002": {
      product: "/assets/images/boxes/GD-CAJA-002.png",
      topdown: "/assets/images/boxes/GD-CAJA-002-topdown.png",
    },
    "GD-CAJA-003": {
      product: "/assets/images/boxes/GD-CAJA-003.png",
      topdown: "/assets/images/boxes/GD-CAJA-003-topdown.png",
    },
  };

  return boxImageMap[boxId] || {
    product: "/assets/images/boxes/placeholder.png",
    topdown: "/assets/images/boxes/placeholder.png",
  };
}

// Helper function para mapear URLs remotas a imágenes locales (fallback)
function getLocalBoxImage(heroImage: string | undefined, boxId: string, _slug: string): string {
  if (heroImage && heroImage.startsWith("/assets/")) {
    return heroImage;
  }
  const boxImages = getBoxImages(boxId);
  return boxImages.product;
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
  const [editingBox, setEditingBox] = useState<{ box: Box; quantity: number } | null>(null);

  // Restore missing state
  const [addedBoxId, setAddedBoxId] = useState<string | null>(null);
  const [boxQuantities, setBoxQuantities] = useState<Record<string, number>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantType>>({});

  const rulesById = useMemo(() => new Map(boxRules.map((rule) => [rule.id, rule])), [boxRules]);
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

    const { box, quantity } = editingBox;
    const imageSrc = getLocalBoxImage(box.heroImage, box.id, box.slug);

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
    setEditingBox(null);
    setTimeout(() => setAddedBoxId(null), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto pt-6">
        {boxes.map((box, index) => {
          const imageSrc = getLocalBoxImage(box.heroImage, box.id, box.slug);
          const fallbackTopdown = getBoxImages(box.id).topdown;
          const secondaryImage =
            (box as Box & { secondaryImage?: string; hoverImage?: string }).secondaryImage ||
            (box as Box & { hoverImage?: string }).hoverImage ||
            fallbackTopdown;
          const quantity = getQuantity(box.id);
          const isAdded = addedBoxId === box.id;
          const ruleKey = box.ruleId || box.id || box.slug;
          const rule = ruleKey ? rulesById.get(ruleKey) : undefined;
          const baseContents =
            rule?.baseContents?.map((content) => ({
              ...content,
              name: tData(productMap.get(content.productSku)?.name) || content.productSku,
            })) ?? [];
          const unitLabel = box.durationDays
            ? `${box.durationDays} ${t("boxes.duration_days").toUpperCase()}`
            : t("boxes.flexible").toUpperCase();

          const badges = [
            index === 1
              ? {
                  label: (
                    <>
                      <Star className="w-3 h-3 fill-current" />
                      <span>{t("boxes.badge_popular")}</span>
                    </>
                  ),
                  tone: "popular" as const,
                }
              : null,
            index === 2
              ? {
                  label: (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{t("boxes.badge_best_value")}</span>
                    </>
                  ),
                  tone: "bestValue" as const,
                }
              : null,
            box.isFeatured ? { label: t("category.featured"), tone: "forest" as const } : null,
          ].filter(Boolean) as Array<{ label: React.ReactNode; tone: "forest" | "leaf" | "neutral" | "popular" | "bestValue" }>;

          return (
            <ProductCard
              key={box.id}
              title={tData(box.name)}
              description={box.description ? tData(box.description) : undefined}
              detailsNode={
                <div className="pt-2">
                  <BoxVariantsDisplay
                    baseContents={baseContents}
                    boxRule={rule}
                    productMap={productMap}
                    boxVariants={box.variants}
                    compact
                    initialVariant={selectedVariants[box.id]}
                    onVariantSelect={(variant) =>
                      setSelectedVariants((prev) => ({ ...prev, [box.id]: variant }))
                    }
                  />
                </div>
              }
              image={{ src: imageSrc, alt: tData(box.name), fit: "cover", priority: index < 3 }}
              secondaryImage={{ src: secondaryImage, alt: `${tData(box.name)} topdown`, fit: "cover" }}
              badges={badges}
              priceLabel={`RD$${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}`}
              unitLabel={unitLabel}
              quantity={quantity}
              onDecrease={() => updateQuantity(box.id, -1)}
              onIncrease={() => updateQuantity(box.id, 1)}
              onAdd={() => setEditingBox({ box, quantity })}
              addLabel={t("common.add_to_cart")}
              disableFlip
              isAdded={isAdded}
              footerNote={t("boxes.disclaimer")}
            />
          );
        })}
      </div>

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
