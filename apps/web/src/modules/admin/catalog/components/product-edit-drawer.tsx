"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Upload, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getFirestore, collection, getDocs } from "firebase/firestore";

import { adminFetch } from "@/modules/admin/api/client";
import { ProductImageFallback } from "@/app/_components/product-image-fallback";
import type { Product, ProductCategory, ProductType } from "@/modules/catalog/types";
import {
  aggregateCatalogLinePricing,
  computeCatalogLinePricing,
  computeMarginPercent,
  formatCatalogCurrency,
  formatCatalogPercent,
} from "@/modules/catalog/pricing";
import { buildCanonicalProductLookup, dedupeCatalogProducts, normalizeCatalogSearch } from "@/modules/catalog/product-canonical";
import { normalizeCatalogProduct } from "@/modules/catalog/product-normalization";
import { getFirebaseApp } from "@/lib/firebase/client";
import {
  getEffectiveSaleSourceLabel,
  persistSourceProductEffectiveSalePrice,
  persistSourceProductPricing,
  replaceCatalogProduct,
} from "@/modules/admin/catalog/source-product-pricing";

type ProductEditDrawerProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onProductUpdated: (product: Product) => void;
  onProductDeleted: (productId: string) => void;
};

type FormState = {
  sku: string;
  nameEs: string;
  nameEn: string;
  priceAmount: string;
  salePriceAmount: string;
  descriptionEs: string;
  descriptionEn: string;
  unitEs: string;
  unitEn: string;
  image: string;
  tags: string;
  status: Product["status"];
  isFeatured: boolean;
  categoryId: string;
  type: ProductType;
  recipeYields: string;
  recipeIngredients: {
    productId?: string;
    supplyId?: string;
    quantity: number;
    unit: string
  }[];
  slotValue: string;
  wholesaleCost: string;
  stock: string;
  minStock: string;
  weightKg: string;
  storageEs: string;
  storageEn: string;
  dimensionLength: string;
  dimensionWidth: string;
  dimensionHeight: string;
  vegan: boolean;
  glutenFree: boolean;
  organic: boolean;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugars: string;
  nutritionDescriptionEs: string;
  nutritionDescriptionEn: string;
  nutritionIngredients: string;
  nutritionBenefits: string;
  nutritionPerfectForEs: string;
  nutritionPerfectForEn: string;
  nutritionNoteEs: string;
  nutritionNoteEn: string;
  presentationBenefitEs: string;
  presentationBenefitEn: string;
  presentationBenefitDetailEs: string;
  presentationBenefitDetailEn: string;
  vitaminA: string;
  vitaminC: string;
  suppliesRecipe: { supplyId: string; name: string; quantity: number }[];
};

type SupplyOption = {
  id: string;
  name: string;
};

const STATUS_OPTIONS: Product["status"][] = ["active", "inactive", "coming_soon", "discontinued"];

type PriceMetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

type PendingRecipePurchaseUpdate = {
  ingredientIndex: number;
  product: Product;
  nextWholesaleCost: number;
  currentWholesaleCost: number | null;
};

type PendingRecipeSaleUpdate = {
  ingredientIndex: number;
  product: Product;
  nextSalePrice: number;
  currentSalePrice: number | null;
  sourceLabel: string;
};

function PriceMetricCard({ label, value, hint }: PriceMetricCardProps) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
      <div className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">{value}</div>
      {hint ? <div className="mt-1 text-[0.7rem] text-[var(--gd-color-text-muted)]">{hint}</div> : null}
    </div>
  );
}

function resolveProductType(product: Product): ProductType {
  const rawType = typeof (product as { type?: unknown }).type === "string"
    ? String((product as { type?: string }).type).toLowerCase()
    : "";

  if (rawType === "simple" || rawType === "box" || rawType === "salad" || rawType === "prepared") {
    return rawType;
  }

  // Legacy value still present in some records.
  if (rawType === "combo") {
    return "prepared";
  }

  const skuOrId = product.sku ?? product.id ?? "";
  const normalizedCategory = (product.categoryId ?? "").toLowerCase();
  if (normalizedCategory === "cajas" || /^GD-CAJA-/i.test(skuOrId)) {
    return "box";
  }
  if (normalizedCategory.includes("ensalada")) {
    return "prepared";
  }

  return "simple";
}

function resolveUnitFields(unit: Product["unit"]): { es: string; en: string } {
  if (typeof unit === "string") {
    return { es: unit, en: unit };
  }
  if (unit && typeof unit === "object") {
    return {
      es: unit.es ?? unit.en ?? "",
      en: unit.en ?? unit.es ?? "",
    };
  }
  return { es: "", en: "" };
}

function toSafeString(value: unknown, fallback = ""): string {
  return value !== undefined && value !== null ? String(value) : fallback;
}

function resolveLocalizedNutritionField(
  value: unknown,
): { es: string; en: string } {
  if (!value) return { es: "", en: "" };
  if (typeof value === "string") return { es: value, en: value };
  if (typeof value === "object") {
    const record = value as { es?: unknown; en?: unknown };
    return {
      es: typeof record.es === "string" ? record.es : "",
      en: typeof record.en === "string" ? record.en : "",
    };
  }
  return { es: "", en: "" };
}

function resolveMultilineList(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function parseMultilineList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildLocalizedPayload(esValue: string, enValue: string): { es: string; en: string } | null {
  const es = esValue.trim();
  const en = enValue.trim();
  if (!es && !en) return null;
  return { es, en };
}

function buildInitialForm(product: Product): FormState {
  const resolvedType = resolveProductType(product);
  const unitFields = resolveUnitFields(product.unit);
  const legacyMetadata = (product.metadata as Record<string, unknown> | undefined) ?? undefined;

  const billOfMaterials = Array.isArray(product.metadata?.billOfMaterials)
    ? product.metadata?.billOfMaterials
        .map((item) => ({
          supplyId: item.supplyId,
          name: item.name ?? "",
          quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0,
        }))
        .filter((item) => item.supplyId)
    : [];
  const recipeIngredients = Array.isArray(product.recipe?.ingredients)
    ? product.recipe?.ingredients.map((item) => ({
        productId: item.productId ?? "",
        supplyId: item.supplyId ?? "",
        quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0,
        unit: item.unit ?? "und",
      }))
    : [];
  const nutritionDescription = resolveLocalizedNutritionField(product.nutrition?.detailDescription);
  const nutritionPerfectFor = resolveLocalizedNutritionField(product.nutrition?.detailPerfectFor);
  const nutritionNote = resolveLocalizedNutritionField(product.nutrition?.detailNote);
  const presentationBenefit = resolveLocalizedNutritionField(product.presentation?.benefit ?? legacyMetadata?.benefit);
  const presentationBenefitDetail = resolveLocalizedNutritionField(
    product.presentation?.benefitDetail ?? legacyMetadata?.benefitDetail,
  );
  return {
    sku: product.sku ?? product.id ?? "",
    nameEs: product.name.es ?? "",
    nameEn: product.name.en ?? "",
    priceAmount: toSafeString(product.price),
    salePriceAmount: toSafeString(product.salePrice),
    descriptionEs: product.description?.es ?? "",
    descriptionEn: product.description?.en ?? "",
    unitEs: unitFields.es,
    unitEn: unitFields.en,
    image: product.image ?? "",
    tags: product.tags?.join(", ") ?? "",
    status: product.status ?? (product.isActive ? "active" : "inactive"),
    isFeatured: product.isFeatured ?? false,
    categoryId: product.categoryId ?? "",
    type: resolvedType,
    recipeYields: toSafeString(product.recipe?.yields, "1"),
    recipeIngredients,
    slotValue: toSafeString(product.metadata?.slotValue),
    wholesaleCost: toSafeString(product.metadata?.wholesaleCost),
    stock: toSafeString(product.metadata?.stock),
    minStock: toSafeString(product.metadata?.minStock),
    weightKg: toSafeString(product.logistics?.weightKg),
    storageEs: product.logistics?.storage?.es ?? "",
    storageEn: product.logistics?.storage?.en ?? "",
    dimensionLength: toSafeString(product.logistics?.dimensionsCm?.length),
    dimensionWidth: toSafeString(product.logistics?.dimensionsCm?.width),
    dimensionHeight: toSafeString(product.logistics?.dimensionsCm?.height),
    vegan: product.nutrition?.vegan ?? false,
    glutenFree: product.nutrition?.glutenFree ?? false,
    organic: product.nutrition?.organic ?? false,
    calories: toSafeString(product.nutrition?.calories),
    protein: toSafeString(product.nutrition?.protein),
    carbs: toSafeString(product.nutrition?.carbs),
    fats: toSafeString(product.nutrition?.fats),
    fiber: toSafeString(product.nutrition?.fiber),
    sugars: toSafeString(product.nutrition?.sugars),
    nutritionDescriptionEs: nutritionDescription.es,
    nutritionDescriptionEn: nutritionDescription.en,
    nutritionIngredients: resolveMultilineList(product.nutrition?.detailIngredients),
    nutritionBenefits: resolveMultilineList(product.nutrition?.detailBenefits),
    nutritionPerfectForEs: nutritionPerfectFor.es,
    nutritionPerfectForEn: nutritionPerfectFor.en,
    nutritionNoteEs: nutritionNote.es,
    nutritionNoteEn: nutritionNote.en,
    presentationBenefitEs: presentationBenefit.es,
    presentationBenefitEn: presentationBenefit.en,
    presentationBenefitDetailEs: presentationBenefitDetail.es,
    presentationBenefitDetailEn: presentationBenefitDetail.en,
    vitaminA:
      typeof product.presentation?.vitamins?.vitaminA === "string"
        ? product.presentation.vitamins.vitaminA
        : toSafeString(legacyMetadata?.vitaminA),
    vitaminC:
      typeof product.presentation?.vitamins?.vitaminC === "string"
        ? product.presentation.vitamins.vitaminC
        : toSafeString(legacyMetadata?.vitaminC),
    suppliesRecipe: billOfMaterials,
  };
}

export function ProductEditDrawer({
  product,
  isOpen,
  onClose,
  categories,
  onProductUpdated,
  onProductDeleted,
}: ProductEditDrawerProps) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "logistics" | "nutrition" | "supplies">("basic");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableSupplies, setAvailableSupplies] = useState<SupplyOption[]>([]);
  const [recipeSourcesLoading, setRecipeSourcesLoading] = useState(false);
  const [selectedSupplyId, setSelectedSupplyId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [ingredientSearch, setIngredientSearch] = useState<Record<number, string>>({});
  const [activeIngredientDropdown, setActiveIngredientDropdown] = useState<number | null>(null);
  const [recipePurchasePriceDrafts, setRecipePurchasePriceDrafts] = useState<Record<number, string>>({});
  const [recipeSalePriceDrafts, setRecipeSalePriceDrafts] = useState<Record<number, string>>({});
  const [pendingRecipePurchaseUpdate, setPendingRecipePurchaseUpdate] = useState<PendingRecipePurchaseUpdate | null>(null);
  const [pendingRecipeSaleUpdate, setPendingRecipeSaleUpdate] = useState<PendingRecipeSaleUpdate | null>(null);
  const [savingRecipePurchaseUpdate, setSavingRecipePurchaseUpdate] = useState(false);
  const [savingRecipeSaleUpdate, setSavingRecipeSaleUpdate] = useState(false);
  const availableProductLookup = useMemo(() => buildCanonicalProductLookup(availableProducts), [availableProducts]);
  const resolveImagePath = useCallback((sku: string, currentImage?: string) => {
    if (currentImage?.startsWith("/assets/images/")) return currentImage;
    if (/^GD-CAJA-/i.test(sku)) return `/assets/images/boxes/${sku}.png`;
    return `/assets/images/products/${sku}.png`;
  }, []);

  useEffect(() => {
    if (product && isOpen) {
      try {
        setFormState(buildInitialForm(product));
      } catch (err) {
        console.error("Failed to build initial product form:", err);
        setFormState(null);
        setError("No se pudo cargar el formulario del producto.");
        return;
      }
      setError(null);
      setMessage(null);
      setActiveTab("basic");
      setSelectedFile(null);
      setPreviewUrl(null);
      setAddQuantity("1");
      setIngredientSearch({});
      setRecipePurchasePriceDrafts({});
      setRecipeSalePriceDrafts({});
      setActiveIngredientDropdown(null);
      setPendingRecipePurchaseUpdate(null);
      setPendingRecipeSaleUpdate(null);
    }
  }, [product, isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen || (!formState && activeTab !== "supplies")) return;
    if (recipeSourcesLoading || (availableSupplies.length > 0 && availableProducts.length > 0)) return;

    const fetchRecipeSources = async () => {
      setRecipeSourcesLoading(true);
      try {
        const db = getFirestore(getFirebaseApp());
        const [suppliesSnapshot, productsSnapshot] = await Promise.all([
          getDocs(collection(db, "catalog_supplies")),
          getDocs(collection(db, "catalog_products")),
        ]);

        const supplies = suppliesSnapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as { name?: string };
            return { id: docSnap.id, name: data.name ?? docSnap.id };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        const products = dedupeCatalogProducts(
          productsSnapshot.docs
            .map((docSnap) => normalizeCatalogProduct(docSnap.id, docSnap.data() as Record<string, unknown>))
            .filter((candidate) => candidate.status !== "hidden"),
        ).sort((a, b) => {
          const left = a.name.es || a.name.en || a.sku || a.id;
          const right = b.name.es || b.name.en || b.sku || b.id;
          return left.localeCompare(right, "es");
        });

        setAvailableSupplies(supplies);
        setAvailableProducts(products);
        if (!selectedSupplyId && supplies.length > 0) {
          setSelectedSupplyId(supplies[0].id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar productos e insumos.";
        setError(message);
        toast.error(message);
      } finally {
        setRecipeSourcesLoading(false);
      }
    };

    fetchRecipeSources();
  }, [
    activeTab,
    availableProducts.length,
    availableSupplies.length,
    formState,
    isOpen,
    recipeSourcesLoading,
    selectedSupplyId,
  ]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!product || !formState) return;

      setSaving(true);

      // Validate SKU is required
      if (!formState.sku?.trim()) {
        setError("El SKU es requerido. Usa el botón 'Auto-generar' o escribe uno manualmente.");
        setSaving(false);
        toast.error("SKU requerido");
        return;
      }

      // Validate SKU format
      if (!/^[A-Za-z0-9\-_]+$/.test(formState.sku)) {
        setError("El SKU solo puede contener letras, números, guiones y guiones bajos");
        setSaving(false);
        toast.error("Formato de SKU inválido");
        return;
      }

      setError(null);
      setMessage(null);

      try {
        // Forzar ruta de imagen basada en SKU
        const sku = formState.sku || product.id;
        let imagePath = resolveImagePath(sku, product.image);

        if (selectedFile) {
          const formData = new FormData();
          formData.append("sku", sku);
          formData.append("productId", product.id);
          formData.append("categoryId", product.categoryId ?? "");
          if (sku.toUpperCase().startsWith("GD-CAJA") || product.categoryId === "cajas") {
            formData.append("folder", "boxes");
          }
          formData.append("file", selectedFile);

          const uploadResponse = await adminFetch("/api/admin/upload-image", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || "No se pudo subir la imagen");
          }

          const uploadJson = await uploadResponse.json();
          if (uploadJson?.data?.imageUrl) {
            imagePath = uploadJson.data.imageUrl;
          }
        }

        const normalizedRecipeIngredients = formState.recipeIngredients
          .map((ingredient) => ({
            ...(ingredient.productId && { productId: ingredient.productId.trim() }),
            ...(ingredient.supplyId && { supplyId: ingredient.supplyId.trim() }),
            quantity: Number(ingredient.quantity) || 0,
            unit: ingredient.unit || "und",
          }))
          .filter((ingredient) =>
            (ingredient.productId || ingredient.supplyId) && ingredient.quantity > 0
          );

        const recipePayload =
          formState.type === "prepared"
            ? {
                yields: Math.max(1, Math.floor(Number(formState.recipeYields) || 1)),
                ingredients: normalizedRecipeIngredients,
              }
            : null;

        const updatePayload = {
          name: {
            es: formState.nameEs,
            en: formState.nameEn,
          },
          description: {
            es: formState.descriptionEs || undefined,
            en: formState.descriptionEn || undefined,
          },
          unit: {
            es: formState.unitEs || undefined,
            en: formState.unitEn || undefined,
          },
          price: parseFloat(formState.priceAmount),
          salePrice: formState.salePriceAmount ? parseFloat(formState.salePriceAmount) : null,
          status: formState.status,
          isFeatured: formState.isFeatured,
          categoryId: formState.categoryId,
          type: formState.type,
          recipe: recipePayload,
          tags: formState.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          image: imagePath, // Forzar ruta SKU
          sku: formState.sku || product.id,
          metadata: {
            slotValue: formState.slotValue ? parseInt(formState.slotValue) : undefined,
            wholesaleCost: formState.wholesaleCost ? parseFloat(formState.wholesaleCost) : undefined,
            stock: formState.stock ? parseInt(formState.stock) : undefined,
            minStock: formState.minStock ? parseInt(formState.minStock) : undefined,
            billOfMaterials: formState.suppliesRecipe.map((item) => ({
              supplyId: item.supplyId,
              name: item.name,
              quantity: item.quantity,
            })),
          },
          logistics: {
            weightKg: formState.weightKg ? parseFloat(formState.weightKg) : undefined,
            dimensionsCm:
              formState.dimensionLength && formState.dimensionWidth && formState.dimensionHeight
                ? {
                    length: parseFloat(formState.dimensionLength),
                    width: parseFloat(formState.dimensionWidth),
                    height: parseFloat(formState.dimensionHeight),
                  }
                : undefined,
            storage: {
              es: formState.storageEs || undefined,
              en: formState.storageEn || undefined,
            },
          },
          nutrition: {
            vegan: formState.vegan,
            glutenFree: formState.glutenFree,
            organic: formState.organic,
            calories: formState.calories ? parseFloat(formState.calories) : undefined,
            protein: formState.protein ? parseFloat(formState.protein) : undefined,
            carbs: formState.carbs ? parseFloat(formState.carbs) : undefined,
            fats: formState.fats ? parseFloat(formState.fats) : undefined,
            fiber: formState.fiber ? parseFloat(formState.fiber) : undefined,
            sugars: formState.sugars ? parseFloat(formState.sugars) : undefined,
            detailDescription: buildLocalizedPayload(formState.nutritionDescriptionEs, formState.nutritionDescriptionEn),
            detailIngredients: parseMultilineList(formState.nutritionIngredients),
            detailBenefits: parseMultilineList(formState.nutritionBenefits),
            detailPerfectFor: buildLocalizedPayload(formState.nutritionPerfectForEs, formState.nutritionPerfectForEn),
            detailNote: buildLocalizedPayload(formState.nutritionNoteEs, formState.nutritionNoteEn),
          },
          presentation: {
            benefit: buildLocalizedPayload(formState.presentationBenefitEs, formState.presentationBenefitEn) ?? undefined,
            benefitDetail: buildLocalizedPayload(
              formState.presentationBenefitDetailEs,
              formState.presentationBenefitDetailEn,
            ) ?? undefined,
            vitamins:
              formState.vitaminA.trim() || formState.vitaminC.trim()
                ? {
                    vitaminA: formState.vitaminA.trim() || undefined,
                    vitaminC: formState.vitaminC.trim() || undefined,
                  }
                : undefined,
          },
        };

        const response = await adminFetch(`/api/admin/catalog/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al actualizar el producto");
        }

        const updated = await response.json();
        setMessage("Producto actualizado correctamente");
        toast.success("Producto actualizado");
        setTimeout(() => {
          onProductUpdated(updated.data);
          onClose();
        }, 1000);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error inesperado";

        // Special handling for duplicate SKU (409)
        if (message.includes("ya existe") || message.includes("409")) {
          setError("SKU duplicado. Este SKU ya está en uso. Usa 'Auto-generar' para obtener uno nuevo.");
          toast.error("SKU duplicado - genera uno nuevo");
        } else {
          setError(message);
          toast.error(message);
        }
      } finally {
        setSaving(false);
      }
    },
    [product, formState, onProductUpdated, onClose, resolveImagePath, selectedFile]
  );

  const handleFieldChange = useCallback(<K extends keyof FormState,>(field: K, value: FormState[K]) => {
    setFormState((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleRecipeYieldChange = useCallback((value: string) => {
    setFormState((prev) => {
      if (!prev) return prev;
      return { ...prev, recipeYields: value };
    });
  }, []);

  const handleAddIngredient = useCallback(() => {
    setFormState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recipeIngredients: [
          ...prev.recipeIngredients,
          { productId: "", supplyId: "", quantity: 1, unit: "und" }
        ],
      };
    });
  }, []);

  const handleRemoveIngredient = useCallback((index: number) => {
    setFormState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recipeIngredients: prev.recipeIngredients.filter((_, idx) => idx !== index),
      };
    });
  }, []);

  const handleIngredientChange = useCallback(
    (index: number, field: "productId" | "supplyId" | "quantity" | "unit", value: string) => {
      setFormState((prev) => {
        if (!prev) return prev;
        if (!prev.recipeIngredients[index]) return prev;
        const nextIngredients = [...prev.recipeIngredients];
        const current = nextIngredients[index];
        const nextValue =
          field === "quantity" ? (Number.isFinite(Number(value)) ? Number(value) : 0) : value;
        nextIngredients[index] = { ...current, [field]: nextValue };
        return { ...prev, recipeIngredients: nextIngredients };
      });
    },
    [],
  );

  const handleIngredientTypeChange = useCallback((index: number, type: "product" | "supply") => {
    setFormState((prev) => {
      if (!prev) return prev;
      if (!prev.recipeIngredients[index]) return prev;
      const nextIngredients = [...prev.recipeIngredients];
      const current = nextIngredients[index];
      nextIngredients[index] = {
        ...current,
        productId: type === "product" ? current.productId ?? "" : "",
        supplyId: type === "supply" ? current.supplyId ?? "" : "",
      };
      return { ...prev, recipeIngredients: nextIngredients };
    });
    setIngredientSearch((prev) => ({ ...prev, [index]: "" }));
    setActiveIngredientDropdown(index);
  }, []);

  const handleIngredientSelect = useCallback(
    (index: number, type: "product" | "supply", selectedId: string, selectedLabel: string) => {
      setFormState((prev) => {
        if (!prev) return prev;
        if (!prev.recipeIngredients[index]) return prev;
        const nextIngredients = [...prev.recipeIngredients];
        const current = nextIngredients[index];
        nextIngredients[index] = {
          ...current,
          productId: type === "product" ? selectedId : "",
          supplyId: type === "supply" ? selectedId : "",
        };
        return { ...prev, recipeIngredients: nextIngredients };
      });
      setIngredientSearch((prev) => ({ ...prev, [index]: selectedLabel }));
      setActiveIngredientDropdown(null);
    },
    [],
  );

  const getIngredientMatches = useCallback(
    (index: number, ingredient: FormState["recipeIngredients"][number]) => {
      const currentType: "product" | "supply" = ingredient.supplyId ? "supply" : "product";
      const search = normalizeCatalogSearch(ingredientSearch[index] ?? "");
      const limit = 8;

      if (currentType === "product") {
        const options = availableProducts.map((item) => {
          const productId = item.sku ?? item.id;
          const name = item.name.es || item.name.en || productId;
          const unitFields = resolveUnitFields(item.unit);
          const unit = unitFields.es || unitFields.en || "";
          const label = `${productId} - ${name}${unit ? ` (${unit})` : ""}`;
          const haystack = normalizeCatalogSearch(`${productId} ${item.id} ${item.slug} ${name} ${unit}`);
          return { id: productId, label, haystack, type: "product" as const };
        });
        return (search ? options.filter((item) => item.haystack.includes(search)) : options).slice(0, limit);
      }

      const options = availableSupplies.map((item) => {
        const label = `${item.id} - ${item.name}`;
        const haystack = `${item.id} ${item.name}`.toLowerCase();
        return { id: item.id, label, haystack, type: "supply" as const };
      });
      return (search ? options.filter((item) => item.haystack.includes(search)) : options).slice(0, limit);
    },
    [availableProducts, availableSupplies, ingredientSearch],
  );

  const handleAddSupply = useCallback(() => {
    if (!formState) return;
    if (!selectedSupplyId) {
      setError("Selecciona un insumo.");
      return;
    }

    const quantity = Number(addQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Cantidad inválida.");
      return;
    }

    const supply = availableSupplies.find((item) => item.id === selectedSupplyId);
    if (!supply) {
      setError("Insumo no encontrado.");
      return;
    }

    setFormState((prev) => {
      if (!prev) return prev;
      const existingIndex = prev.suppliesRecipe.findIndex((item) => item.supplyId === supply.id);
      const nextRecipe =
        existingIndex >= 0
          ? prev.suppliesRecipe.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...prev.suppliesRecipe, { supplyId: supply.id, name: supply.name, quantity }];
      return { ...prev, suppliesRecipe: nextRecipe };
    });

    setAddQuantity("1");
    setError(null);
  }, [addQuantity, availableSupplies, formState, selectedSupplyId]);

  const handleRemoveSupply = useCallback((supplyId: string) => {
    setFormState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suppliesRecipe: prev.suppliesRecipe.filter((item) => item.supplyId !== supplyId),
      };
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!product) return;
    const confirmed = window.confirm(`Eliminar el producto "${product.name?.es ?? product.id}"?`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/catalog/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo eliminar el producto");
      }

      toast.success("Producto eliminado");
      onProductDeleted(product.id);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [product, onClose, onProductDeleted]);

  const requestRecipePurchasePriceUpdate = useCallback(
    (ingredientIndex: number, sourceProduct: Product, draftValue: string) => {
      const parsed = Number(draftValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error("Ingresa un costo de compra valido.");
        return;
      }

      const currentWholesaleCost =
        typeof sourceProduct.metadata?.wholesaleCost === "number" &&
        Number.isFinite(sourceProduct.metadata.wholesaleCost)
          ? sourceProduct.metadata.wholesaleCost
          : null;

      setPendingRecipePurchaseUpdate({
        ingredientIndex,
        product: sourceProduct,
        nextWholesaleCost: parsed,
        currentWholesaleCost,
      });
    },
    [],
  );

  const confirmRecipePurchasePriceUpdate = useCallback(async () => {
    if (!pendingRecipePurchaseUpdate) return;

    setSavingRecipePurchaseUpdate(true);
    setError(null);

    try {
      const updatedProduct = await persistSourceProductPricing(pendingRecipePurchaseUpdate.product, {
        wholesaleCost: pendingRecipePurchaseUpdate.nextWholesaleCost,
      });

      setAvailableProducts((current) => replaceCatalogProduct(current, updatedProduct));
      setRecipePurchasePriceDrafts((current) => {
        const next = { ...current };
        delete next[pendingRecipePurchaseUpdate.ingredientIndex];
        return next;
      });
      setPendingRecipePurchaseUpdate(null);
      toast.success(`Costo de compra actualizado en ${updatedProduct.name.es || updatedProduct.sku || updatedProduct.id}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el costo de compra.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingRecipePurchaseUpdate(false);
    }
  }, [pendingRecipePurchaseUpdate]);

  const requestRecipeSalePriceUpdate = useCallback(
    (ingredientIndex: number, sourceProduct: Product, draftValue: string) => {
      const parsed = Number(draftValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error("Ingresa un precio de venta valido.");
        return;
      }

      setPendingRecipeSaleUpdate({
        ingredientIndex,
        product: sourceProduct,
        nextSalePrice: parsed,
        currentSalePrice: Number.isFinite(Number(sourceProduct.salePrice ?? sourceProduct.price))
          ? Number(sourceProduct.salePrice ?? sourceProduct.price)
          : null,
        sourceLabel: getEffectiveSaleSourceLabel(sourceProduct),
      });
    },
    [],
  );

  const confirmRecipeSalePriceUpdate = useCallback(async () => {
    if (!pendingRecipeSaleUpdate) return;

    setSavingRecipeSaleUpdate(true);
    setError(null);

    try {
      const updatedProduct = await persistSourceProductEffectiveSalePrice(
        pendingRecipeSaleUpdate.product,
        pendingRecipeSaleUpdate.nextSalePrice,
      );

      setAvailableProducts((current) => replaceCatalogProduct(current, updatedProduct));
      setRecipeSalePriceDrafts((current) => {
        const next = { ...current };
        delete next[pendingRecipeSaleUpdate.ingredientIndex];
        return next;
      });
      setPendingRecipeSaleUpdate(null);
      toast.success(`Precio de venta actualizado en ${updatedProduct.name.es || updatedProduct.sku || updatedProduct.id}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el precio de venta.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingRecipeSaleUpdate(false);
    }
  }, [pendingRecipeSaleUpdate]);

  if (!isOpen || !product || !formState) return null;

  const imageUrl = formState.sku
    ? resolveImagePath(formState.sku, product.image)
    : resolveImagePath(product.id, product.image);
  const previewImageUrl = previewUrl ?? imageUrl;
  const parsedDraftSalePrice = Number(formState.salePriceAmount || formState.priceAmount);
  const draftSalePrice = Number.isFinite(parsedDraftSalePrice) && parsedDraftSalePrice >= 0 ? parsedDraftSalePrice : null;
  const parsedRecipeYields = Number(formState.recipeYields);
  const recipeYields = Number.isFinite(parsedRecipeYields) && parsedRecipeYields > 0 ? parsedRecipeYields : 1;
  const recipeLinePricing = formState.recipeIngredients.map((ingredient) => {
    const matchedProduct = ingredient.productId
      ? availableProductLookup.get(normalizeCatalogSearch(ingredient.productId)) ?? null
      : null;

    return {
      ingredient,
      matchedProduct,
      pricing: computeCatalogLinePricing(ingredient.quantity, matchedProduct),
    };
  });
  const recipePricingAggregate = aggregateCatalogLinePricing(recipeLinePricing.map((item) => item.pricing));
  const externalSupplyCount = formState.recipeIngredients.filter((ingredient) => Boolean(ingredient.supplyId)).length;
  const recipeRevenueTotal = draftSalePrice === null ? null : draftSalePrice * recipeYields;
  const recipeProfitTotal =
    recipeRevenueTotal === null || recipePricingAggregate.missingPurchaseCount > 0 || externalSupplyCount > 0
      ? null
      : recipeRevenueTotal - recipePricingAggregate.costTotal;
  const recipeMarginTotal = computeMarginPercent(recipeProfitTotal, recipeRevenueTotal);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[9999] h-full w-full max-w-2xl bg-[var(--gd-color-beige)] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="glass-panel border-b border-white/40 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md">
                  <ProductImageFallback product={product} image={previewImageUrl} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--gd-color-forest)]">{formState.nameEs}</h2>
                  <p className="text-xs text-[var(--gd-color-text-muted)] font-mono">{formState.sku || product.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6 text-[var(--gd-color-text-muted)]" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="glass-panel rounded-2xl p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="glass-panel rounded-2xl p-4 bg-[var(--gd-color-leaf)]/20 border border-[var(--gd-color-leaf)]/40 text-[var(--gd-color-forest)] text-sm">
                  {message}
                </div>
              )}

              <div className="flex gap-2">
                {[
                  { id: "basic", label: "Básico" },
                  { id: "logistics", label: "Logística/Stock" },
                  { id: "nutrition", label: "Nutrición" },
                  { id: "supplies", label: "Insumos" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id as "basic" | "logistics" | "nutrition" | "supplies")
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      activeTab === tab.id
                        ? "bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] border border-[var(--gd-color-leaf)]/40"
                        : "text-[var(--gd-color-text-muted)] border border-white/60 bg-white/40 hover:text-[var(--gd-color-forest)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "basic" && (
                <>
                  {/* SKU - Primary Key */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-[var(--gd-color-text-muted)]">
                        SKU (Identificador único) *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formState.sku || ""}
                          onChange={(e) => handleFieldChange("sku", e.target.value)}
                          placeholder="GD-VEGE-068"
                          required
                          className="flex-1 px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!formState.categoryId) {
                              toast.error("Selecciona una categoría primero");
                              return;
                            }
                            try {
                              const { generateNextSKU } = await import("@/lib/utils/generate-sku");
                              const nextSKU = await generateNextSKU(formState.categoryId);
                              handleFieldChange("sku", nextSKU);
                              toast.success(`SKU generado: ${nextSKU}`);
                            } catch (error) {
                              console.error("Error generating SKU:", error);
                              toast.error("Error al generar SKU");
                            }
                          }}
                          disabled={!formState.categoryId}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Auto-generar
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        El SKU se usará como ID del producto. Ej: GD-VEGE-068
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--gd-color-text-muted)]">
                      La imagen se cargará desde: /assets/images/products/{formState.sku || product.id}.png
                    </p>
                  </div>

                  {/* Imagen del producto */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">
                      Imagen del Producto
                    </label>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm">
                        <ProductImageFallback
                          product={product}
                          image={previewImageUrl}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-[var(--gd-color-text-muted)]">
                          Vista previa actual: {imageUrl}
                        </p>
                        <label className="inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold text-[var(--gd-color-forest)] shadow-sm transition hover:bg-white">
                          <Upload className="h-4 w-4" />
                          Subir nueva foto
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              if (previewUrl) URL.revokeObjectURL(previewUrl);
                              setSelectedFile(file);
                              setPreviewUrl(file ? URL.createObjectURL(file) : null);
                            }}
                          />
                        </label>
                        {selectedFile && (
                          <p className="text-xs text-[var(--gd-color-text-muted)]">
                            Archivo seleccionado: {selectedFile.name}
                          </p>
                        )}
                        <p className="text-[0.7rem] text-[var(--gd-color-text-muted)]">
                          Formatos permitidos: JPG, PNG, WEBP. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nombres */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Nombres</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Nombre (ES) *
                        </label>
                        <input
                          type="text"
                          value={formState.nameEs}
                          onChange={(e) => setFormState({ ...formState, nameEs: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Nombre (EN) *
                        </label>
                        <input
                          type="text"
                          value={formState.nameEn}
                          onChange={(e) => setFormState({ ...formState, nameEn: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Precios */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Precios</label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Precio de Venta Regular (DOP) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formState.priceAmount}
                          onChange={(e) => setFormState({ ...formState, priceAmount: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Precio de Venta Promocional (DOP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formState.salePriceAmount}
                          onChange={(e) => setFormState({ ...formState, salePriceAmount: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Precio de Compra / Costo Unitario
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formState.wholesaleCost}
                          onChange={(e) => setFormState({ ...formState, wholesaleCost: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="mb-2 text-[0.7rem] text-[var(--gd-color-text-muted)]">
                        Esta es la fuente de verdad de precios. Cajas, combos y recetas solo muestran y calculan estos valores.
                      </p>
                      <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                        Texto de Unidad (ej: porción, 16oz)
                      </label>
                      <input
                        type="text"
                        value={formState.unitEs}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            unitEs: e.target.value,
                            unitEn: e.target.value,
                          })
                        }
                        placeholder="Ej: porción, 500ml, 1kg..."
                        className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                      />
                    </div>
                  </div>

                  {/* Estado y Categoría */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">Estado</label>
                        <select
                          value={formState.status}
                          onChange={(e) => setFormState({ ...formState, status: e.target.value as Product["status"] })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status === "active"
                                ? "Activo"
                                : status === "inactive"
                                  ? "Inactivo"
                                  : status === "coming_soon"
                                    ? "Próximamente"
                                    : "Descontinuado"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">Categoría</label>
                        <select
                          value={formState.categoryId}
                          onChange={(e) => setFormState({ ...formState, categoryId: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name.es}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                        Tipo de Producto
                      </label>
                      <select
                        value={formState.type || "simple"}
                        onChange={(e) => {
                          const nextType = e.target.value as ProductType;
                          setFormState((prev) => {
                            if (!prev) return prev;
                            if (nextType === "prepared") {
                              return { ...prev, type: nextType };
                            }
                            return {
                              ...prev,
                              type: nextType,
                              recipeYields: "1",
                              recipeIngredients: [],
                            };
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                      >
                        <option value="simple">Simple (producto individual)</option>
                        <option value="box">Caja (con variantes)</option>
                        {formState.type === "salad" && <option value="salad">Ensalada (legacy)</option>}
                        <option value="prepared">Preparado (requiere receta)</option>
                      </select>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formState.isFeatured}
                          onChange={(e) => setFormState({ ...formState, isFeatured: e.target.checked })}
                          className="rounded border-white/60 text-[var(--gd-color-leaf)] focus:ring-[var(--gd-color-leaf)]"
                        />
                        <span className="text-sm text-[var(--gd-color-text-muted)]">Producto destacado</span>
                      </label>
                    </div>
                  </div>

                  {formState.type === "prepared" && (
                    <div className="space-y-4 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Receta (Ingredientes Necesarios)
                      </h3>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Porciones que produce
                        </label>
                        <input
                          type="number"
                          value={formState.recipeYields || 1}
                          onChange={(e) => handleRecipeYieldChange(e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                          min="1"
                          step="1"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Ingredientes</label>
                        <p className="text-xs text-gray-500">
                          Los precios de compra y venta se editan solo en Productos individuales. En la receta solo se
                          muestran para calcular costo y margen.
                        </p>

                        {(formState.recipeIngredients || []).map((ingredient, index) => {
                          const currentType: "product" | "supply" = ingredient.supplyId ? "supply" : "product";
                          const matches = getIngredientMatches(index, ingredient);
                          const selectedValue = ingredient.productId || ingredient.supplyId || "";
                          const inputValue = ingredientSearch[index] ?? selectedValue;
                          const linePricing = recipeLinePricing[index];
                          const matchedProduct = linePricing?.matchedProduct ?? null;
                          const pricing = linePricing?.pricing ?? computeCatalogLinePricing(ingredient.quantity, null);
                          const purchasePriceDraft = recipePurchasePriceDrafts[index];
                          const purchaseInputValue =
                            purchasePriceDraft ??
                            (pricing.purchaseUnitPrice !== null ? String(pricing.purchaseUnitPrice) : "");
                          const parsedDraftPurchasePrice = Number(purchaseInputValue);
                          const hasValidPurchasePriceDraft =
                            purchaseInputValue.trim() !== "" &&
                            Number.isFinite(parsedDraftPurchasePrice) &&
                            parsedDraftPurchasePrice >= 0;
                          const purchasePriceChanged =
                            currentType === "product" &&
                            matchedProduct &&
                            hasValidPurchasePriceDraft &&
                            parsedDraftPurchasePrice !== pricing.purchaseUnitPrice;
                          const salePriceDraft = recipeSalePriceDrafts[index];
                          const saleInputValue =
                            salePriceDraft ?? (pricing.saleUnitPrice !== null ? String(pricing.saleUnitPrice) : "");
                          const parsedDraftSalePrice = Number(saleInputValue);
                          const hasValidSalePriceDraft =
                            saleInputValue.trim() !== "" &&
                            Number.isFinite(parsedDraftSalePrice) &&
                            parsedDraftSalePrice >= 0;
                          const salePriceChanged =
                            currentType === "product" &&
                            matchedProduct &&
                            hasValidSalePriceDraft &&
                            parsedDraftSalePrice !== pricing.saleUnitPrice;

                          return (
                            <div key={`ingredient-${index}`} className="space-y-3 rounded-xl border border-amber-200 bg-white/70 p-3">
                              <div className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-12 md:col-span-5">
                                  <label className="text-xs text-gray-500">Tipo / ID</label>
                                  <div className="flex gap-2">
                                    <select
                                      value={currentType}
                                      onChange={(e) => {
                                        handleIngredientTypeChange(index, e.target.value as "product" | "supply");
                                      }}
                                      className="w-28 px-2 py-2 border border-gray-300 rounded-lg text-xs"
                                    >
                                      <option value="product">Producto</option>
                                      <option value="supply">Insumo</option>
                                    </select>
                                    <div className="relative flex-1">
                                      <input
                                        type="text"
                                        value={inputValue}
                                        placeholder={currentType === "product" ? "Buscar producto (SKU o nombre)" : "Buscar insumo (ID o nombre)"}
                                        onFocus={() => setActiveIngredientDropdown(index)}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setIngredientSearch((prev) => ({ ...prev, [index]: value }));
                                          setActiveIngredientDropdown(index);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      />
                                      {activeIngredientDropdown === index && matches.length > 0 && (
                                        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                          {matches.map((match) => (
                                            <button
                                              key={`${match.type}-${match.id}`}
                                              type="button"
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() =>
                                                handleIngredientSelect(index, match.type, match.id, match.label)
                                              }
                                              className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                                            >
                                              {match.label}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-span-6 md:col-span-3">
                                  <label className="text-xs text-gray-500">Cantidad</label>
                                  <input
                                    type="number"
                                    value={ingredient.quantity}
                                    step="0.1"
                                    onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </div>

                                <div className="col-span-5 md:col-span-3">
                                  <label className="text-xs text-gray-500">Unidad</label>
                                  <select
                                    value={ingredient.unit}
                                    onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  >
                                    <option value="kg">kg</option>
                                    <option value="und">und</option>
                                    <option value="lb">lb</option>
                                    <option value="g">g</option>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                  </select>
                                </div>

                                <div className="col-span-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
                                  <div className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
                                    Compra c/u
                                  </div>
                                  {currentType === "product" && matchedProduct ? (
                                    <>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={purchaseInputValue}
                                        onChange={(event) =>
                                          setRecipePurchasePriceDrafts((current) => ({
                                            ...current,
                                            [index]: event.target.value,
                                          }))
                                        }
                                        placeholder="Costo fuente"
                                        className="mt-2 w-full rounded-lg border border-white/70 bg-white px-3 py-2 text-sm font-semibold text-[var(--gd-color-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                      />
                                      <div className="mt-2 flex items-center justify-between gap-2">
                                        <span className="text-[0.7rem] text-[var(--gd-color-text-muted)]">
                                          Guarda en el producto fuente
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            requestRecipePurchasePriceUpdate(index, matchedProduct, purchaseInputValue)
                                          }
                                          disabled={!purchasePriceChanged}
                                          className="rounded-lg border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-leaf)]/10 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/20 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          Aplicar
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">
                                        {formatCatalogCurrency(pricing.purchaseUnitPrice)}
                                      </div>
                                      <div className="mt-1 text-[0.7rem] text-[var(--gd-color-text-muted)]">
                                        {currentType === "supply"
                                          ? "Los insumos no usan precios de productos"
                                          : "Selecciona un producto"}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
                                  <div className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
                                    Venta ref. c/u
                                  </div>
                                  {currentType === "product" && matchedProduct ? (
                                    <>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={saleInputValue}
                                        onChange={(event) =>
                                          setRecipeSalePriceDrafts((current) => ({
                                            ...current,
                                            [index]: event.target.value,
                                          }))
                                        }
                                        placeholder="Venta fuente"
                                        className="mt-2 w-full rounded-lg border border-white/70 bg-white px-3 py-2 text-sm font-semibold text-[var(--gd-color-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                      />
                                      <div className="mt-2 flex items-center justify-between gap-2">
                                        <span className="text-[0.7rem] text-[var(--gd-color-text-muted)]">
                                          Guarda en el producto fuente
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            requestRecipeSalePriceUpdate(index, matchedProduct, saleInputValue)
                                          }
                                          disabled={!salePriceChanged}
                                          className="rounded-lg border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-leaf)]/10 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/20 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          Aplicar
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">
                                        {formatCatalogCurrency(pricing.saleUnitPrice)}
                                      </div>
                                      <div className="mt-1 text-[0.7rem] text-[var(--gd-color-text-muted)]">
                                        {currentType === "supply" ? "No aplica a insumos" : "Selecciona un producto"}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <PriceMetricCard
                                  label="Costo línea"
                                  value={formatCatalogCurrency(pricing.costTotal)}
                                  hint={`${pricing.quantity || 0} unidades`}
                                />
                                <PriceMetricCard
                                  label="Venta ref. línea"
                                  value={formatCatalogCurrency(pricing.saleTotal)}
                                  hint={currentType === "supply" ? "Solo para productos" : "Suma referencial del catálogo"}
                                />
                                <PriceMetricCard
                                  label="Margen ref. línea"
                                  value={formatCatalogCurrency(pricing.marginTotal)}
                                  hint={matchedProduct ? "Venta referencial menos costo" : "Selecciona un producto"}
                                />
                              </div>
                            </div>
                          );
                        })}

                        <div className="rounded-xl border border-amber-200 bg-white/80 p-3">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700">
                            Resumen de receta
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                            <PriceMetricCard
                              label="Venta producto"
                              value={formatCatalogCurrency(draftSalePrice)}
                              hint="Sale price o regular"
                            />
                            <PriceMetricCard
                              label="Venta lote"
                              value={formatCatalogCurrency(recipeRevenueTotal)}
                              hint={`${recipeYields} porciones`}
                            />
                            <PriceMetricCard
                              label="Costo receta"
                              value={formatCatalogCurrency(recipePricingAggregate.costTotal)}
                              hint={recipePricingAggregate.missingPurchaseCount > 0 ? "Parcial" : "Completo"}
                            />
                            <PriceMetricCard
                              label="Ganancia lote"
                              value={formatCatalogCurrency(recipeProfitTotal)}
                              hint={
                                externalSupplyCount > 0
                                  ? `Hay ${externalSupplyCount} insumos fuera de catalog_products`
                                  : recipePricingAggregate.missingPurchaseCount > 0
                                    ? `Faltan ${recipePricingAggregate.missingPurchaseCount} costos`
                                    : "Venta lote menos costo receta"
                              }
                            />
                            <PriceMetricCard
                              label="Margen lote"
                              value={formatCatalogPercent(recipeMarginTotal)}
                              hint={
                                recipeProfitTotal === null
                                  ? "Completa costos para cerrar margen real"
                                  : "Sobre la venta estimada del lote"
                              }
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddIngredient}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar Ingrediente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Descripciones */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Descripciones</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Descripción / Detalles
                        </label>
                        <textarea
                          value={formState.descriptionEs}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              descriptionEs: e.target.value,
                              descriptionEn: e.target.value,
                            })
                          }
                          rows={4}
                          placeholder="Escribe aquí los detalles que aparecerán al girar la tarjeta..."
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Descripción (ES)
                        </label>
                        <textarea
                          value={formState.descriptionEs}
                          onChange={(e) => setFormState({ ...formState, descriptionEs: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Descripción (EN)
                        </label>
                        <textarea
                          value={formState.descriptionEn}
                          onChange={(e) => setFormState({ ...formState, descriptionEn: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-2">Tags</label>
                    <input
                      type="text"
                      value={formState.tags}
                      onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                      placeholder="frutas, fresco, orgánico (separados por comas)"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                    />
                  </div>
                </>
              )}

              {activeTab === "logistics" && (
                <>
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Unidades</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Unidad (ES)
                        </label>
                        <input
                          type="text"
                          value={formState.unitEs}
                          onChange={(e) => setFormState({ ...formState, unitEs: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Unidad (EN)
                        </label>
                        <input
                          type="text"
                          value={formState.unitEn}
                          onChange={(e) => setFormState({ ...formState, unitEn: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Inventario</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Stock actual
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formState.stock}
                          onChange={(e) => setFormState({ ...formState, stock: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Stock minimo
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formState.minStock}
                          onChange={(e) => setFormState({ ...formState, minStock: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Costos internos</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Espacio en caja
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formState.slotValue}
                          onChange={(e) => setFormState({ ...formState, slotValue: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                        <p className="mt-1 text-[0.7rem] text-[var(--gd-color-text-muted)]">
                          Dato interno para cajas. Indica cuánto espacio lógico ocupa este producto. No es un precio.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Peso y dimensiones</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formState.weightKg}
                          onChange={(e) => setFormState({ ...formState, weightKg: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formState.dimensionLength}
                          onChange={(e) => setFormState({ ...formState, dimensionLength: e.target.value })}
                          placeholder="Largo cm"
                          className="w-full px-3 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formState.dimensionWidth}
                          onChange={(e) => setFormState({ ...formState, dimensionWidth: e.target.value })}
                          placeholder="Ancho cm"
                          className="w-full px-3 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formState.dimensionHeight}
                          onChange={(e) => setFormState({ ...formState, dimensionHeight: e.target.value })}
                          placeholder="Alto cm"
                          className="w-full px-3 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Almacenamiento</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Nota (ES)
                        </label>
                        <input
                          type="text"
                          value={formState.storageEs}
                          onChange={(e) => setFormState({ ...formState, storageEs: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Nota (EN)
                        </label>
                        <input
                          type="text"
                          value={formState.storageEn}
                          onChange={(e) => setFormState({ ...formState, storageEn: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "nutrition" && (
                <>
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Etiquetas</label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                        <input
                          type="checkbox"
                          checked={formState.vegan}
                          onChange={(e) => setFormState({ ...formState, vegan: e.target.checked })}
                          className="rounded border-white/60 text-[var(--gd-color-leaf)] focus:ring-[var(--gd-color-leaf)]"
                        />
                        Vegano
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                        <input
                          type="checkbox"
                          checked={formState.glutenFree}
                          onChange={(e) => setFormState({ ...formState, glutenFree: e.target.checked })}
                          className="rounded border-white/60 text-[var(--gd-color-leaf)] focus:ring-[var(--gd-color-leaf)]"
                        />
                        Libre de gluten
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                        <input
                          type="checkbox"
                          checked={formState.organic}
                          onChange={(e) => setFormState({ ...formState, organic: e.target.checked })}
                          className="rounded border-white/60 text-[var(--gd-color-leaf)] focus:ring-[var(--gd-color-leaf)]"
                        />
                        Orgánico
                      </label>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Valores nutricionales</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          { key: "calories", label: "Calorías" },
                          { key: "protein", label: "Proteínas" },
                          { key: "carbs", label: "Carbohidratos" },
                          { key: "fats", label: "Grasas" },
                          { key: "fiber", label: "Fibra" },
                          { key: "sugars", label: "Azúcares" },
                        ] as const
                      ).map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                            {field.label}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={formState[field.key]}
                            onChange={(e) =>
                              setFormState({ ...formState, [field.key]: e.target.value })
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-1">
                      Detalles Frontend (desde Nutrición)
                    </label>
                    <p className="mb-3 text-xs text-[var(--gd-color-text-muted)]">
                      Todo lo que completes aquí se usa en el panel de &quot;Ver detalles&quot; del frontend para jugos.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Texto descriptivo (ES)
                        </label>
                        <textarea
                          value={formState.nutritionDescriptionEs}
                          onChange={(e) => setFormState({ ...formState, nutritionDescriptionEs: e.target.value })}
                          rows={3}
                          placeholder="Ej: Bebida hidratante con alto contenido de fruta fresca..."
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Descriptive text (EN)
                        </label>
                        <textarea
                          value={formState.nutritionDescriptionEn}
                          onChange={(e) => setFormState({ ...formState, nutritionDescriptionEn: e.target.value })}
                          rows={3}
                          placeholder="Ex: Hydrating drink with fresh fruit content..."
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Ingredientes (1 por línea)
                        </label>
                        <textarea
                          value={formState.nutritionIngredients}
                          onChange={(e) => setFormState({ ...formState, nutritionIngredients: e.target.value })}
                          rows={5}
                          placeholder={"Sandía\nMenta\nLimón"}
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Beneficios (1 por línea)
                        </label>
                        <textarea
                          value={formState.nutritionBenefits}
                          onChange={(e) => setFormState({ ...formState, nutritionBenefits: e.target.value })}
                          rows={5}
                          placeholder={"Alto en hidratación\nRico en vitamina C"}
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Perfecto para (ES)
                        </label>
                        <textarea
                          value={formState.nutritionPerfectForEs}
                          onChange={(e) => setFormState({ ...formState, nutritionPerfectForEs: e.target.value })}
                          rows={2}
                          placeholder="Ej: Recuperación post-entrenamiento y desayuno ligero."
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Perfect for (EN)
                        </label>
                        <textarea
                          value={formState.nutritionPerfectForEn}
                          onChange={(e) => setFormState({ ...formState, nutritionPerfectForEn: e.target.value })}
                          rows={2}
                          placeholder="Ex: Post-workout recovery and light breakfast."
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Nota breve (ES)
                        </label>
                        <textarea
                          value={formState.nutritionNoteEs}
                          onChange={(e) => setFormState({ ...formState, nutritionNoteEs: e.target.value })}
                          rows={2}
                          placeholder="Ej: Mejor servido frío."
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Quick note (EN)
                        </label>
                        <textarea
                          value={formState.nutritionNoteEn}
                          onChange={(e) => setFormState({ ...formState, nutritionNoteEn: e.target.value })}
                          rows={2}
                          placeholder="Ex: Best served chilled."
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-1">
                      Presentacion comercial
                    </label>
                    <p className="mb-3 text-xs text-[var(--gd-color-text-muted)]">
                      Estos campos alimentan tarjetas y vistas de detalle de ensaladas, dips y preparados. Ya no deben
                      depender de claves sueltas en metadata.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Beneficio principal (ES)
                        </label>
                        <textarea
                          value={formState.presentationBenefitEs}
                          onChange={(e) => setFormState({ ...formState, presentationBenefitEs: e.target.value })}
                          rows={2}
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Main benefit (EN)
                        </label>
                        <textarea
                          value={formState.presentationBenefitEn}
                          onChange={(e) => setFormState({ ...formState, presentationBenefitEn: e.target.value })}
                          rows={2}
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Detalle del beneficio (ES)
                        </label>
                        <textarea
                          value={formState.presentationBenefitDetailEs}
                          onChange={(e) =>
                            setFormState({ ...formState, presentationBenefitDetailEs: e.target.value })
                          }
                          rows={3}
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Benefit detail (EN)
                        </label>
                        <textarea
                          value={formState.presentationBenefitDetailEn}
                          onChange={(e) =>
                            setFormState({ ...formState, presentationBenefitDetailEn: e.target.value })
                          }
                          rows={3}
                          className="w-full resize-y px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Vitamina A
                        </label>
                        <input
                          type="text"
                          value={formState.vitaminA}
                          onChange={(e) => setFormState({ ...formState, vitaminA: e.target.value })}
                          placeholder="Ej: 25%"
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Vitamina C
                        </label>
                        <input
                          type="text"
                          value={formState.vitaminC}
                          onChange={(e) => setFormState({ ...formState, vitaminC: e.target.value })}
                          placeholder="Ej: 40%"
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "supplies" && (
                <div className="space-y-4">
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">
                      Receta de insumos
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Insumo
                        </label>
                        <select
                          value={selectedSupplyId}
                          onChange={(e) => setSelectedSupplyId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        >
                          <option value="">Seleccionar insumo</option>
                          {availableSupplies.map((supply) => (
                            <option key={supply.id} value={supply.id}>
                              {supply.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSupply}
                        disabled={recipeSourcesLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--gd-color-leaf)]/40 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--gd-color-forest)] shadow-sm transition hover:bg-white disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar
                      </button>
                    </div>
                    {recipeSourcesLoading && (
                      <p className="mt-2 text-xs text-[var(--gd-color-text-muted)]">Cargando insumos...</p>
                    )}
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    {formState.suppliesRecipe.length === 0 ? (
                      <p className="text-sm text-[var(--gd-color-text-muted)]">
                        No hay insumos agregados todavía.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/40">
                        <table className="w-full text-sm">
                          <thead className="bg-white/60 border-b border-white/60">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-[var(--gd-color-forest)]">Insumo</th>
                              <th className="px-4 py-3 text-left font-semibold text-[var(--gd-color-forest)]">Cantidad</th>
                              <th className="px-4 py-3 text-right font-semibold text-[var(--gd-color-forest)]">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/40">
                            {formState.suppliesRecipe.map((item) => (
                              <tr key={item.supplyId}>
                                <td className="px-4 py-3 text-[var(--gd-color-forest)]">{item.name}</td>
                                <td className="px-4 py-3 text-[var(--gd-color-text-muted)]">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSupply(item.supplyId)}
                                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Quitar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/40 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm text-[var(--gd-color-text-muted)] font-medium text-sm hover:bg-white/70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Eliminando..." : "Eliminar producto"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 rounded-xl bg-[var(--gd-color-leaf)] text-white font-medium text-sm hover:bg-[var(--gd-color-forest)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {pendingRecipePurchaseUpdate && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 px-4">
              <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-[var(--gd-color-beige)] p-6 shadow-2xl">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">
                    Actualizar costo de compra
                  </h3>
                  <p className="mt-1 text-sm text-[var(--gd-color-text-muted)]">
                    Este cambio se guardara en el producto general{" "}
                    <span className="font-semibold text-[var(--gd-color-forest)]">
                      {pendingRecipePurchaseUpdate.product.name.es || pendingRecipePurchaseUpdate.product.sku || pendingRecipePurchaseUpdate.product.id}
                    </span>{" "}
                    y se reflejara en recetas, cajas, combos y calculos donde se use.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PriceMetricCard
                    label="Costo actual"
                    value={formatCatalogCurrency(pendingRecipePurchaseUpdate.currentWholesaleCost)}
                    hint="Valor fuente actual"
                  />
                  <PriceMetricCard
                    label="Nuevo costo"
                    value={formatCatalogCurrency(pendingRecipePurchaseUpdate.nextWholesaleCost)}
                    hint="Se guardara en catalogo"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingRecipePurchaseUpdate(null)}
                    disabled={savingRecipePurchaseUpdate}
                    className="rounded-xl border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-[var(--gd-color-text-muted)] transition hover:bg-white disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmRecipePurchasePriceUpdate}
                    disabled={savingRecipePurchaseUpdate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-color-leaf)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--gd-color-leaf-dark)] disabled:opacity-60"
                  >
                    {savingRecipePurchaseUpdate ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Guardar en producto fuente
                  </button>
                </div>
              </div>
            </div>
          )}

          {pendingRecipeSaleUpdate && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 px-4">
              <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-[var(--gd-color-beige)] p-6 shadow-2xl">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">
                    Actualizar precio de venta
                  </h3>
                  <p className="mt-1 text-sm text-[var(--gd-color-text-muted)]">
                    Este cambio se guardara en el producto general{" "}
                    <span className="font-semibold text-[var(--gd-color-forest)]">
                      {pendingRecipeSaleUpdate.product.name.es || pendingRecipeSaleUpdate.product.sku || pendingRecipeSaleUpdate.product.id}
                    </span>{" "}
                    como <span className="font-semibold text-[var(--gd-color-forest)]">{pendingRecipeSaleUpdate.sourceLabel}</span> y se reflejara en recetas, cajas, combos y calculos donde se use.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PriceMetricCard
                    label="Venta actual"
                    value={formatCatalogCurrency(pendingRecipeSaleUpdate.currentSalePrice)}
                    hint="Valor fuente actual"
                  />
                  <PriceMetricCard
                    label="Nueva venta"
                    value={formatCatalogCurrency(pendingRecipeSaleUpdate.nextSalePrice)}
                    hint="Se guardara en catalogo"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingRecipeSaleUpdate(null)}
                    disabled={savingRecipeSaleUpdate}
                    className="rounded-xl border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-[var(--gd-color-text-muted)] transition hover:bg-white disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmRecipeSalePriceUpdate}
                    disabled={savingRecipeSaleUpdate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-color-leaf)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--gd-color-leaf-dark)] disabled:opacity-60"
                  >
                    {savingRecipeSaleUpdate ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Guardar en producto fuente
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
