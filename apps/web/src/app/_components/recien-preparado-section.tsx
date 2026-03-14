"use client";

import { useMemo, useRef, useState } from "react";
import { Citrus, Info, Salad, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { motion, useInView } from "framer-motion";

import type { Product } from "@/modules/catalog/types";
import { useTranslation } from "@/modules/i18n/use-translation";
import { useCart } from "@/modules/cart/context";
import { ProductCard } from "./product-card";

type RecienPreparadoSectionProps = {
  products: Product[];
};

type PreparedGroup = {
  id: "ensaladas" | "jugos" | "dips";
  title: string;
  description: string;
  products: Product[];
};

type NutritionHighlight = {
  icon: string;
  label: string;
  value: string;
};

type PreparedHighlightLabelKey =
  | "salads.calories"
  | "salads.protein"
  | "salads.carbs"
  | "category.fiber"
  | "category.sugars"
  | "catalog.organic"
  | "catalog.vegan"
  | "catalog.gluten_free";

type JuiceNutritionLocalizedField = "detailDescription" | "detailPerfectFor" | "detailNote";
type JuiceNutritionListField = "detailIngredients" | "detailBenefits";

function resolveStatus(product: Product): string {
  return String(product.status ?? (product.isActive ? "active" : "inactive")).toLowerCase();
}

function isSellable(product: Product): boolean {
  const status = resolveStatus(product);
  const price = Number(product.salePrice ?? product.price);
  return status === "active" && Number.isFinite(price) && price > 0;
}

function resolveProductKey(product: Product): string {
  return String(product.sku ?? product.id ?? "").trim();
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolvePreparedTags(product: Product): string[] {
  return Array.isArray(product.tags)
    ? product.tags.map((tag) => normalizeSearch(tag)).filter(Boolean)
    : [];
}

function isJuiceProduct(product: Product): boolean {
  const categoryId = String(product.categoryId ?? "").toLowerCase();
  if (categoryId === "jugos" || categoryId === "jugos-naturales") return true;
  return resolvePreparedTags(product).some((tag) => tag === "jugo" || tag === "jugos" || tag === "juice");
}

function isDipProduct(product: Product): boolean {
  const categoryId = String(product.categoryId ?? "").toLowerCase();
  const tags = resolvePreparedTags(product);
  return categoryId === "dips" || tags.includes("dip") || tags.includes("dips");
}

function byPreparedDisplayOrder(left: Product, right: Product): number {
  const featuredDelta = Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));
  if (featuredDelta !== 0) return featuredDelta;
  return byLocalizedNameAsc(left, right);
}

function resolveImageForGroup(product: Product, groupId: PreparedGroup["id"]): string {
  if (typeof product.image === "string" && product.image.trim().length > 0) return product.image;
  const key = resolveProductKey(product);
  if (groupId === "ensaladas") return `/assets/images/salads/${key}.png`;
  return `/assets/images/products/${key}.png`;
}

function byLocalizedNameAsc(left: Product, right: Product): number {
  const leftName = left.name?.es ?? left.name?.en ?? left.id;
  const rightName = right.name?.es ?? right.name?.en ?? right.id;
  return leftName.localeCompare(rightName, "es");
}

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumberFromText(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return toFiniteNumber(value);
}

function resolveLocalizedValue(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const es = typeof record.es === "string" ? record.es.trim() : "";
    const en = typeof record.en === "string" ? record.en.trim() : "";
    const fallback = typeof record.value === "string" ? record.value.trim() : "";
    return es || en || fallback || null;
  }

  return null;
}

function resolveMetadata(product: Product): Record<string, unknown> | null {
  if (!product.metadata || typeof product.metadata !== "object") return null;
  return product.metadata as unknown as Record<string, unknown>;
}

function resolvePresentation(product: Product) {
  if (!product.presentation || typeof product.presentation !== "object") return null;
  return product.presentation;
}

function resolveJuiceNutritionLocalized(
  product: Product,
  field: JuiceNutritionLocalizedField,
  locale: "es" | "en",
): string | null {
  const rawValue = product.nutrition?.[field] as unknown;
  if (typeof rawValue === "string") {
    const normalized = rawValue.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (!rawValue || typeof rawValue !== "object") return null;
  const record = rawValue as Record<string, unknown>;
  const es = typeof record.es === "string" ? record.es.trim() : "";
  const en = typeof record.en === "string" ? record.en.trim() : "";
  return locale === "en" ? en || es || null : es || en || null;
}

function resolveJuiceNutritionList(product: Product, field: JuiceNutritionListField): string[] {
  const rawValue = product.nutrition?.[field] as unknown;
  const values: string[] =
    Array.isArray(rawValue)
      ? rawValue.filter((entry): entry is string => typeof entry === "string")
      : typeof rawValue === "string"
        ? rawValue.split("\n")
        : [];

  return Array.from(
    new Set(
      values
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean),
    ),
  );
}

function dedupePreparedValues(values: Array<string | null | undefined>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const normalizedValue = typeof value === "string" ? value.trim() : "";
    const key = normalizeSearch(normalizedValue.replace(/\s*\([^)]*\)\s*/g, " "));
    if (!normalizedValue || !key || seen.has(key)) return;
    seen.add(key);
    result.push(normalizedValue);
  });

  return result;
}

function buildPreparedProductLookup(products: Product[]) {
  const lookup = new Map<string, Product>();

  products.forEach((product) => {
    [product.id, product.sku, product.slug].forEach((value) => {
      const normalizedValue = typeof value === "string" ? value.trim().toUpperCase() : "";
      if (normalizedValue) {
        lookup.set(normalizedValue, product);
      }
    });
  });

  return lookup;
}

function resolveCatalogIngredientName(
  productLookup: Map<string, Product>,
  ingredientId?: string,
) {
  const normalizedId = typeof ingredientId === "string" ? ingredientId.trim().toUpperCase() : "";
  if (!normalizedId) return null;
  const product = productLookup.get(normalizedId);
  if (!product) return null;
  return product.name?.es ?? product.name?.en ?? null;
}

function resolvePreparedDescriptionIngredients(product: Product): string[] {
  const descriptions = [product.description?.es, product.description?.en]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  const values = descriptions.flatMap((description) => {
    const match = description.match(/(?:ingredientes?|ingredients?)\s*:\s*([^\n]+)/i);
    if (!match?.[1]) return [];

    return match[1]
      .split(/,|•|\u2022|\//)
      .map((item) => item.trim())
      .filter(Boolean);
  });

  return dedupePreparedValues(values);
}

function resolvePreparedIngredients(product: Product, productLookup: Map<string, Product>): string[] {
  const recipeIngredients = Array.isArray(product.recipe?.ingredients) ? product.recipe.ingredients : [];
  const fromRecipe = recipeIngredients
    .map((ingredient) => {
      const localizedName =
        resolveLocalizedValue(ingredient.name) ??
        resolveCatalogIngredientName(productLookup, ingredient.productId) ??
        resolveCatalogIngredientName(productLookup, ingredient.supplyId);
      const fallbackName = String(ingredient.productId ?? ingredient.supplyId ?? "").trim();
      const displayName = localizedName || fallbackName;
      return displayName || null;
    })
    .filter((value): value is string => Boolean(value));

  const fromDescription = resolvePreparedDescriptionIngredients(product);

  if (fromRecipe.length > 0 || fromDescription.length > 0) {
    return dedupePreparedValues([...fromRecipe, ...fromDescription]);
  }

  const metadata = resolveMetadata(product);
  const rawIngredients = metadata?.ingredients;
  if (!Array.isArray(rawIngredients)) return [];

  const fromMetadata = rawIngredients
    .map((item) => {
      if (typeof item === "string") {
        const normalized = item.trim();
        return normalized.length > 0 ? normalized : null;
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return (
          resolveLocalizedValue(record.name) ??
          resolveLocalizedValue(record.ingredient) ??
          resolveLocalizedValue(record.label)
        );
      }

      return null;
    })
    .filter((value): value is string => Boolean(value));

  return dedupePreparedValues(fromMetadata);
}

function resolvePreparedNutritionHighlights(
  product: Product,
  t: (key: PreparedHighlightLabelKey) => string
): NutritionHighlight[] {
  const highlights: NutritionHighlight[] = [];
  const calories = toFiniteNumber(product.nutrition?.calories);
  const protein = toFiniteNumber(product.nutrition?.protein);
  const carbs = toFiniteNumber(product.nutrition?.carbs);
  const fiber = toFiniteNumber(product.nutrition?.fiber);
  const sugars = toFiniteNumber(product.nutrition?.sugars);

  if (calories > 0) highlights.push({ icon: "🔥", label: t("salads.calories"), value: `${calories} kcal` });
  if (protein > 0) highlights.push({ icon: "💪", label: t("salads.protein"), value: `${protein} g` });
  if (carbs > 0) highlights.push({ icon: "⚡", label: t("salads.carbs"), value: `${carbs} g` });
  if (fiber > 0) highlights.push({ icon: "🌿", label: t("category.fiber"), value: `${fiber} g` });
  if (sugars > 0) highlights.push({ icon: "🍯", label: t("category.sugars"), value: `${sugars} g` });

  if (highlights.length === 0) {
    if (product.nutrition?.organic) highlights.push({ icon: "🌱", label: t("catalog.organic"), value: "✓" });
    if (product.nutrition?.vegan) highlights.push({ icon: "🥬", label: t("catalog.vegan"), value: "✓" });
    if (product.nutrition?.glutenFree) highlights.push({ icon: "✨", label: t("catalog.gluten_free"), value: "✓" });
  }

  return highlights.slice(0, 3);
}

function resolvePreparedPerfectFor(product: Product): string | null {
  const nutritionPerfectFor = resolveLocalizedValue(product.nutrition?.detailPerfectFor);
  if (nutritionPerfectFor) return nutritionPerfectFor;

  const metadata = resolveMetadata(product);
  if (!metadata) return null;

  const candidateKeys = [
    "perfectFor",
    "recommendedFor",
    "usageSuggestion",
    "useFor",
    "idealFor",
  ] as const;

  for (const key of candidateKeys) {
    const value = resolveLocalizedValue(metadata[key]);
    if (value) return value;
  }

  return null;
}

function resolvePreparedBenefit(product: Product): string | null {
  const presentation = resolvePresentation(product);
  const structuredBenefit =
    resolveLocalizedValue(presentation?.benefit) ?? resolveLocalizedValue(presentation?.benefitDetail);
  if (structuredBenefit) return structuredBenefit;

  const metadata = resolveMetadata(product);
  if (!metadata) return null;

  const candidateKeys = ["benefitDetail", "benefit", "mainBenefit"] as const;
  for (const key of candidateKeys) {
    const value = resolveLocalizedValue(metadata[key]);
    if (value) return value;
  }

  return null;
}

function resolvePreparedBenefits(product: Product): string[] {
  const nutritionBenefits = resolveJuiceNutritionList(product, "detailBenefits");
  if (nutritionBenefits.length > 0) {
    return nutritionBenefits;
  }

  const metadata = resolveMetadata(product);
  if (!metadata) return [];

  const rawBenefits = metadata.benefits;
  if (!Array.isArray(rawBenefits)) {
    const singleBenefit = resolveLocalizedValue(rawBenefits);
    return singleBenefit ? [singleBenefit] : [];
  }

  const normalizedBenefits = rawBenefits
    .map((item) => resolveLocalizedValue(item))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(normalizedBenefits));
}

export function RecienPreparadoSection({ products }: RecienPreparadoSectionProps) {
  const { t, tData, locale } = useTranslation();
  const { addItem } = useCart();
  const sectionRef = useRef<HTMLElement | null>(null);
  const isSectionInView = useInView(sectionRef, { once: true, margin: "-12%" });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [excludedIngredientsByProduct, setExcludedIngredientsByProduct] = useState<Record<string, number[]>>({});
  const [flippedProducts, setFlippedProducts] = useState<Record<string, boolean>>({});
  const [nutritionExpandedByProduct, setNutritionExpandedByProduct] = useState<Record<string, boolean>>({});
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const preparedProductLookup = useMemo(() => buildPreparedProductLookup(products), [products]);

  const groups = useMemo<PreparedGroup[]>(() => {
    const sellable = products.filter(isSellable);

    const ensaladas = sellable
      .filter((product) => String(product.categoryId ?? "").toLowerCase() === "ensaladas")
      .sort(byPreparedDisplayOrder);

    const jugos = sellable
      .filter(isJuiceProduct)
      .sort(byPreparedDisplayOrder);

    const dips = sellable.filter(isDipProduct).sort(byPreparedDisplayOrder);

    return [
      {
        id: "ensaladas",
        title: t("prepared.salads"),
        description: t("prepared.salads_desc"),
        products: ensaladas,
      },
      {
        id: "jugos",
        title: t("prepared.juices"),
        description: t("prepared.juices_desc"),
        products: jugos,
      },
      {
        id: "dips",
        title: t("prepared.dips"),
        description: t("prepared.dips_desc"),
        products: dips,
      },
    ];
  }, [products, t]);

  const getQuantity = (productId: string) => Math.max(1, quantities[productId] ?? 1);

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const toggleExcludedIngredient = (productId: string, ingredientIndex: number) => {
    setExcludedIngredientsByProduct((prev) => {
      const current = new Set(prev[productId] ?? []);
      if (current.has(ingredientIndex)) {
        current.delete(ingredientIndex);
      } else {
        current.add(ingredientIndex);
      }
      return { ...prev, [productId]: Array.from(current) };
    });
  };

  const setProductFlipped = (productId: string, flipped: boolean) => {
    setFlippedProducts((prev) => ({ ...prev, [productId]: flipped }));
    if (!flipped) {
      setNutritionExpandedByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const toggleNutritionExpanded = (productId: string) => {
    setNutritionExpandedByProduct((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(amount);

  const handleAdd = (product: Product, options?: { excludedIngredients?: string[] }) => {
    const productId = product.id;
    const quantity = getQuantity(productId);
    const price = Number(product.salePrice ?? product.price ?? 0);
    const excludedIngredients = options?.excludedIngredients?.filter(Boolean) ?? [];

    addItem({
      type: "product",
      slug: product.slug || productId,
      name: tData(product.name),
      price,
      quantity,
      slotValue: Number(product.metadata?.slotValue ?? 1),
      weightKg: Number(product.logistics?.weightKg ?? 0),
      image: product.image,
      excludedIngredients: excludedIngredients.length > 0 ? excludedIngredients : undefined,
    });

    setAddedProductId(productId);
    setTimeout(() => {
      setAddedProductId((current) => (current === productId ? null : current));
    }, 1300);

    toast.success(`${tData(product.name)} ${t("common.added").toLowerCase()}`);
  };

  return (
    <section
      ref={sectionRef}
      id="recien-preparado"
      className="relative isolate mt-4 bg-gd-leaf/10 py-6 md:mt-6 md:py-8 overflow-hidden border-t border-gd-leaf/20 scroll-mt-20 md:scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center space-y-3 mb-8"
          initial={{ opacity: 0, x: -70 }}
          animate={isSectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -70 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/30 to-[var(--gd-color-citrus)]/20 px-4 py-1.5 border-2 border-[var(--gd-color-leaf)]/30">
            <Sparkles className="w-4 h-4 text-[var(--gd-color-forest)]" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gd-color-forest)]">
              {t("nav.freshly_prepared")}
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-green-800">
            {t("prepared.title")}
          </h2>
          <p className="font-display max-w-2xl mx-auto text-base md:text-lg text-[var(--gd-color-forest)] leading-relaxed font-medium">
            {t("prepared.subtitle")}
          </p>
        </motion.div>

        <div className="space-y-10">
          {groups.map((group, groupIndex) => (
            <motion.section
              key={group.id}
              id={`recien-preparado-${group.id}`}
              className="rounded-3xl border border-gd-leaf/20 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-6 scroll-mt-20 md:scroll-mt-24"
              custom={groupIndex}
              variants={{
                hidden: (idx: number) => ({ opacity: 0, x: idx % 2 === 0 ? -86 : 86 }),
                visible: { opacity: 1, x: 0, transition: { duration: 0.95, ease: "easeOut" } },
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-18%" }}
            >
              <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gd-leaf/15 pb-4">
                <div className="space-y-1">
                  <h3 className="font-display text-xl md:text-2xl font-bold text-gd-forest">{group.title}</h3>
                  <p className="text-sm md:text-base text-[var(--gd-color-text-muted)]">{group.description}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gd-leaf/25 bg-gd-sprout/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gd-forest">
                  {group.id === "ensaladas" && <Salad className="h-4 w-4" />}
                  {group.id === "jugos" && <Citrus className="h-4 w-4" />}
                  {group.id === "dips" && <Sparkles className="h-4 w-4" />}
                  {group.products.length} {t("catalog.products_count")}
                </span>
              </header>

              {group.products.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gd-leaf/25 bg-gd-sprout/15 px-4 py-6 text-center text-sm text-[var(--gd-color-text-muted)]">
                  {t("prepared.empty")}
                </p>
              ) : (
                <motion.div
                  className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.04 } } }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-12%" }}
                >
		                  {group.products.map((product, index) => {
		                    const productId = product.id;
		                    const quantity = getQuantity(productId);
	                    const unitPrice = Number(product.salePrice ?? product.price ?? 0);
	                    const image = resolveImageForGroup(product, group.id);
		                    const isJuiceImage = group.id === "jugos";
		                    const isSaladImage = group.id === "ensaladas";
                      const isDipImage = group.id === "dips";
                      const isFlipped = Boolean(flippedProducts[productId]);
                      const isNutritionExpanded = Boolean(nutritionExpandedByProduct[productId]);
                      const juiceDescription = isJuiceImage
                        ? resolveJuiceNutritionLocalized(product, "detailDescription", locale)
                        : null;
                      const juiceIngredients = isJuiceImage
                        ? resolveJuiceNutritionList(product, "detailIngredients")
                        : [];
                      const juiceBenefits = isJuiceImage
                        ? resolveJuiceNutritionList(product, "detailBenefits")
                        : [];
                      const juicePerfectFor = isJuiceImage
                        ? resolveJuiceNutritionLocalized(product, "detailPerfectFor", locale)
                        : null;
                      const juiceNote = isJuiceImage
                        ? resolveJuiceNutritionLocalized(product, "detailNote", locale)
                        : null;
		                      const allIngredients = resolvePreparedIngredients(product, preparedProductLookup);
                      const defaultIngredients = isSaladImage ? allIngredients : allIngredients.slice(0, 6);
	                      const ingredients =
                        isJuiceImage && juiceIngredients.length > 0
                          ? juiceIngredients
                          : defaultIngredients;
                      const safeIngredients = ingredients.filter((item) => !/^GD-[A-Z]+-\d+/i.test(item.trim()));
	                      const excludedIngredientIndexes = excludedIngredientsByProduct[productId] ?? [];
	                      const excludedIngredientSet = new Set(excludedIngredientIndexes);
	                      const excludedIngredientLabels = excludedIngredientIndexes
	                        .map((ingredientIndex) => safeIngredients[ingredientIndex])
	                        .filter((value): value is string => Boolean(value));
                      const nutritionHighlights = resolvePreparedNutritionHighlights(product, t);
                      const metadataBenefits = resolvePreparedBenefits(product);
                      const benefits = (
                        isJuiceImage && juiceBenefits.length > 0
                          ? juiceBenefits
                          : metadataBenefits
                      ).slice(0, 3);
	                      const nutritionValues = {
	                        calories: toFiniteNumber(product.nutrition?.calories),
	                        protein: toNumberFromText(product.nutrition?.protein),
	                        carbs: toFiniteNumber(product.nutrition?.carbs),
	                        fats: toNumberFromText(product.nutrition?.fats),
	                        fiber: toNumberFromText(product.nutrition?.fiber),
	                        sugars: toFiniteNumber(product.nutrition?.sugars),
	                      };
                      const vitaminA =
                        resolveLocalizedValue(resolvePresentation(product)?.vitamins?.vitaminA) ??
                        resolveLocalizedValue(resolveMetadata(product)?.vitaminA);
                      const vitaminC =
                        resolveLocalizedValue(resolvePresentation(product)?.vitamins?.vitaminC) ??
                        resolveLocalizedValue(resolveMetadata(product)?.vitaminC);
	                      const perfectFor = isJuiceImage
                        ? juicePerfectFor ?? resolvePreparedPerfectFor(product)
                        : resolvePreparedPerfectFor(product);
                      const note = isJuiceImage ? juiceNote : null;
                      const isVegan = Boolean(product.nutrition?.vegan);
                      const isGlutenFree = Boolean(product.nutrition?.glutenFree);
                      const isOrganic = Boolean(product.nutrition?.organic);
                      const hasReturnableContainer = Boolean(resolveMetadata(product)?.returnableContainer);
                      const benefit = resolvePreparedBenefit(product);
                      const localizedDescription = (product.description ? tData(product.description) : "").trim();
                      const generatedSaladDescription =
                        safeIngredients.length > 0
                          ? locale === "en"
                            ? `Fresh salad with ${safeIngredients.slice(0, 3).join(", ").toLowerCase()}.`
                            : `Ensalada fresca con ${safeIngredients.slice(0, 3).join(", ").toLowerCase()}.`
                          : locale === "en"
                            ? "Fresh salad prepared daily."
                            : "Ensalada fresca preparada del día.";
                      const fallbackDescription =
                        localizedDescription || juiceDescription || t("catalog.details_placeholder");
                      const frontDescription = (
                        localizedDescription ||
                        juiceDescription ||
                        (isSaladImage
                          ? generatedSaladDescription
                          : isJuiceImage
                            ? t("prepared.juices_desc")
                            : t("prepared.dips_desc"))
                      ).trim();
	                      const hasStructuredBackContent = isJuiceImage
                        ? Boolean(juiceDescription) ||
                          ingredients.length > 0 ||
                          benefits.length > 0 ||
                          nutritionValues.calories > 0 ||
                          nutritionValues.protein > 0 ||
                          nutritionValues.carbs > 0 ||
                          nutritionValues.fats > 0 ||
                          nutritionValues.fiber > 0 ||
                          nutritionValues.sugars > 0 ||
                          isVegan ||
                          isGlutenFree ||
                          isOrganic ||
                          Boolean(note) ||
                          Boolean(perfectFor)
                        : isDipImage
                          ? safeIngredients.length > 0 ||
                            benefits.length > 0 ||
                            nutritionValues.calories > 0 ||
                            nutritionValues.protein > 0 ||
                            nutritionValues.fats > 0 ||
                            nutritionValues.fiber > 0 ||
                            isVegan ||
                            isGlutenFree ||
                            hasReturnableContainer ||
                            Boolean(note) ||
                            Boolean(perfectFor)
                        : ingredients.length > 0 || nutritionHighlights.length > 0 || Boolean(perfectFor);
	                      const ingredientIcons = ["🥕", "🍅", "🥬", "🥒", "🍋", "🫒"];
                      const benefitsLabel = locale === "en" ? "Benefits" : "Beneficios";
                      const perfectForLabel = locale === "en" ? "Perfect for" : "Perfecto para";
                      const sugarUnitLabel = locale === "en" ? "sugars" : "azúcares";
                      const proteinUnitLabel = locale === "en" ? "protein" : "proteína";
                      const carbsUnitLabel = locale === "en" ? "carbs" : "carbohidratos";
                      const fatsUnitLabel = locale === "en" ? "fats" : "grasas";
                      const fiberUnitLabel = locale === "en" ? "fiber" : "fibra";
                      const descriptionLabel = locale === "en" ? "Description" : "Descripción";
                      const noteLabel = locale === "en" ? "Note" : "Nota";
                      const returnableLabel = locale === "en" ? "Returnable Container" : "Envase Retornable";
                      const juiceNutritionSummary = [
                        nutritionValues.calories > 0 ? `🔥 ${nutritionValues.calories} cal` : null,
                        nutritionValues.protein > 0 ? `💪 ${nutritionValues.protein}g ${proteinUnitLabel}` : null,
                        nutritionValues.carbs > 0 ? `⚡ ${nutritionValues.carbs}g ${carbsUnitLabel}` : null,
                        nutritionValues.fats > 0 ? `🥑 ${nutritionValues.fats}g ${fatsUnitLabel}` : null,
                        nutritionValues.fiber > 0 ? `🌿 ${nutritionValues.fiber}g ${fiberUnitLabel}` : null,
                        nutritionValues.sugars > 0 ? `🍯 ${nutritionValues.sugars}g ${sugarUnitLabel}` : null,
                      ].filter((value): value is string => Boolean(value));
                      const badges = product.isFeatured
                        ? [{ label: t("category.featured"), tone: "forest" as const }]
                        : [];
	                    return (
                        <motion.div
                          key={product.id}
                          custom={index}
                          variants={{
                            hidden: (idx: number) => ({ opacity: 0, x: idx % 2 === 0 ? -68 : 68 }),
                            visible: { opacity: 1, x: 0, transition: { duration: 0.82, ease: "easeOut" } },
                          }}
                        >
	                      <ProductCard
	                        type={isSaladImage ? "salad" : "prepared"}
	                        title={tData(product.name)}
	                        description={frontDescription}
                        badges={badges}
                        image={
                          {
                            src: image,
                            alt: tData(product.name),
                            fit: isJuiceImage ? "contain" : isSaladImage ? "contain" : "cover",
                            priority: index < 3,
                            sizes: isJuiceImage ? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" : undefined,
                          }
                        }
                        imageContainerClassName={
                          isJuiceImage
                            ? "bg-white aspect-[16/10] min-h-[230px] sm:min-h-[250px] md:min-h-[270px]"
                            : isSaladImage
                              ? "bg-white flex items-center justify-center min-h-[220px] sm:min-h-[260px] md:min-h-[300px] aspect-[4/3]"
                              : undefined
                        }
                        imageClassName={
                          isJuiceImage
                            ? "p-2 md:p-3 !object-contain !object-center group-hover:scale-[1.03]"
                            : isSaladImage
                              ? "p-4 md:p-5 group-hover:scale-100"
                              : undefined
                        }
                        priceLabel={formatCurrency(unitPrice)}
	                        quantity={quantity}
	                        onDecrease={() => updateQuantity(productId, -1)}
	                        onIncrease={() => updateQuantity(productId, 1)}
		                        onAdd={() => {
                            if (isSaladImage && !isFlipped) {
                              setProductFlipped(productId, true);
                              return;
                            }
                            handleAdd(product, { excludedIngredients: excludedIngredientLabels });
                            if (isSaladImage) {
                              setProductFlipped(productId, false);
                            }
                          }}
	                        addLabel={t("common.add_to_cart")}
	                        isAdded={addedProductId === product.id}
                          controlsPlacement="both"
                          compactControls={isSaladImage}
                          isFlipped={isFlipped}
                          onFlipChange={(next) => setProductFlipped(productId, next)}
	                          imageAction={
	                            isSaladImage || isJuiceImage || isDipImage ? (
	                              <button
	                                type="button"
	                                onClick={() => setProductFlipped(productId, true)}
	                                aria-label={t("common.view_details")}
	                                className={
                                  isJuiceImage || isDipImage
                                    ? "inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--gd-color-orange)] bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--gd-color-orange)] shadow-md ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--gd-color-orange)] hover:text-white active:translate-y-0"
                                    : "inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-orange)] bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gd-color-orange)] shadow-md ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--gd-color-orange)] hover:text-white active:translate-y-0"
                                }
	                              >
	                                <Info className={isJuiceImage || isDipImage ? "h-3.5 w-3.5" : "h-4 w-4"} />
	                                <span>{t("common.view_details")}</span>
	                              </button>
	                            ) : undefined
	                          }
	                          backContent={
	                            isJuiceImage ? (
                                <div className="mx-auto w-full max-w-md space-y-4 text-left">
                                  {juiceDescription && (
                                    <div className="rounded-lg border border-[var(--gd-color-leaf)]/25 bg-white/75 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {descriptionLabel}
                                      </p>
                                      <p className="text-sm leading-relaxed text-[var(--gd-color-forest)]">{juiceDescription}</p>
                                    </div>
                                  )}

                                  {ingredients.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {t("salads.ingredients")}
                                      </p>
                                      <ul className="space-y-2">
                                        {ingredients.map((ingredient, ingredientIndex) => (
                                          <li
                                            key={`${product.id}-juice-ingredient-${ingredientIndex}`}
                                            className="flex items-center gap-2 rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white/80 px-3 py-2 text-sm text-[var(--gd-color-forest)]"
                                          >
                                            <span className="text-emerald-600">✓</span>
                                            <span>{ingredient}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {benefits.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {benefitsLabel}
                                      </p>
                                      <ul className="space-y-1.5">
                                        {benefits.map((benefitItem, benefitIndex) => (
                                          <li
                                            key={`${product.id}-benefit-${benefitIndex}`}
                                            className="flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-[var(--gd-color-forest)]"
                                          >
                                            <span className="mt-0.5 text-base">✨</span>
                                            <span>{benefitItem}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {(juiceNutritionSummary.length > 0 ||
                                    isVegan ||
                                    isGlutenFree ||
                                    isOrganic) && (
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {t("salads.nutrition")}
                                      </p>
                                      {juiceNutritionSummary.length > 0 && (
                                        <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--gd-color-forest)]">
                                          {juiceNutritionSummary.join(" | ")}
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-2">
                                        {isVegan && (
                                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            🌱 {t("catalog.vegan")}
                                          </span>
                                        )}
                                        {isGlutenFree && (
                                          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                            ✓ {t("catalog.gluten_free")}
                                          </span>
                                        )}
                                        {isOrganic && (
                                          <span className="inline-flex items-center rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-700">
                                            🍃 {t("catalog.organic")}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {note && (
                                    <div className="rounded-lg border border-[var(--gd-color-leaf)]/25 bg-white/75 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {noteLabel}
                                      </p>
                                      <p className="text-sm leading-relaxed text-[var(--gd-color-forest)]">{note}</p>
                                    </div>
                                  )}

                                  {perfectFor && (
                                    <div className="rounded-lg border border-[var(--gd-color-citrus)]/30 bg-[var(--gd-color-citrus)]/10 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {perfectForLabel}
                                      </p>
                                      <p className="text-sm leading-relaxed text-[var(--gd-color-forest)]">{perfectFor}</p>
                                    </div>
                                  )}

                                  {!hasStructuredBackContent && (
                                    <p className="rounded-lg bg-white/70 px-3 py-2.5 text-center text-sm leading-relaxed text-[var(--gd-color-forest)]">
                                      {fallbackDescription}
                                    </p>
                                  )}
                                </div>
                              ) : isDipImage ? (
                                <div className="mx-auto w-full max-w-md space-y-4 text-left">
                                  {safeIngredients.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {t("salads.ingredients")}
                                      </p>
                                      <ul className="space-y-2">
                                        {safeIngredients.map((ingredient, ingredientIndex) => (
                                          <li
                                            key={`${product.id}-dip-ingredient-${ingredientIndex}`}
                                            className="flex items-center gap-2 rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white/80 px-3 py-2 text-sm text-[var(--gd-color-forest)]"
                                          >
                                            <span className="text-emerald-600">✓</span>
                                            <span>{ingredient}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {benefits.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {benefitsLabel}
                                      </p>
                                      <ul className="space-y-1.5">
                                        {benefits.map((benefitItem, benefitIndex) => (
                                          <li
                                            key={`${product.id}-dip-benefit-${benefitIndex}`}
                                            className="flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-[var(--gd-color-forest)]"
                                          >
                                            <span className="mt-0.5 text-base">✨</span>
                                            <span>{benefitItem}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {(nutritionValues.calories > 0 ||
                                    nutritionValues.protein > 0 ||
                                    nutritionValues.fats > 0 ||
                                    nutritionValues.fiber > 0 ||
                                    isVegan ||
                                    isGlutenFree ||
                                    hasReturnableContainer) && (
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {t("salads.nutrition")}
                                      </p>
                                      {(nutritionValues.calories > 0 ||
                                        nutritionValues.protein > 0 ||
                                        nutritionValues.fats > 0 ||
                                        nutritionValues.fiber > 0) && (
                                        <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--gd-color-forest)]">
                                          {nutritionValues.calories > 0 ? `🔥 ${nutritionValues.calories} cal` : ""}
                                          {nutritionValues.calories > 0 &&
                                          (nutritionValues.protein > 0 ||
                                            nutritionValues.fats > 0 ||
                                            nutritionValues.fiber > 0)
                                            ? " | "
                                            : ""}
                                          {nutritionValues.protein > 0 ? `💪 ${nutritionValues.protein}g proteína` : ""}
                                          {nutritionValues.protein > 0 &&
                                          (nutritionValues.fats > 0 || nutritionValues.fiber > 0)
                                            ? " | "
                                            : ""}
                                          {nutritionValues.fats > 0 ? `🥑 ${nutritionValues.fats}g grasas` : ""}
                                          {nutritionValues.fats > 0 && nutritionValues.fiber > 0 ? " | " : ""}
                                          {nutritionValues.fiber > 0 ? `🌿 ${nutritionValues.fiber}g fibra` : ""}
                                        </div>
                                      )}

                                      <div className="flex flex-wrap gap-2">
                                        {isVegan && (
                                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            🌱 {t("catalog.vegan")}
                                          </span>
                                        )}
                                        {isGlutenFree && (
                                          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                            ✓ {t("catalog.gluten_free")}
                                          </span>
                                        )}
                                        {hasReturnableContainer && (
                                          <span className="inline-flex items-center rounded-full bg-[var(--gd-color-sprout)]/50 px-3 py-1 text-xs font-semibold text-[var(--gd-color-forest)]">
                                            ♻️ {returnableLabel}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {note && (
                                    <div className="rounded-lg border border-[var(--gd-color-leaf)]/25 bg-white/75 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {noteLabel}
                                      </p>
                                      <p className="text-sm leading-relaxed text-[var(--gd-color-forest)]">{note}</p>
                                    </div>
                                  )}

                                  {perfectFor && (
                                    <div className="rounded-lg border border-[var(--gd-color-citrus)]/30 bg-[var(--gd-color-citrus)]/10 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {perfectForLabel}
                                      </p>
                                      <p className="text-sm leading-relaxed text-[var(--gd-color-forest)]">{perfectFor}</p>
                                    </div>
                                  )}

                                  {!hasStructuredBackContent && (
                                    <p className="rounded-lg bg-white/70 px-3 py-2.5 text-center text-sm leading-relaxed text-[var(--gd-color-forest)]">
                                      {fallbackDescription}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="mx-auto w-full max-w-md space-y-4 text-left">
                                  {ingredients.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {t("salads.ingredients")}
                                      </p>
                                      {isSaladImage && (
                                        <p className="text-[11px] text-[var(--gd-color-text-muted)]">
                                          {t("salads.exclude_hint")}
                                        </p>
                                      )}
                                      <ul className="space-y-1.5">
                                        {ingredients.map((ingredient, ingredientIndex) => (
                                          <li
                                            key={`${product.id}-ingredient-${ingredientIndex}`}
                                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                                              isSaladImage && excludedIngredientSet.has(ingredientIndex)
                                                ? "bg-rose-50/80 text-rose-700"
                                                : "bg-white/70 text-[var(--gd-color-forest)]"
                                            }`}
                                          >
                                            {!isSaladImage && (
                                              <span className="text-base">
                                                {ingredientIcons[ingredientIndex % ingredientIcons.length]}
                                              </span>
                                            )}
                                            <span
                                              className={`leading-snug ${
                                                isSaladImage && excludedIngredientSet.has(ingredientIndex)
                                                  ? "line-through text-[var(--gd-color-text-muted)]"
                                                  : ""
                                              }`}
                                            >
                                              {ingredient}
                                            </span>
                                            {isSaladImage && (
                                              <button
                                                type="button"
                                                onClick={() => toggleExcludedIngredient(productId, ingredientIndex)}
                                                className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                                                  excludedIngredientSet.has(ingredientIndex)
                                                    ? "border-rose-300 bg-rose-100 text-rose-700"
                                                    : "border-[var(--gd-color-leaf)]/30 bg-white text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30"
                                                }`}
                                              >
                                                {excludedIngredientSet.has(ingredientIndex) ? t("salads.excluded") : t("salads.exclude")}
                                              </button>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {isSaladImage ? (
                                    <div className="space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleNutritionExpanded(productId)}
                                        className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--gd-color-forest)]/20 bg-[var(--gd-color-sprout)]/45 px-4 py-2.5 text-sm font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)] hover:text-white"
                                      >
                                        {isNutritionExpanded
                                          ? t("salads.hide_nutrition_values")
                                          : t("salads.view_nutrition_values")}
                                      </button>

                                      {isNutritionExpanded && (
                                        <div className="space-y-2 rounded-xl border border-[var(--gd-color-leaf)]/20 bg-white/70 p-3">
                                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                            {t("salads.nutrition")}
                                          </p>

                                          <div className="grid grid-cols-2 gap-2">
                                            {nutritionValues.calories > 0 && (
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.calories")}</p>
                                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{nutritionValues.calories} kcal</p>
                                              </div>
                                            )}
                                            {nutritionValues.protein > 0 && (
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.protein")}</p>
                                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{nutritionValues.protein} g</p>
                                              </div>
                                            )}
                                            {nutritionValues.carbs > 0 && (
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.carbs")}</p>
                                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{nutritionValues.carbs} g</p>
                                              </div>
                                            )}
                                            {nutritionValues.fats > 0 && (
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.fats")}</p>
                                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{nutritionValues.fats} g</p>
                                              </div>
                                            )}
                                            {nutritionValues.fiber > 0 && (
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("category.fiber")}</p>
                                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{nutritionValues.fiber} g</p>
                                              </div>
                                            )}
                                            {nutritionValues.sugars > 0 && (
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("category.sugars")}</p>
                                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{nutritionValues.sugars} g</p>
                                              </div>
                                            )}
                                          </div>

                                          {(vitaminA || vitaminC) && (
                                            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">Vitamina A</p>
                                                <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{vitaminA || "-"}</p>
                                              </div>
                                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">Vitamina C</p>
                                                <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{vitaminC || "-"}</p>
                                              </div>
                                            </div>
                                          )}

                                          {(benefit || perfectFor) && (
                                            <div className="space-y-1.5 pt-1">
                                              {benefit && (
                                                <p className="text-xs text-[var(--gd-color-forest)]">
                                                  <span className="font-semibold">{t("salads.benefit")}: </span>
                                                  {benefit}
                                                </p>
                                              )}
                                              {perfectFor && (
                                                <p className="text-xs text-[var(--gd-color-forest)]">
                                                  <span className="font-semibold">{t("salads.recommended")}: </span>
                                                  {perfectFor}
                                                </p>
                                              )}
                                            </div>
                                          )}

                                          {nutritionValues.calories <= 0 &&
                                            nutritionValues.protein <= 0 &&
                                            nutritionValues.carbs <= 0 &&
                                            nutritionValues.fats <= 0 &&
                                            nutritionValues.fiber <= 0 &&
                                            nutritionValues.sugars <= 0 &&
                                            !vitaminA &&
                                            !vitaminC &&
                                            !benefit &&
                                            !perfectFor && (
                                              <p className="rounded-lg bg-white px-3 py-2 text-center text-xs text-[var(--gd-color-text-muted)]">
                                                {t("catalog.details_placeholder")}
                                              </p>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    nutritionHighlights.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                          {t("salads.nutrition")}
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                          {nutritionHighlights.map((highlight) => (
                                            <div
                                              key={`${product.id}-${highlight.label}`}
                                              className="rounded-lg border border-[var(--gd-color-leaf)]/25 bg-white/75 px-3 py-2"
                                            >
                                              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                                {highlight.icon} {highlight.label}
                                              </p>
                                              <p className="text-sm font-bold text-[var(--gd-color-forest)]">
                                                {highlight.value}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  )}

                                  {!isSaladImage && perfectFor && (
                                    <div className="rounded-lg border border-[var(--gd-color-citrus)]/30 bg-[var(--gd-color-citrus)]/10 px-3 py-2.5">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                                        {t("salads.recommended")}
                                      </p>
                                      <p className="text-sm leading-relaxed text-[var(--gd-color-forest)]">
                                        {perfectFor}
                                      </p>
                                    </div>
                                  )}

                                  {!hasStructuredBackContent && (
                                    <p className="rounded-lg bg-white/70 px-3 py-2.5 text-center text-sm leading-relaxed text-[var(--gd-color-forest)]">
                                      {fallbackDescription}
                                    </p>
                                  )}
                                </div>
                              )
	                          }
	                      />
                        </motion.div>
	                    );
	                  })}
	                </motion.div>
	              )}
	            </motion.section>
          ))}
        </div>
      </div>
    </section>
  );
}
