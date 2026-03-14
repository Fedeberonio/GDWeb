"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Loader2, Salad as SaladIcon } from "lucide-react";
import { useCart } from "@/modules/cart/context";
import toast from "react-hot-toast";
import { useTranslation } from "@/modules/i18n/use-translation";
import { ProductCard } from "./product-card";

import type { LocalizedString, Product, Salad as SaladProduct } from "@/modules/catalog/types";

const toLocalizedString = (value: unknown): LocalizedString => {
  if (!value) return { es: "", en: "" };
  if (typeof value === "string") return { es: value, en: value };
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const es = typeof record.es === "string" ? record.es : undefined;
    const en = typeof record.en === "string" ? record.en : undefined;
    return { es: es ?? en ?? "", en: en ?? es ?? "" };
  }
  return { es: "", en: "" };
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isEnsaladaProduct = (product: Product) =>
  product.type === "prepared" && (product.categoryId ?? "").toLowerCase() === "ensaladas";

const mapProductToSalad = (product: Product): SaladProduct => {
  const metadata = (product as Product & { metadata?: Record<string, unknown> }).metadata ?? {};
  const presentation = product.presentation;
  const recipeIngredients = Array.isArray(product.recipe?.ingredients) ? product.recipe?.ingredients : [];
  const ingredients = recipeIngredients
    .map((ingredient) => {
      if (ingredient?.name) return toLocalizedString(ingredient.name);
      const fallback = String(ingredient?.productId || ingredient?.supplyId || "").trim();
      if (!fallback) return null;
      return { es: fallback, en: fallback };
    })
    .filter(Boolean) as LocalizedString[];

  const imageKey = product.sku ?? product.id;
  const image = product.image || (imageKey ? `/assets/images/salads/${imageKey}.png` : "");

  const cost = Number.isFinite(Number(metadata.cost)) ? Number(metadata.cost) : undefined;
  const margin = Number.isFinite(Number(metadata.margin)) ? Number(metadata.margin) : undefined;

  return {
    id: product.id,
    name: toLocalizedString(product.name),
    description: product.description ? toLocalizedString(product.description) : undefined,
    price: product.salePrice || toNumber(product.price, 0),
    cost,
    margin,
    calories: toNumber(product.nutrition?.calories, 0),
    protein: toNumber(product.nutrition?.protein, 0),
    glutenFree: Boolean(product.nutrition?.glutenFree),
    benefit: toLocalizedString(presentation?.benefit ?? metadata.benefit),
    benefitDetail: toLocalizedString(presentation?.benefitDetail ?? metadata.benefitDetail),
    recommendedFor: toLocalizedString(product.nutrition?.detailPerfectFor ?? metadata.recommendedFor),
    carbs: toNumber(product.nutrition?.carbs, 0),
    fats: toNumber(product.nutrition?.fats, 0),
    fiber: toNumber(product.nutrition?.fiber, 0),
    sugars: toNumber(product.nutrition?.sugars, 0),
    vitaminA:
      typeof presentation?.vitamins?.vitaminA === "string"
        ? presentation.vitamins.vitaminA
        : typeof metadata.vitaminA === "string"
          ? metadata.vitaminA
          : "",
    vitaminC:
      typeof presentation?.vitamins?.vitaminC === "string"
        ? presentation.vitamins.vitaminC
        : typeof metadata.vitaminC === "string"
          ? metadata.vitaminC
          : "",
    image,
    ingredients,
    status: product.status === "inactive" || product.status === "coming_soon" ? product.status : "active",
    isFeatured: Boolean(product.isFeatured),
  };
};

export function SaladsSection() {
  const { t, tData } = useTranslation();
  const { addItem } = useCart();
  const [salads, setSalads] = useState<SaladProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saladNotes, setSaladNotes] = useState<Record<string, string>>({});
  const [saladExcludedIngredients, setSaladExcludedIngredients] = useState<Record<string, number[]>>({});
  const [saladQuantities, setSaladQuantities] = useState<Record<string, number>>({});
  const [flippedSalads, setFlippedSalads] = useState<Record<string, boolean>>({});
  const [nutritionExpanded, setNutritionExpanded] = useState<Record<string, boolean>>({});
  const [visibleSalads, setVisibleSalads] = useState<Set<number>>(new Set());
  const saladRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getIngredientLabel = (ingredient: LocalizedString | string) => tData(ingredient);

  useEffect(() => {
    async function loadSalads() {
      try {
        setLoading(true);
        const response = await fetch("/api/catalog/products", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const json = await response.json();
        const products = Array.isArray(json.data) ? json.data : [];
        const saladProducts = products.filter(isEnsaladaProduct);
        const mappedSalads = saladProducts.map(mapProductToSalad);
        setSalads(mappedSalads);
        setVisibleSalads(new Set());
      } catch (error) {
        console.error("Error loading salads:", error);
        toast.error("Error al cargar las ensaladas");
        setSalads([]);
      } finally {
        setLoading(false);
      }
    }

    loadSalads();
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    saladRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleSalads((prev) => new Set([...prev, index]));
              observer.unobserve(ref);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [salads]);

  const setSaladFlipped = (saladId: string, flipped: boolean) => {
    setFlippedSalads((prev) => ({ ...prev, [saladId]: flipped }));
    if (!flipped) {
      setNutritionExpanded((prev) => ({ ...prev, [saladId]: false }));
    }
  };

  const toggleNutritionExpanded = (saladId: string) => {
    setNutritionExpanded((prev) => ({ ...prev, [saladId]: !prev[saladId] }));
  };

  const toggleExcludedIngredient = (saladId: string, ingredientIndex: number) => {
    setSaladExcludedIngredients((prev) => {
      const current = new Set(prev[saladId] ?? []);
      if (current.has(ingredientIndex)) {
        current.delete(ingredientIndex);
      } else {
        current.add(ingredientIndex);
      }
      return {
        ...prev,
        [saladId]: Array.from(current),
      };
    });
  };

  const getQuantity = (saladId: string) => Math.max(1, saladQuantities[saladId] ?? 1);
  const updateQuantity = (saladId: string, delta: number) => {
    setSaladQuantities((prev) => {
      const current = prev[saladId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [saladId]: next };
    });
  };
  const resetQuantity = (saladId: string) => {
    setSaladQuantities((prev) => ({ ...prev, [saladId]: 1 }));
  };

  const handleAddSalad = (
    salad: SaladProduct,
    options?: { notes?: string; excludedIngredients?: string[]; quantity?: number }
  ) => {
    const notes = options?.notes?.trim();
    const excludedIngredients = options?.excludedIngredients?.filter(Boolean);
    const quantity = options?.quantity ?? 1;

    addItem({
      type: "product",
      slug: salad.id,
      name: tData(salad.name),
      price: salad.price,
      quantity,
      slotValue: 1,
      weightKg: 0,
      image: salad.image,
      notes: notes || undefined,
      excludedIngredients: excludedIngredients?.length ? excludedIngredients : undefined,
    });

    toast.success(`${tData(salad.name)} ${t("common.added").toLowerCase()}`, {
      duration: 3000,
      style: {
        background: "var(--gd-color-forest)",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 20px",
      },
    });
  };

  return (
    <div className="relative z-0 isolate">
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/30 to-[var(--gd-color-citrus)]/20 px-4 py-1.5 border-2 border-[var(--gd-color-leaf)]/30">
          <SaladIcon className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gd-color-forest)]">
            {t("salads.header_badge")}
          </span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-green-800">
          {t("salads.title")}
        </h2>
        <p className="font-display max-w-2xl mx-auto text-base md:text-lg text-[var(--gd-color-forest)] leading-relaxed font-medium">
          {t("salads.header_desc")}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gd-color-leaf)] mx-auto" />
            <p className="text-sm text-[var(--gd-color-text-muted)]">Cargando ensaladas...</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="relative z-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-8">
          {salads.map((salad, index) => {
            const isVisible = visibleSalads.has(index);
            const quantity = getQuantity(salad.id);
            const isFlipped = Boolean(flippedSalads[salad.id]);
            const isNutritionExpanded = Boolean(nutritionExpanded[salad.id]);
            const excludedIngredientIndexes = new Set(saladExcludedIngredients[salad.id] ?? []);
            const notesValue = saladNotes[salad.id] ?? "";
            const badges = [
              { label: "UNIT", tone: "unit" as const },
              salad.glutenFree ? { label: "SIN GLUTEN", tone: "glutenFree" as const } : null,
            ].filter(Boolean) as Array<{ label: string; tone: "unit" | "glutenFree" }>;
            const imageSrc = salad.image || "/assets/images/salads/placeholder.png";

            return (
              <div
                key={salad.id}
                ref={(el) => {
                  saladRefs.current[index] = el as HTMLDivElement | null;
                }}
                className={`${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} relative z-0 transition-all duration-700`}
                style={{
                  transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                  transitionTimingFunction: "ease-out",
                }}
              >
                <ProductCard
                  type="salad"
                  title={tData(salad.name)}
                  description={tData(salad.description ?? "")}
                  imageContainerClassName="bg-white"
                  imageClassName="p-3 md:p-4 object-contain object-center group-hover:scale-100"
                  image={{ src: imageSrc, alt: tData(salad.name), fit: "contain", priority: index < 3 }}
                  badges={badges}
                  priceLabel={`RD$${salad.price.toLocaleString("es-DO", { minimumFractionDigits: 0 })}`}
                  detailsCtaLabel={t("common.view_details")}
                  quantity={quantity}
                  onDecrease={() => updateQuantity(salad.id, -1)}
                  onIncrease={() => updateQuantity(salad.id, 1)}
                  onAdd={() => {
                    if (!isFlipped) {
                      setSaladFlipped(salad.id, true);
                      return;
                    }

                    const excludedIngredients = (saladExcludedIngredients[salad.id] ?? [])
                      .map((ingredientIndex) => salad.ingredients[ingredientIndex])
                      .filter(Boolean)
                      .map(getIngredientLabel);

                    handleAddSalad(salad, {
                      notes: saladNotes[salad.id],
                      excludedIngredients,
                      quantity,
                    });
                    resetQuantity(salad.id);
                    setSaladFlipped(salad.id, false);
                  }}
                  addLabel={t("common.add_to_cart")}
                  compactControls
                  controlsPlacement="both"
                  isFlipped={isFlipped}
                  onFlipChange={(next) => setSaladFlipped(salad.id, next)}
                  imageAction={
                    <button
                      type="button"
                      onClick={() => setSaladFlipped(salad.id, true)}
                      aria-label={t("common.view_details")}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-orange)] bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--gd-color-orange)] shadow-md ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--gd-color-orange)] hover:text-white active:translate-y-0"
                    >
                      <Info className="h-4 w-4" />
                      <span>{t("common.view_details")}</span>
                    </button>
                  }
                  backContent={
                    <div className="mx-auto w-full max-w-md space-y-4 text-left">
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleNutritionExpanded(salad.id)}
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
                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.calories")}</p>
                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{salad.calories} kcal</p>
                              </div>
                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.protein")}</p>
                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{salad.protein} g</p>
                              </div>
                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.carbs")}</p>
                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{salad.carbs} g</p>
                              </div>
                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("salads.fats")}</p>
                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{salad.fats} g</p>
                              </div>
                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("category.fiber")}</p>
                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{salad.fiber} g</p>
                              </div>
                              <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">{t("category.sugars")}</p>
                                <p className="text-sm font-bold text-[var(--gd-color-forest)]">{salad.sugars} g</p>
                              </div>
                            </div>
                            {(salad.vitaminA || salad.vitaminC) && (
                              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                                <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                  <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">Vitamina A</p>
                                  <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{salad.vitaminA || "-"}</p>
                                </div>
                                <div className="rounded-lg border border-[var(--gd-color-leaf)]/20 bg-white px-2.5 py-2">
                                  <p className="text-[10px] uppercase text-[var(--gd-color-text-muted)]">Vitamina C</p>
                                  <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{salad.vitaminC || "-"}</p>
                                </div>
                              </div>
                            )}
                            {(tData(salad.benefitDetail).trim() || tData(salad.recommendedFor).trim()) && (
                              <div className="space-y-1.5 pt-1">
                                {tData(salad.benefitDetail).trim() && (
                                  <p className="text-xs text-[var(--gd-color-forest)]">
                                    <span className="font-semibold">{t("salads.benefit")}: </span>
                                    {tData(salad.benefitDetail)}
                                  </p>
                                )}
                                {tData(salad.recommendedFor).trim() && (
                                  <p className="text-xs text-[var(--gd-color-forest)]">
                                    <span className="font-semibold">{t("salads.recommended")}: </span>
                                    {tData(salad.recommendedFor)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 rounded-xl border border-[var(--gd-color-leaf)]/20 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                          {t("salads.ingredients")}
                        </p>
                        <p className="text-[11px] text-[var(--gd-color-text-muted)]">{t("salads.exclude_hint")}</p>
                        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                          {salad.ingredients.map((ingredient, ingredientIndex) => {
                            const isExcluded = excludedIngredientIndexes.has(ingredientIndex);
                            return (
                              <div
                                key={`${salad.id}-ingredient-${ingredientIndex}`}
                                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                                  isExcluded
                                    ? "border-rose-200 bg-rose-50/80"
                                    : "border-[var(--gd-color-leaf)]/20 bg-white"
                                }`}
                              >
                                <span
                                  className={`text-sm leading-snug ${
                                    isExcluded
                                      ? "text-[var(--gd-color-text-muted)] line-through"
                                      : "text-[var(--gd-color-forest)]"
                                  }`}
                                >
                                  {getIngredientLabel(ingredient)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleExcludedIngredient(salad.id, ingredientIndex)}
                                  className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                                    isExcluded
                                      ? "border-rose-300 bg-rose-100 text-rose-700"
                                      : "border-[var(--gd-color-leaf)]/30 bg-white text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30"
                                  }`}
                                >
                                  {isExcluded ? t("salads.excluded") : t("salads.exclude")}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 rounded-xl border border-[var(--gd-color-leaf)]/20 bg-white/70 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                          {t("salads.notes_title")}
                        </p>
                        <textarea
                          value={notesValue}
                          onChange={(event) =>
                            setSaladNotes((prev) => ({
                              ...prev,
                              [salad.id]: event.target.value,
                            }))
                          }
                          rows={2}
                          placeholder={t("salads.notes_placeholder")}
                          className="w-full rounded-xl border border-[var(--gd-color-leaf)]/25 bg-white px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--gd-color-leaf)] focus:outline-none"
                        />
                      </div>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
