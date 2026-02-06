"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, AlertTriangle, CheckCircle2, Upload, Plus, Trash2 } from "lucide-react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

import { adminFetch } from "@/modules/admin/api/client";
import type { Box, Product } from "@/modules/catalog/types";
import { ProductImageFallback } from "@/app/_components/product-image-fallback";
import { getFirebaseApp } from "@/lib/firebase/client";

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
  variants: VariantFormState[];
  suppliesRecipe: { supplyId: string; name: string; quantity: number }[];
};

type SupplyOption = {
  id: string;
  name: string;
};

function buildInitialForm(box: Box): FormState {
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
    variants: box.variants.map((variant) => ({
      id: variant.id,
      slug: variant.slug,
      nameEs: variant.name.es ?? "",
      nameEn: variant.name.en ?? "",
      descriptionEs: variant.description?.es ?? "",
      descriptionEn: variant.description?.en ?? "",
      referenceContents: variant.referenceContents?.map((content) => ({
        productId: content.productId || "",
        nameEs: content.name.es ?? "",
        nameEn: content.name.en ?? "",
        quantity: content.quantity?.toString() || "1",
      })) || [],
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

  // Filtrar productos activos para selector
  const activeProducts = products.filter(
    (p) => p.status === "active" || p.status === "coming_soon"
  );

  useEffect(() => {
    if (box && isOpen) {
      setFormState(buildInitialForm(box));
      setError(null);
      setMessage(null);
      setActiveTab("basic");
      setSelectedFile(null);
      setPreviewUrl(null);
      setAddQuantity("1");
    }
  }, [box, isOpen]);

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
        const validation = validateVariantContents(variant, products, box.id);
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
              .map((c) => ({
                productId: c.productId,
                name: {
                  es: c.nameEs,
                  en: c.nameEn,
                },
                quantity: parseInt(c.quantity) || 1,
              })),
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
    [box, formState, products, onBoxUpdated, onClose, selectedFile]
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

  // Validar variantes
  const variantValidations = formState.variants.map((variant) =>
    validateVariantContents(variant, products, box.id)
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
            className="fixed right-0 top-0 z-[9999] h-full w-full max-w-3xl bg-[var(--gd-color-beige)] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="glass-panel border-b border-white/40 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--gd-color-forest)]">{formState.nameEs}</h2>
                <p className="text-xs text-[var(--gd-color-text-muted)] font-mono">{box.id}</p>
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
                  {/* Información básica */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">
                      Información Básica
                    </label>
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
                      <div>
                        <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                          Precio (DOP) *
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
                          Duración (días)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formState.durationDays}
                          onChange={(e) => setFormState({ ...formState, durationDays: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
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

                  {/* Imagen de la Caja */}
                  <div className="glass-panel rounded-2xl p-4 border border-white/60">
                    <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-3">
                      Imagen de la Caja
                    </label>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm">
                        <ProductImageFallback
                          product={boxAsProduct}
                          image={previewImageUrl}
                          className="w-full h-full object-cover"
                          objectFit="cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-[var(--gd-color-text-muted)]">
                          Vista previa actual: {previewImageUrl || `/assets/images/boxes/${box.id}.png`}
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

                  {/* Variantes */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-[var(--gd-color-forest)]">Variantes</label>
                    </div>

                    {formState.variants.map((variant, variantIdx) => {
                      const validation = variantValidations[variantIdx];
                      return (
                        <div
                          key={variant.id}
                          className="glass-panel rounded-2xl p-4 border border-white/60 space-y-4"
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
                                className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
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
                                className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                              />
                            </div>
                          </div>

                          {/* Contenido de referencia */}
                          <div>
                            <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-2">
                              Productos Base (usar SKU)
                            </label>
                            <div className="space-y-2">
                              {variant.referenceContents.map((content, contentIdx) => (
                                <div
                                  key={contentIdx}
                                  className="flex gap-2 items-start p-3 bg-white/30 rounded-xl border border-white/40"
                                >
                                  <div className="flex-1 grid gap-2 sm:grid-cols-3">
                                    <div>
                                      <label className="block text-xs text-[var(--gd-color-text-muted)] mb-1">
                                        SKU/ID Producto *
                                      </label>
                                      <input
                                        type="text"
                                        value={content.productId}
                                        onChange={(e) => {
                                          const newVariants = [...formState.variants];
                                          const newContents = [...newVariants[variantIdx].referenceContents];
                                          newContents[contentIdx].productId = e.target.value.toUpperCase();
                                          // Buscar producto y actualizar nombres
                                          const product = activeProducts.find(
                                            (p) =>
                                              p.sku === e.target.value.toUpperCase() ||
                                              p.id === e.target.value.toUpperCase() ||
                                              p.slug === e.target.value.toUpperCase()
                                          );
                                          if (product) {
                                            newContents[contentIdx].nameEs = product.name.es || "";
                                            newContents[contentIdx].nameEn = product.name.en || "";
                                          }
                                          newVariants[variantIdx].referenceContents = newContents;
                                          setFormState({ ...formState, variants: newVariants });
                                        }}
                                        placeholder="GD-FRUT-001"
                                        className="w-full px-3 py-2 rounded-lg border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm font-mono"
                                      />
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
                                        className="w-full px-3 py-2 rounded-lg border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-[var(--gd-color-text-muted)] mb-1">
                                        Nombre
                                      </label>
                                      <input
                                        type="text"
                                        value={content.nameEs}
                                        readOnly
                                        className="w-full px-3 py-2 rounded-lg border border-white/60 bg-white/30 backdrop-blur-sm text-sm text-[var(--gd-color-text-muted)]"
                                      />
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
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
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
                                }}
                                className="w-full px-4 py-2 rounded-xl border border-dashed border-white/60 bg-white/20 hover:bg-white/40 text-[var(--gd-color-text-muted)] text-sm font-medium transition-colors"
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
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
