"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, AlertTriangle, CheckCircle2, Upload, Plus, Trash2, SquareArrowOutUpRight } from "lucide-react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

import { adminFetch } from "@/modules/admin/api/client";
import type { Box, Product } from "@/modules/catalog/types";
import {
  buildCanonicalProductLookup,
  dedupeCatalogProducts,
  getCatalogDuplicateKey,
  normalizeCatalogSearch,
} from "@/modules/catalog/product-canonical";
import {
  aggregateCatalogLinePricing,
  computeCatalogLinePricing,
  computeMarginPercent,
  formatCatalogCurrency,
  formatCatalogPercent,
} from "@/modules/catalog/pricing";
import { getFirebaseApp } from "@/lib/firebase/client";
import {
  getEffectiveSaleSourceLabel,
  persistSourceProductEffectiveSalePrice,
  persistSourceProductPricing,
  replaceCatalogProduct,
} from "@/modules/admin/catalog/source-product-pricing";

type BoxEditDrawerProps = {
  box: Box | null;
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onBoxUpdated: (box: Box) => void;
};

type VariantFormState = {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  referenceContents: Array<{
    productId: string;
    nameEs: string;
    nameEn: string;
    quantity: string;
  }>;
};

type FormState = {
  nameEs: string;
  nameEn: string;
  priceAmount: string;
  descriptionEs: string;
  descriptionEn: string;
  heroImage: string;
  isFeatured: boolean;
  durationDays: string;
  weightLabel: string;
  variants: VariantFormState[];
  suppliesRecipe: { supplyId: string; name: string; quantity: number }[];
};

type SupplyOption = {
  id: string;
  name: string;
};

type ProductSearchOption = {
  product: Product;
  sku: string;
  nameEs: string;
  nameEn: string;
  categoryId: string;
  status: string;
  haystack: string;
};

type PendingPurchaseUpdate = {
  contentKey: string;
  product: Product;
  nextWholesaleCost: number;
  currentWholesaleCost: number | null;
};

type PendingSaleUpdate = {
  contentKey: string;
  product: Product;
  nextSalePrice: number;
  currentSalePrice: number | null;
  sourceLabel: string;
};

type PriceMetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

function PriceMetricCard({ label, value, hint }: PriceMetricCardProps) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/60 px-3 py-2">
      <div className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">{value}</div>
      {hint ? <div className="mt-1 text-[0.7rem] text-[var(--gd-color-text-muted)]">{hint}</div> : null}
    </div>
  );
}

function isBoxCatalogItem(product: Product) {
  const productKey = (product.sku ?? product.id ?? "").toUpperCase();
  const categoryId = (product.categoryId ?? "").toLowerCase();
  return product.type === "box" || categoryId === "cajas" || productKey.startsWith("GD-CAJA-");
}

function isInternalIngredientCatalogItem(product: Product) {
  const productKey = (product.sku ?? product.id ?? "").toUpperCase();
  const categoryId = (product.categoryId ?? "").toLowerCase();
  return categoryId === "ingredientes" || productKey.startsWith("GD-ING-") || productKey.startsWith("GD-INGR-");
}

function findReferenceProduct(
  productLookup: Map<string, Product>,
  productId?: string,
  nameEs?: string,
  nameEn?: string,
) {
  for (const candidate of [productId, nameEs, nameEn]) {
    const key = typeof candidate === "string" ? normalizeCatalogSearch(candidate) : "";
    if (!key) continue;
    const product = productLookup.get(key);
    if (product) return product;
  }

  return null;
}

function buildInitialForm(box: Box, products: Product[]): FormState {
  const productLookup = buildCanonicalProductLookup(products);
  const billOfMaterials = Array.isArray(box.metadata?.billOfMaterials)
    ? box.metadata?.billOfMaterials
        .map((item) => ({
          supplyId: item.supplyId,
          name: item.name ?? "",
          quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0,
        }))
        .filter((item) => item.supplyId)
    : [];
  return {
    nameEs: box.name.es ?? "",
    nameEn: box.name.en ?? "",
    priceAmount: box.price.amount.toString(),
    descriptionEs: box.description?.es ?? "",
    descriptionEn: box.description?.en ?? "",
    heroImage: box.heroImage ?? "",
    isFeatured: box.isFeatured ?? false,
    durationDays: box.durationDays ? box.durationDays.toString() : "",
    weightLabel: box.weightLabel ?? "",
    variants: box.variants.map((variant) => ({
      id: variant.id,
      slug: variant.slug,
      nameEs: variant.name.es ?? "",
      nameEn: variant.name.en ?? "",
      descriptionEs: variant.description?.es ?? "",
      descriptionEn: variant.description?.en ?? "",
      referenceContents:
        variant.referenceContents?.map((content) => {
          const matchedProduct = findReferenceProduct(
            productLookup,
            content.productId,
            content.name.es,
            content.name.en,
          );

          return {
            productId: matchedProduct?.sku ?? matchedProduct?.id ?? content.productId ?? "",
            nameEs: matchedProduct?.name.es ?? content.name.es ?? content.name.en ?? "",
            nameEn: matchedProduct?.name.en ?? content.name.en ?? content.name.es ?? "",
            quantity: content.quantity?.toString() || "1",
          };
        }) || [],
    })),
    suppliesRecipe: billOfMaterials,
  };
}

// Validar que los productos en baseContents sean activos y tengan imagen
function validateVariantContents(
  variant: VariantFormState,
  products: Product[],
  boxId: string
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const normalizeName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const productMap = new Map<string, Product>();
  products.forEach((p) => {
    if (p.sku) productMap.set(p.sku, p);
    productMap.set(p.id, p);
    if (p.slug) productMap.set(p.slug, p);
    if (p.name?.es) productMap.set(normalizeName(p.name.es), p);
    if (p.name?.en) productMap.set(normalizeName(p.name.en), p);
  });

  const isBox1 = boxId.toLowerCase().includes("box-1") || boxId.toLowerCase().includes("gd-caja-001");

  variant.referenceContents.forEach((content) => {
    const contentId = content.productId?.trim();
    const contentName = content.nameEs?.trim() || content.nameEn?.trim() || "";
    const normalizedName = contentName ? normalizeName(contentName) : "";

    const product =
      (contentId
        ? productMap.get(contentId) ||
          products.find((p) => p.sku === contentId || p.id === contentId || p.slug === contentId)
        : null) ||
      (normalizedName ? productMap.get(normalizedName) : null);

    if (!product) {
      const missingLabel = contentId || contentName || "sin identificar";
      issues.push(`Producto "${missingLabel}" no encontrado`);
      return;
    }

    if (isInternalIngredientCatalogItem(product)) {
      issues.push(`Producto interno "${product.name.es}" no debe usarse en cajas`);
      return;
    }

    // Validar que esté activo
    if (product.status && product.status !== "active" && product.status !== "coming_soon") {
      issues.push(`Producto "${product.name.es}" está ${product.status}`);
    }

    // Validar que no sea baby (excepto en box-1)
    const isBaby = product.sku?.toLowerCase().includes("baby") || product.tags?.includes("baby-only");
    if (isBaby && !isBox1) {
      issues.push(`Producto baby "${product.name.es}" no permitido en esta caja`);
    }

    // Validar que tenga imagen (SKU-based)
    const sku = product.sku || product.id;
    if (!sku) {
      issues.push(`Producto "${product.name.es}" sin SKU para imagen`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function BoxEditDrawer({ box, isOpen, onClose, products, onBoxUpdated }: BoxEditDrawerProps) {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "supplies">("basic");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [availableSupplies, setAvailableSupplies] = useState<SupplyOption[]>([]);
  const [suppliesLoading, setSuppliesLoading] = useState(false);
  const [selectedSupplyId, setSelectedSupplyId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [contentSearch, setContentSearch] = useState<Record<string, string>>({});
  const [purchasePriceDrafts, setPurchasePriceDrafts] = useState<Record<string, string>>({});
  const [salePriceDrafts, setSalePriceDrafts] = useState<Record<string, string>>({});
  const [activeContentDropdown, setActiveContentDropdown] = useState<string | null>(null);
  const [pendingPurchaseUpdate, setPendingPurchaseUpdate] = useState<PendingPurchaseUpdate | null>(null);
  const [pendingSaleUpdate, setPendingSaleUpdate] = useState<PendingSaleUpdate | null>(null);
  const [savingPurchaseUpdate, setSavingPurchaseUpdate] = useState(false);
  const [savingSaleUpdate, setSavingSaleUpdate] = useState(false);

  const selectableProducts = useMemo(
    () =>
      dedupeCatalogProducts(
        catalogProducts.filter((product) => {
          if (isBoxCatalogItem(product) || isInternalIngredientCatalogItem(product)) {
            return false;
          }
          return product.status === "active" || product.status === "coming_soon";
        }),
      ),
    [catalogProducts],
  );
  const productLookup = useMemo(() => buildCanonicalProductLookup(catalogProducts), [catalogProducts]);

  const productSearchOptions = useMemo(() => {
    const aliasesByDuplicateKey = new Map<string, string[]>();

    catalogProducts.forEach((product) => {
      if (isBoxCatalogItem(product) || isInternalIngredientCatalogItem(product)) {
        return;
      }
      if (product.status !== "active" && product.status !== "coming_soon") {
        return;
      }

      const duplicateKey = getCatalogDuplicateKey(product);
      const aliases = aliasesByDuplicateKey.get(duplicateKey) ?? [];
      aliases.push(product.sku ?? product.id, product.id, product.slug ?? "", product.name.es, product.name.en);
      aliasesByDuplicateKey.set(
        duplicateKey,
        Array.from(new Set(aliases.map((value) => value.trim()).filter(Boolean))),
      );
    });

    return selectableProducts
      .map((product): ProductSearchOption => {
        const sku = product.sku ?? product.id;
        const nameEs = product.name.es || product.name.en || sku;
        const nameEn = product.name.en || product.name.es || "";
        const categoryId = product.categoryId ?? "";
        const status = product.status ?? "legacy";
        const aliases = aliasesByDuplicateKey.get(getCatalogDuplicateKey(product)) ?? [];
        const haystack = normalizeCatalogSearch(
          [sku, product.id, product.slug ?? "", nameEs, nameEn, categoryId, status, ...aliases].join(" "),
        );
        return {
          product,
          sku,
          nameEs,
          nameEn,
          categoryId,
          status,
          haystack,
        };
      })
      .sort((left, right) => left.nameEs.localeCompare(right.nameEs, "es"));
  }, [catalogProducts, selectableProducts]);

  const getContentKey = useCallback((variantIdx: number, contentIdx: number) => `${variantIdx}:${contentIdx}`, []);

  const clearContentSearchKey = useCallback((contentKey: string) => {
    setContentSearch((prev) => {
      if (!(contentKey in prev)) return prev;
      const next = { ...prev };
      delete next[contentKey];
      return next;
    });
  }, []);

  const findProductByReference = useCallback(
    (value: string) => {
      return findReferenceProduct(productLookup, value);
    },
    [productLookup],
  );

  const updateReferenceContent = useCallback(
    (
      variantIdx: number,
      contentIdx: number,
      updater: (content: VariantFormState["referenceContents"][number]) => VariantFormState["referenceContents"][number],
    ) => {
      setFormState((prev) => {
        if (!prev) return prev;
        if (!prev.variants[variantIdx]?.referenceContents[contentIdx]) return prev;

        const nextVariants = [...prev.variants];
        const nextContents = [...nextVariants[variantIdx].referenceContents];
        nextContents[contentIdx] = updater(nextContents[contentIdx]);
        nextVariants[variantIdx] = {
          ...nextVariants[variantIdx],
          referenceContents: nextContents,
        };
        return { ...prev, variants: nextVariants };
      });
    },
    [],
  );

  const handleReferenceProductSelect = useCallback(
    (variantIdx: number, contentIdx: number, product: Product) => {
      const contentKey = getContentKey(variantIdx, contentIdx);
      updateReferenceContent(variantIdx, contentIdx, (content) => ({
        ...content,
        productId: product.sku ?? product.id,
        nameEs: product.name.es || product.name.en || product.sku || product.id,
        nameEn: product.name.en || product.name.es || product.sku || product.id,
      }));
      clearContentSearchKey(contentKey);
      setActiveContentDropdown(null);
    },
    [clearContentSearchKey, getContentKey, updateReferenceContent],
  );

  useEffect(() => {
    if (!isOpen) {
      setCatalogProducts(products);
    }
  }, [isOpen, products]);

  useEffect(() => {
    if (box && isOpen) {
      setCatalogProducts(products);
      setFormState(buildInitialForm(box, products));
      setError(null);
      setMessage(null);
      setActiveTab("basic");
      setSelectedFile(null);
      setPreviewUrl(null);
      setAddQuantity("1");
      setContentSearch({});
      setPurchasePriceDrafts({});
      setSalePriceDrafts({});
      setActiveContentDropdown(null);
      setPendingPurchaseUpdate(null);
      setPendingSaleUpdate(null);
    }
  }, [box, isOpen, products]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (activeTab !== "supplies") return;
    if (suppliesLoading || availableSupplies.length > 0) return;

    const fetchSupplies = async () => {
      setSuppliesLoading(true);
      try {
        const db = getFirestore(getFirebaseApp());
        const snapshot = await getDocs(collection(db, "catalog_supplies"));
        const supplies = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as { name?: string };
            return { id: docSnap.id, name: data.name ?? docSnap.id };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setAvailableSupplies(supplies);
        if (!selectedSupplyId && supplies.length > 0) {
          setSelectedSupplyId(supplies[0].id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los insumos.";
        setError(message);
        toast.error(message);
      } finally {
        setSuppliesLoading(false);
      }
    };

    fetchSupplies();
  }, [activeTab, availableSupplies.length, suppliesLoading, selectedSupplyId]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!box || !formState) return;

      // Validar todas las variantes
      const allIssues: string[] = [];
      formState.variants.forEach((variant) => {
        const validation = validateVariantContents(variant, catalogProducts, box.id);
        if (!validation.isValid) {
          allIssues.push(...validation.issues);
        }
      });

      if (allIssues.length > 0) {
        setError(`Problemas de validación:\n${allIssues.join("\n")}`);
        return;
      }

      setSaving(true);
      setError(null);
      setMessage(null);

      try {
        let heroImage = formState.heroImage || undefined;
        if (selectedFile) {
          const formData = new FormData();
          formData.append("sku", box.id);
          formData.append("productId", box.id);
          formData.append("categoryId", "cajas");
          formData.append("folder", "boxes");
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
            heroImage = uploadJson.data.imageUrl;
          }
        }

        const updatePayload = {
          name: {
            es: formState.nameEs,
            en: formState.nameEn,
          },
          price: {
            amount: parseFloat(formState.priceAmount),
            currency: box.price.currency,
          },
          description: {
            es: formState.descriptionEs || undefined,
            en: formState.descriptionEn || undefined,
          },
          heroImage,
          isFeatured: formState.isFeatured,
          ruleId: box.ruleId ?? box.id,
          durationDays: formState.durationDays ? parseInt(formState.durationDays) : undefined,
          weightLabel: formState.weightLabel.trim() || undefined,
          metadata: {
            ...(box.metadata ?? {}),
            billOfMaterials: formState.suppliesRecipe.map((item) => ({
              supplyId: item.supplyId,
              name: item.name,
              quantity: item.quantity,
            })),
          },
          variants: formState.variants.map((variant) => ({
            id: variant.id,
            slug: variant.slug,
            name: {
              es: variant.nameEs,
              en: variant.nameEn,
            },
            description: variant.descriptionEs || variant.descriptionEn
              ? {
                  es: variant.descriptionEs,
                  en: variant.descriptionEn,
                }
              : undefined,
            referenceContents: variant.referenceContents
              .filter((c) => c.productId)
              .map((c) => {
                const matchedProduct = findReferenceProduct(productLookup, c.productId, c.nameEs, c.nameEn);
                return {
                  productId: matchedProduct?.sku ?? matchedProduct?.id ?? c.productId,
                  name: {
                    es: matchedProduct?.name.es ?? c.nameEs,
                    en: matchedProduct?.name.en ?? c.nameEn ?? matchedProduct?.name.es ?? c.nameEs,
                  },
                  quantity: parseInt(c.quantity) || 1,
                };
              }),
          })),
        };

        const response = await adminFetch(`/api/admin/catalog/boxes/${box.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al actualizar la caja");
        }

        const updated = await response.json();
        setMessage("Caja actualizada correctamente");
        setTimeout(() => {
          onBoxUpdated(updated.data);
          onClose();
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setSaving(false);
      }
    },
    [box, catalogProducts, formState, onBoxUpdated, onClose, productLookup, selectedFile]
  );

  const requestPurchasePriceUpdate = useCallback(
    (contentKey: string, product: Product, draftValue: string) => {
      const parsed = Number(draftValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error("Ingresa un costo de compra valido.");
        return;
      }

      const currentWholesaleCost =
        typeof product.metadata?.wholesaleCost === "number" && Number.isFinite(product.metadata.wholesaleCost)
          ? product.metadata.wholesaleCost
          : null;

      setPendingPurchaseUpdate({
        contentKey,
        product,
        nextWholesaleCost: parsed,
        currentWholesaleCost,
      });
    },
    [],
  );

  const confirmPurchasePriceUpdate = useCallback(async () => {
    if (!pendingPurchaseUpdate) return;

    setSavingPurchaseUpdate(true);
    setError(null);

    try {
      const updatedProduct = await persistSourceProductPricing(pendingPurchaseUpdate.product, {
        wholesaleCost: pendingPurchaseUpdate.nextWholesaleCost,
      });

      setCatalogProducts((current) => replaceCatalogProduct(current, updatedProduct));
      setPurchasePriceDrafts((current) => {
        const next = { ...current };
        delete next[pendingPurchaseUpdate.contentKey];
        return next;
      });
      setPendingPurchaseUpdate(null);
      toast.success(`Costo de compra actualizado en ${updatedProduct.name.es || updatedProduct.sku || updatedProduct.id}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el costo de compra.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingPurchaseUpdate(false);
    }
  }, [pendingPurchaseUpdate]);

  const requestSalePriceUpdate = useCallback(
    (contentKey: string, product: Product, draftValue: string) => {
      const parsed = Number(draftValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error("Ingresa un precio de venta valido.");
        return;
      }

      setPendingSaleUpdate({
        contentKey,
        product,
        nextSalePrice: parsed,
        currentSalePrice: Number.isFinite(Number(product.salePrice ?? product.price))
          ? Number(product.salePrice ?? product.price)
          : null,
        sourceLabel: getEffectiveSaleSourceLabel(product),
      });
    },
    [],
  );

  const confirmSalePriceUpdate = useCallback(async () => {
    if (!pendingSaleUpdate) return;

    setSavingSaleUpdate(true);
    setError(null);

    try {
      const updatedProduct = await persistSourceProductEffectiveSalePrice(
        pendingSaleUpdate.product,
        pendingSaleUpdate.nextSalePrice,
      );

      setCatalogProducts((current) => replaceCatalogProduct(current, updatedProduct));
      setSalePriceDrafts((current) => {
        const next = { ...current };
        delete next[pendingSaleUpdate.contentKey];
        return next;
      });
      setPendingSaleUpdate(null);
      toast.success(`Precio de venta actualizado en ${updatedProduct.name.es || updatedProduct.sku || updatedProduct.id}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el precio de venta.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingSaleUpdate(false);
    }
  }, [pendingSaleUpdate]);

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

  if (!isOpen || !box || !formState) return null;

  const boxAsProduct: Product = {
    id: box.id,
    slug: box.slug,
    sku: box.id,
    name: { es: box.name.es ?? box.slug, en: box.name.en ?? box.slug },
    isActive: true,
    price: box.price.amount,
    categoryId: "cajas",
    status: "active",
  };

  const previewImageUrl = previewUrl ?? formState.heroImage;
  const parsedBoxSalePrice = Number(formState.priceAmount);
  const boxSalePrice = Number.isFinite(parsedBoxSalePrice) && parsedBoxSalePrice >= 0 ? parsedBoxSalePrice : null;

  // Validar variantes
  const variantValidations = formState.variants.map((variant) =>
    validateVariantContents(variant, catalogProducts, box.id)
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[9999] flex h-full w-[96vw] max-w-[1800px] flex-col overflow-hidden bg-[var(--gd-color-beige)] shadow-2xl"
          >
            {/* Header */}
            <div className="glass-panel flex items-start justify-between border-b border-white/40 px-6 py-5 xl:px-10">
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--gd-color-forest)] xl:text-3xl">
                    {formState.nameEs}
                  </h2>
                  <p className="text-xs font-mono text-[var(--gd-color-text-muted)] xl:text-sm">{box.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-leaf)]/10 px-3 py-1 text-xs font-semibold text-[var(--gd-color-forest)]">
                    Precio caja: {formatCatalogCurrency(boxSalePrice)}
                  </span>
                  <span className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-medium text-[var(--gd-color-text-muted)]">
                    Editor ampliado para composicion y margen
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 transition-colors hover:bg-white/50"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6 text-[var(--gd-color-text-muted)]" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-8 overflow-y-auto px-6 py-6 xl:px-10 xl:py-8">
              {error && (
                <div className="glass-panel rounded-2xl p-4 bg-red-50 border border-red-200 text-red-700 text-sm whitespace-pre-line">
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
                  { id: "basic", label: "Caja" },
                  { id: "supplies", label: "Insumos" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as "basic" | "supplies")}
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
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.9fr)]">
                    {/* Información básica */}
                    <div className="glass-panel rounded-2xl border border-white/60 p-5 xl:p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <label className="block text-sm font-semibold text-[var(--gd-color-forest)]">
                          Información básica
                        </label>
                        <span className="text-xs text-[var(--gd-color-text-muted)]">
                          Datos visibles de la caja
                        </span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="xl:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-[var(--gd-color-text-muted)]">
                            Nombre (ES) *
                          </label>
                          <input
                            type="text"
                            value={formState.nameEs}
                            onChange={(e) => setFormState({ ...formState, nameEs: e.target.value })}
                            required
                            className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                          />
                        </div>
                        <div className="xl:col-span-1">
                          <label className="mb-1 block text-xs font-medium text-[var(--gd-color-text-muted)]">
                            Precio caja (DOP) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formState.priceAmount}
                            onChange={(e) => setFormState({ ...formState, priceAmount: e.target.value })}
                            required
                            className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                          />
                        </div>
                        <div className="xl:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-[var(--gd-color-text-muted)]">
                            Nombre (EN) *
                          </label>
                          <input
                            type="text"
                            value={formState.nameEn}
                            onChange={(e) => setFormState({ ...formState, nameEn: e.target.value })}
                            required
                            className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--gd-color-text-muted)]">
                            Duración (días)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formState.durationDays}
                            onChange={(e) => setFormState({ ...formState, durationDays: e.target.value })}
                            className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--gd-color-text-muted)]">
                            Peso visible
                          </label>
                          <input
                            type="text"
                            value={formState.weightLabel}
                            onChange={(e) => setFormState({ ...formState, weightLabel: e.target.value })}
                            placeholder="~6 kg / 13.2 lb"
                            className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/60 bg-white/45 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={formState.isFeatured}
                              onChange={(e) => setFormState({ ...formState, isFeatured: e.target.checked })}
                              className="rounded border-white/60 text-[var(--gd-color-leaf)] focus:ring-[var(--gd-color-leaf)]"
                            />
                            <span className="text-sm text-[var(--gd-color-text-muted)]">Caja destacada</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Imagen de la Caja */}
                    <div className="glass-panel rounded-2xl border border-white/60 p-5 xl:p-6">
                      <label className="mb-4 block text-sm font-semibold text-[var(--gd-color-forest)]">
                        Imagen de la caja
                      </label>
                      <div className="flex flex-col gap-4">
                        <div className="rounded-2xl border border-white/60 bg-white/75 p-3 shadow-sm">
                          <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50">
                            <img
                              src={previewImageUrl}
                              alt={formState.nameEs || box.id}
                              className="h-full w-full object-contain object-center px-4 py-3"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs text-[var(--gd-color-text-muted)]">
                            Vista previa actual: {previewImageUrl || `/assets/images/boxes/${box.id}.png`}
                          </p>
                          <label className="inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 text-xs font-semibold text-[var(--gd-color-forest)] shadow-sm transition hover:bg-white">
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
                  </div>

                  {/* Variantes */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-[var(--gd-color-forest)]">Variantes</label>
                      <span className="text-xs text-[var(--gd-color-text-muted)]">
                        Mas espacio para editar composicion y margen
                      </span>
                    </div>

                    {formState.variants.map((variant, variantIdx) => {
                      const validation = variantValidations[variantIdx];
                      return (
                        <div
                          key={variant.id}
                          className="glass-panel space-y-5 rounded-3xl border border-white/60 p-5 xl:p-6"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {validation.isValid ? (
                                <CheckCircle2 className="h-5 w-5 text-[var(--gd-color-leaf)]" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                              )}
                              <h3 className="font-semibold text-[var(--gd-color-forest)]">
                                {variant.nameEs || `Variante ${variantIdx + 1}`}
                              </h3>
                            </div>
                          </div>

                          {!validation.isValid && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                              <p className="font-semibold mb-1">Problemas detectados:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {validation.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                                  Nombre (ES)
                                </label>
                                <input
                                  type="text"
                                  value={variant.nameEs}
                                  onChange={(e) => {
                                    const newVariants = [...formState.variants];
                                    newVariants[variantIdx].nameEs = e.target.value;
                                    setFormState({ ...formState, variants: newVariants });
                                  }}
                                  className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                                  Nombre (EN)
                                </label>
                                <input
                                  type="text"
                                  value={variant.nameEn}
                                  onChange={(e) => {
                                    const newVariants = [...formState.variants];
                                    newVariants[variantIdx].nameEn = e.target.value;
                                    setFormState({ ...formState, variants: newVariants });
                                  }}
                                  className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                                />
                              </div>
                            </div>

                            {(() => {
                              const variantLinePricing = variant.referenceContents.map((content) =>
                                computeCatalogLinePricing(
                                  content.quantity,
                                  findReferenceProduct(productLookup, content.productId, content.nameEs, content.nameEn),
                                ),
                              );
                              const aggregate = aggregateCatalogLinePricing(variantLinePricing);
                              const estimatedBoxProfit =
                                boxSalePrice === null ? null : boxSalePrice - aggregate.costTotal;
                              const estimatedBoxMargin = computeMarginPercent(estimatedBoxProfit, boxSalePrice);
                              const completenessHint =
                                aggregate.missingPurchaseCount > 0
                                  ? `Parcial: faltan ${aggregate.missingPurchaseCount} costos de compra para cerrar el margen real.`
                                  : "Margen calculado sobre el precio actual de la caja.";

                              return (
                                <div className="rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-leaf)]/10 p-4">
                                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--gd-color-forest)]">
                                    Total de la caja
                                  </div>
                                  <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                                    <PriceMetricCard
                                      label="Precio caja"
                                      value={formatCatalogCurrency(boxSalePrice)}
                                      hint="Editable aqui"
                                    />
                                    <PriceMetricCard
                                      label="Costo total"
                                      value={formatCatalogCurrency(aggregate.costTotal)}
                                      hint={aggregate.missingPurchaseCount > 0 ? "Parcial" : "Completo"}
                                    />
                                    <PriceMetricCard
                                      label="Ganancia total"
                                      value={formatCatalogCurrency(estimatedBoxProfit)}
                                      hint={completenessHint}
                                    />
                                    <PriceMetricCard
                                      label="Margen"
                                      value={formatCatalogPercent(estimatedBoxMargin)}
                                      hint={boxSalePrice === null ? "Define el precio de la caja" : completenessHint}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <div>
                            <div className="mb-3 flex items-end justify-between gap-4">
                              <div>
                                <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-2">
                                  Productos base
                                </label>
                                <p className="text-[0.7rem] text-[var(--gd-color-text-muted)]">
                                  Productos base de esta variante. Busca por nombre o SKU.
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {variant.referenceContents.map((content, contentIdx) => {
                                const contentKey = getContentKey(variantIdx, contentIdx);
                                const searchValue = contentSearch[contentKey] ?? "";
                                const inputValue = searchValue || content.nameEs || content.nameEn || "";
                                const normalizedSearch = normalizeCatalogSearch(searchValue);
                                const matches = (
                                  normalizedSearch
                                    ? productSearchOptions.filter((option) =>
                                        option.haystack.includes(normalizedSearch),
                                      )
                                    : productSearchOptions
                                ).slice(0, 8);
                                const matchedProduct = findReferenceProduct(
                                  productLookup,
                                  content.productId,
                                  content.nameEs,
                                  content.nameEn,
                                );
                                const pricing = computeCatalogLinePricing(content.quantity, matchedProduct);
                                const purchasePriceDraft = purchasePriceDrafts[contentKey];
                                const purchaseInputValue =
                                  purchasePriceDraft ??
                                  (pricing.purchaseUnitPrice !== null ? String(pricing.purchaseUnitPrice) : "");
                                const parsedDraftPurchasePrice = Number(purchaseInputValue);
                                const hasValidPurchasePriceDraft =
                                  purchaseInputValue.trim() !== "" &&
                                  Number.isFinite(parsedDraftPurchasePrice) &&
                                  parsedDraftPurchasePrice >= 0;
                                const purchasePriceChanged =
                                  hasValidPurchasePriceDraft &&
                                  parsedDraftPurchasePrice !== pricing.purchaseUnitPrice;
                                const salePriceDraft = salePriceDrafts[contentKey];
                                const saleInputValue =
                                  salePriceDraft ?? (pricing.saleUnitPrice !== null ? String(pricing.saleUnitPrice) : "");
                                const parsedDraftSalePrice = Number(saleInputValue);
                                const hasValidSalePriceDraft =
                                  saleInputValue.trim() !== "" &&
                                  Number.isFinite(parsedDraftSalePrice) &&
                                  parsedDraftSalePrice >= 0;
                                const salePriceChanged =
                                  hasValidSalePriceDraft && parsedDraftSalePrice !== pricing.saleUnitPrice;

                                return (
                                  <div
                                    key={contentIdx}
                                    className="rounded-2xl border border-white/40 bg-white/35 p-4 xl:grid xl:grid-cols-[minmax(0,1.15fr)_minmax(520px,0.95fr)_44px] xl:gap-4"
                                  >
                                    <div className="space-y-3">
                                      <div className="grid gap-3 sm:grid-cols-3">
                                        <div>
                                          <label className="block text-xs text-[var(--gd-color-text-muted)] mb-1">
                                            SKU/ID Producto *
                                          </label>
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              value={content.productId}
                                              onChange={(e) => {
                                                const nextValue = e.target.value.toUpperCase();
                                                const nextMatchedProduct = findProductByReference(nextValue);
                                                updateReferenceContent(variantIdx, contentIdx, (current) => ({
                                                  ...current,
                                                  productId: nextValue,
                                                  nameEs: nextMatchedProduct?.name.es || nextMatchedProduct?.name.en || "",
                                                  nameEn: nextMatchedProduct?.name.en || nextMatchedProduct?.name.es || "",
                                                }));
                                                clearContentSearchKey(contentKey);
                                              }}
                                              placeholder="GD-FRUT-001"
                                              className="w-full rounded-xl border border-white/60 bg-white/60 px-3 py-3 text-sm font-mono backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                            />
                                            <a
                                              href={matchedProduct ? `/admin/products?edit=${encodeURIComponent(matchedProduct.sku ?? matchedProduct.id)}` : undefined}
                                              className={`inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-white/60 bg-white/70 text-[var(--gd-color-forest)] shadow-sm transition ${
                                                matchedProduct ? "hover:bg-white" : "pointer-events-none opacity-40"
                                              }`}
                                              title={matchedProduct ? `Editar ${matchedProduct.name.es} en catálogo` : "Selecciona un producto válido"}
                                            >
                                              <SquareArrowOutUpRight className="h-4 w-4" />
                                            </a>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs text-[var(--gd-color-text-muted)] mb-1">
                                            Cantidad
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={content.quantity}
                                            onChange={(e) => {
                                              const newVariants = [...formState.variants];
                                              const newContents = [...newVariants[variantIdx].referenceContents];
                                              newContents[contentIdx].quantity = e.target.value;
                                              newVariants[variantIdx].referenceContents = newContents;
                                              setFormState({ ...formState, variants: newVariants });
                                            }}
                                            className="w-full rounded-xl border border-white/60 bg-white/60 px-3 py-3 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                          />
                                        </div>
                                        <div className="relative">
                                          <label className="block text-xs text-[var(--gd-color-text-muted)] mb-1">
                                            Nombre
                                          </label>
                                          <input
                                            type="text"
                                            value={inputValue}
                                            onFocus={() => setActiveContentDropdown(contentKey)}
                                            onBlur={() => {
                                              setTimeout(() => {
                                                setActiveContentDropdown((current) =>
                                                  current === contentKey ? null : current,
                                                );
                                              }, 120);
                                            }}
                                            onChange={(e) => {
                                              const nextValue = e.target.value;
                                              setContentSearch((prev) => ({ ...prev, [contentKey]: nextValue }));
                                              setActiveContentDropdown(contentKey);
                                              updateReferenceContent(variantIdx, contentIdx, (current) => ({
                                                ...current,
                                                productId: "",
                                                nameEs: "",
                                                nameEn: "",
                                              }));
                                            }}
                                            placeholder="Escribe nombre o SKU, ej: Lechu"
                                            className="w-full rounded-xl border border-white/60 bg-white/60 px-3 py-3 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                          />
                                          {activeContentDropdown === contentKey && matches.length > 0 && (
                                            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-white/60 bg-white shadow-lg">
                                              {matches.map((option) => (
                                                <button
                                                  key={option.sku}
                                                  type="button"
                                                  onMouseDown={(event) => event.preventDefault()}
                                                  onClick={() =>
                                                    handleReferenceProductSelect(
                                                      variantIdx,
                                                      contentIdx,
                                                      option.product,
                                                    )
                                                  }
                                                  className="block w-full px-3 py-2 text-left hover:bg-[var(--gd-color-leaf)]/10"
                                                >
                                                  <div className="text-sm font-medium text-[var(--gd-color-forest)]">
                                                    {option.nameEs}
                                                  </div>
                                                  <div className="text-[0.7rem] font-mono text-[var(--gd-color-text-muted)]">
                                                    {option.sku}
                                                    {option.categoryId ? ` · ${option.categoryId}` : ""}
                                                    {option.status !== "active" ? ` · ${option.status}` : ""}
                                                  </div>
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:mt-0 xl:w-[360px]">
                                      <div className="rounded-xl border border-white/60 bg-white/60 px-3 py-2">
                                        <div className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
                                          Compra c/u
                                        </div>
                                        {matchedProduct ? (
                                          <>
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={purchaseInputValue}
                                              onChange={(event) =>
                                                setPurchasePriceDrafts((current) => ({
                                                  ...current,
                                                  [contentKey]: event.target.value,
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
                                                  requestPurchasePriceUpdate(
                                                    contentKey,
                                                    matchedProduct,
                                                    purchaseInputValue,
                                                  )
                                                }
                                                disabled={!purchasePriceChanged}
                                                className="rounded-lg border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-leaf)]/10 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/20 disabled:cursor-not-allowed disabled:opacity-40"
                                              >
                                                Aplicar
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">N/D</div>
                                        )}
                                      </div>
                                      <div className="rounded-xl border border-white/60 bg-white/60 px-3 py-2">
                                        <div className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
                                          Venta c/u
                                        </div>
                                        {matchedProduct ? (
                                          <>
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={saleInputValue}
                                              onChange={(event) =>
                                                setSalePriceDrafts((current) => ({
                                                  ...current,
                                                  [contentKey]: event.target.value,
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
                                                  requestSalePriceUpdate(contentKey, matchedProduct, saleInputValue)
                                                }
                                                disabled={!salePriceChanged}
                                                className="rounded-lg border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-leaf)]/10 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/20 disabled:cursor-not-allowed disabled:opacity-40"
                                              >
                                                Aplicar
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">N/D</div>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newVariants = [...formState.variants];
                                        newVariants[variantIdx].referenceContents = newVariants[
                                          variantIdx
                                        ].referenceContents.filter((_, i) => i !== contentIdx);
                                        setFormState({ ...formState, variants: newVariants });
                                        setContentSearch({});
                                        setActiveContentDropdown(null);
                                      }}
                                      className="mt-3 rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50 xl:mt-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => {
                                  const newVariants = [...formState.variants];
                                  newVariants[variantIdx].referenceContents.push({
                                    productId: "",
                                    nameEs: "",
                                    nameEn: "",
                                    quantity: "1",
                                  });
                                  setFormState({ ...formState, variants: newVariants });
                                  setContentSearch({});
                                  setActiveContentDropdown(null);
                                }}
                                className="w-full rounded-xl border border-dashed border-white/60 bg-white/20 px-4 py-3 text-sm font-medium text-[var(--gd-color-text-muted)] transition-colors hover:bg-white/40"
                              >
                                + Agregar Producto
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                        disabled={suppliesLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--gd-color-leaf)]/40 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--gd-color-forest)] shadow-sm transition hover:bg-white disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar
                      </button>
                    </div>
                    {suppliesLoading && (
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
                              <th className="px-4 py-3 text-left font-semibold text-[var(--gd-color-forest)]">
                                Insumo
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-[var(--gd-color-forest)]">
                                Cantidad
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-[var(--gd-color-forest)]">
                                Acciones
                              </th>
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

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-white/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm text-[var(--gd-color-text-muted)] font-medium text-sm hover:bg-white/70 transition-colors"
                >
                  Cancelar
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

          {pendingPurchaseUpdate && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 px-4">
              <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-[var(--gd-color-beige)] p-6 shadow-2xl">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">
                    Actualizar costo de compra
                  </h3>
                  <p className="mt-1 text-sm text-[var(--gd-color-text-muted)]">
                    Este cambio se guardara en el producto general{" "}
                    <span className="font-semibold text-[var(--gd-color-forest)]">
                      {pendingPurchaseUpdate.product.name.es || pendingPurchaseUpdate.product.sku || pendingPurchaseUpdate.product.id}
                    </span>{" "}
                    y se reflejara en cajas, combos, recetas y calculos donde se use.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PriceMetricCard
                    label="Costo actual"
                    value={formatCatalogCurrency(pendingPurchaseUpdate.currentWholesaleCost)}
                    hint="Valor fuente actual"
                  />
                  <PriceMetricCard
                    label="Nuevo costo"
                    value={formatCatalogCurrency(pendingPurchaseUpdate.nextWholesaleCost)}
                    hint="Se guardara en catalogo"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingPurchaseUpdate(null)}
                    disabled={savingPurchaseUpdate}
                    className="rounded-xl border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-[var(--gd-color-text-muted)] transition hover:bg-white disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmPurchasePriceUpdate}
                    disabled={savingPurchaseUpdate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-color-leaf)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--gd-color-leaf-dark)] disabled:opacity-60"
                  >
                    {savingPurchaseUpdate ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Guardar en producto fuente
                  </button>
                </div>
              </div>
            </div>
          )}

          {pendingSaleUpdate && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 px-4">
              <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-[var(--gd-color-beige)] p-6 shadow-2xl">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">
                    Actualizar precio de venta
                  </h3>
                  <p className="mt-1 text-sm text-[var(--gd-color-text-muted)]">
                    Este cambio se guardara en el producto general{" "}
                    <span className="font-semibold text-[var(--gd-color-forest)]">
                      {pendingSaleUpdate.product.name.es || pendingSaleUpdate.product.sku || pendingSaleUpdate.product.id}
                    </span>{" "}
                    como <span className="font-semibold text-[var(--gd-color-forest)]">{pendingSaleUpdate.sourceLabel}</span> y se reflejara en cajas, combos, recetas y calculos donde se use.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PriceMetricCard
                    label="Venta actual"
                    value={formatCatalogCurrency(pendingSaleUpdate.currentSalePrice)}
                    hint="Valor fuente actual"
                  />
                  <PriceMetricCard
                    label="Nueva venta"
                    value={formatCatalogCurrency(pendingSaleUpdate.nextSalePrice)}
                    hint="Se guardara en catalogo"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingSaleUpdate(null)}
                    disabled={savingSaleUpdate}
                    className="rounded-xl border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-[var(--gd-color-text-muted)] transition hover:bg-white disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmSalePriceUpdate}
                    disabled={savingSaleUpdate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-color-leaf)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--gd-color-leaf-dark)] disabled:opacity-60"
                  >
                    {savingSaleUpdate ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
