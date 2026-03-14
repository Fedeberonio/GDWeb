"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Search, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { adminFetch } from "@/modules/admin/api/client";
import { ProductImageFallback } from "@/app/_components/product-image-fallback";
import type { Box, LocalizedString, Product, ProductCategory } from "@/modules/catalog/types";
import {
  computeMarginPercent,
  formatCatalogCurrency,
  formatCatalogPercent,
  resolveCatalogPurchasePrice,
  resolveCatalogRegularPrice,
} from "@/modules/catalog/pricing";
import { ProductEditDrawer } from "./product-edit-drawer";
import { BoxEditDrawer } from "./box-edit-drawer";

type ProductGridManagerProps = {
  initialProducts: Product[];
  categories: ProductCategory[];
  onProductCreated?: (product: Product) => void;
};

export function ProductGridManager({ initialProducts, categories, onProductCreated }: ProductGridManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [isBoxDrawerOpen, setIsBoxDrawerOpen] = useState(false);
  const [isBoxLoading, setIsBoxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const normalizedCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((category) => {
      const key = (category.id ?? "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  const createSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const handleCreateProduct = useCallback(async () => {
    if (!newProductCategoryId) {
      toast.error("Selecciona una categoría");
      return;
    }
    if (!newProductSku.trim()) {
      toast.error("El SKU es requerido");
      return;
    }
    if (!/^[A-Za-z0-9\-_]+$/.test(newProductSku.trim())) {
      toast.error("Formato de SKU inválido");
      return;
    }

    try {
      setIsCreating(true);
      const timestamp = Date.now();
      const baseName = "Nuevo producto";
      const normalizedSku = newProductSku.trim();
      const payload: Partial<Product> = {
        sku: normalizedSku,
        slug: `${createSlug(baseName)}-${timestamp}`,
        name: { es: baseName, en: "New product" },
        description: { es: "", en: "" },
        unit: "",
        isActive: false,
        price: 0,
        status: "inactive",
        categoryId: newProductCategoryId,
        image: "",
        tags: [],
        isFeatured: false,
        metadata: {},
        logistics: {},
        nutrition: {},
      };

      const response = await adminFetch("/api/admin/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo crear el producto");
      }

      const json = await response.json();
      const created = json.data as Product;
      setProducts((prev) => [created, ...prev]);
      setSelectedProduct(created);
      setIsDrawerOpen(true);
      setIsCreateModalOpen(false);
      setNewProductCategoryId("");
      setNewProductSku("");
      onProductCreated?.(created);
      toast.success("Producto creado");
    } catch (error) {
      console.error("Error creando producto:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo crear el producto");
    } finally {
      setIsCreating(false);
    }
  }, [newProductCategoryId, newProductSku, onProductCreated]);

  const handleAutoGenerateSku = useCallback(async () => {
    if (!newProductCategoryId) {
      toast.error("Selecciona una categoría primero");
      return;
    }
    try {
      const { generateNextSKU } = await import("@/lib/utils/generate-sku");
      const nextSku = await generateNextSKU(newProductCategoryId);
      setNewProductSku(nextSku);
      toast.success(`SKU generado: ${nextSku}`);
    } catch (error) {
      console.error("Error generating SKU:", error);
      toast.error("Error al generar SKU");
    }
  }, [newProductCategoryId]);

  const isBoxProduct = useCallback((product: Product) => {
    const sku = product.sku ?? product.id ?? "";
    const id = product.id ?? "";
    const category = product.categoryId ?? "";
    return category === "cajas" || /^GD-CAJA-/i.test(sku) || /^GD-CAJA-/i.test(id);
  }, []);

  const isSaladProduct = useCallback((product: Product) => {
    const category = product.categoryId ?? "";
    const normalizedCategory = category.toLowerCase();
    return normalizedCategory.includes("ensalada");
  }, []);

  const resolveItemType = useCallback(
    (product: Product) => {
      if (product.type === "box") {
        return product.type;
      }
      if (product.type === "simple" || product.type === "prepared") {
        return "product";
      }
      const legacyType = (product as { type?: unknown }).type;
      if (legacyType === "product") {
        return "product";
      }
      if (isBoxProduct(product)) return "box";
      if (isSaladProduct(product)) return "prepared";
      return "product";
    },
    [isBoxProduct, isSaladProduct],
  );

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.es?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const resolvedType = resolveItemType(product);
      const matchesCategory =
        categoryFilter === "all" ||
        product.categoryId === categoryFilter ||
        (categoryFilter === "cajas" && resolvedType === "box") ||
        (categoryFilter === "ensaladas" &&
          (resolvedType === "prepared" || (product.categoryId ?? "").toLowerCase().includes("ensalada")));

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchQuery, statusFilter, categoryFilter, resolveItemType]);

  const openBoxEditor = useCallback(async (product: Product) => {
    const boxId = (product.sku ?? product.id ?? "").toUpperCase();
    if (!boxId) return;

    try {
      setIsDrawerOpen(false);
      setSelectedProduct(null);
      setIsBoxLoading(true);
      const response = await adminFetch(`/api/admin/catalog/boxes/${boxId}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "No se pudo abrir la caja");
      }

      setSelectedBox(json.data as Box);
      setIsBoxDrawerOpen(true);
    } catch (error) {
      console.error("Error opening box editor:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la caja");
    } finally {
      setIsBoxLoading(false);
    }
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    if (isBoxProduct(product)) {
      openBoxEditor(product);
      return;
    }
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  }, [isBoxProduct, openBoxEditor]);

  useEffect(() => {
    if (typeof window === "undefined" || products.length === 0) return;

    const searchParams = new URLSearchParams(window.location.search);
    const requestedEdit = searchParams.get("edit")?.trim().toUpperCase();
    if (!requestedEdit) return;

    const matchedProduct = products.find((product) => {
      const sku = (product.sku ?? "").trim().toUpperCase();
      const id = (product.id ?? "").trim().toUpperCase();
      return sku === requestedEdit || id === requestedEdit;
    });

    if (!matchedProduct) return;

    setSearchQuery(matchedProduct.sku ?? matchedProduct.name.es ?? "");
    handleProductClick(matchedProduct);

    searchParams.delete("edit");
    const nextQuery = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [products, handleProductClick]);

  const handleProductUpdated = useCallback((updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setIsDrawerOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleProductDeleted = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setIsDrawerOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleBoxUpdated = useCallback((updatedBox: Box) => {
    setIsBoxDrawerOpen(false);
    setSelectedBox(null);
    setProducts((prev) =>
      prev.map((product) => {
        const productKey = (product.sku ?? product.id ?? "").toUpperCase();
        if (productKey !== updatedBox.id.toUpperCase()) return product;
        const nextDescription: LocalizedString | undefined = updatedBox.description
          ? {
              es: updatedBox.description.es ?? product.description?.es ?? "",
              en: updatedBox.description.en ?? product.description?.en ?? "",
            }
          : product.description;
        return {
          ...product,
          name: updatedBox.name,
          description: nextDescription,
          price: updatedBox.price.amount,
          image: updatedBox.heroImage ?? product.image,
        };
      }),
    );
  }, []);

  const handleCloseBoxDrawer = useCallback(() => {
    setIsBoxDrawerOpen(false);
    setSelectedBox(null);
  }, []);

  const getStatusBadgeColor = (status: Product["status"]) => {
    switch (status) {
      case "active":
        return "bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] border-[var(--gd-color-leaf)]/40";
      case "inactive":
        return "bg-slate-100 text-slate-600 border-slate-300";
      case "coming_soon":
        return "bg-[var(--gd-color-citrus)]/20 text-[var(--gd-color-citrus)] border-[var(--gd-color-citrus)]/40";
      case "discontinued":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-300";
    }
  };

  const getStatusLabel = (status: Product["status"]) => {
    switch (status) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "coming_soon":
        return "Próximamente";
      case "discontinued":
        return "Descontinuado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y filtros */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--gd-color-forest)] mb-1">Catálogo General</h2>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              {filteredProducts.length} de {products.length} items
            </p>
          </div>

          {/* Acciones + Búsqueda */}
          <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-[var(--gd-color-leaf)] text-white font-medium text-sm hover:bg-[var(--gd-color-forest)] transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
            <div className="relative flex-1 lg:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--gd-color-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 focus:border-[var(--gd-color-leaf)]/50 text-sm"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="coming_soon">Próximamente</option>
                <option value="discontinued">Descontinuados</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
              >
                <option value="all">Todas las categorías</option>
                {normalizedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name.es}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      {filteredProducts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center shadow-lg border border-white/60">
          <p className="text-[var(--gd-color-text-muted)]">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const resolvedType = resolveItemType(product);
            const imageBase =
              resolvedType === "box"
                ? "/assets/images/boxes"
                : resolvedType === "prepared" && isSaladProduct(product)
                  ? "/assets/images/salads"
                  : "/assets/images/products";
            const imageKey = product.sku ?? product.id;
            const imageUrl = product.image || (imageKey ? `${imageBase}/${imageKey}.png` : "");
            const regularSalePrice = resolveCatalogRegularPrice(product);
            const regularPrice =
              typeof product.price === "number" && Number.isFinite(product.price) ? product.price : null;
            const promotionalPrice =
              typeof product.salePrice === "number" && Number.isFinite(product.salePrice) ? product.salePrice : null;
            const purchaseUnitPrice = resolveCatalogPurchasePrice(product);
            const marginAmount =
              regularSalePrice === null || purchaseUnitPrice === null ? null : regularSalePrice - purchaseUnitPrice;
            const marginPercent = computeMarginPercent(marginAmount, regularSalePrice);
            const showPromotionalPrice =
              promotionalPrice !== null &&
              regularPrice !== null &&
              promotionalPrice > 0 &&
              promotionalPrice < regularPrice;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => handleProductClick(product)}
              >
                {/* Imagen */}
                <div className="relative h-48 w-full bg-gradient-to-br from-[var(--gd-color-sprout)]/30 to-white overflow-hidden">
                  <ProductImageFallback
                    product={product}
                    image={imageUrl}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {typeof product.metadata?.stock === "number" && (
                    <div
                      className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold border ${
                        product.metadata.stock <= (product.metadata.minStock ?? 0)
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-white/80 text-[var(--gd-color-forest)] border-white/60"
                      }`}
                    >
                      Stock: {product.metadata.stock}
                    </div>
                  )}
                  {product.isFeatured && (
                    <div className="absolute top-3 right-3 bg-[var(--gd-color-leaf)] text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Destacado
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-[var(--gd-color-forest)] text-sm mb-1 line-clamp-1">
                      {product.name.es}
                    </h3>
                    {resolvedType === "box" && (
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--gd-color-forest)]/70">
                        Caja
                      </p>
                    )}
                    {resolvedType === "prepared" && isSaladProduct(product) && (
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--gd-color-forest)]/70">
                        Ensalada
                      </p>
                    )}
                    {product.sku && (
                      <p className="text-xs text-[var(--gd-color-text-muted)] font-mono">{product.sku}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-[var(--gd-color-forest)]">
                        {formatCatalogCurrency(regularSalePrice)}
                      </p>
                      {showPromotionalPrice && (
                        <p className="text-xs text-[var(--gd-color-text-muted)]">
                          Oferta: {formatCatalogCurrency(promotionalPrice)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border ${getStatusBadgeColor(
                        product.status || "inactive"
                      )}`}
                    >
                      {getStatusLabel(product.status || "inactive")}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/60 bg-white/55 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
                          Margen
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">
                          {formatCatalogCurrency(marginAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--gd-color-text-muted)]">
                          %
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--gd-color-forest)]">
                          {formatCatalogPercent(marginPercent)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1 text-[0.7rem] text-[var(--gd-color-text-muted)]">
                      {purchaseUnitPrice === null
                        ? "Falta costo de compra para calcular."
                        : `Costo fuente: ${formatCatalogCurrency(purchaseUnitPrice)}`}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--gd-color-leaf)]/10 hover:bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] font-medium text-sm transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    {isBoxProduct(product) ? (isBoxLoading ? "Cargando..." : "Editar") : "Editar"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="w-full max-w-lg rounded-3xl border border-white/60 bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--gd-color-forest)]">Nuevo producto</h3>
                  <p className="text-sm text-[var(--gd-color-text-muted)]">
                    Selecciona categoría y SKU antes de crear.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isCreating && setIsCreateModalOpen(false)}
                  className="rounded-xl p-2 text-[var(--gd-color-text-muted)] hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--gd-color-text-muted)]">
                    Categoría *
                  </label>
                  <select
                    value={newProductCategoryId}
                    onChange={(e) => setNewProductCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                    disabled={isCreating}
                  >
                    <option value="">Selecciona una categoría</option>
                    {normalizedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name.es}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--gd-color-text-muted)]">SKU *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProductSku}
                      onChange={(e) => setNewProductSku(e.target.value)}
                      placeholder="GD-VEGE-068"
                      className="flex-1 rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                      disabled={isCreating}
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateSku}
                      disabled={isCreating || !newProductCategoryId}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Auto-generar
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  disabled={isCreating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateProduct}
                  disabled={isCreating || !newProductCategoryId || !newProductSku.trim()}
                  className="rounded-xl bg-[var(--gd-color-leaf)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--gd-color-forest)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creando..." : "Crear"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer de edición */}
      <ProductEditDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        categories={categories}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />

      <BoxEditDrawer
        box={selectedBox}
        isOpen={isBoxDrawerOpen}
        onClose={handleCloseBoxDrawer}
        products={products}
        onBoxUpdated={handleBoxUpdated}
      />
    </div>
  );
}
