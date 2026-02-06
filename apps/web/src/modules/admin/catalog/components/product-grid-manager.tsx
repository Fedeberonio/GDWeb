"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Search, Filter, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { adminFetch } from "@/modules/admin/api/client";
import { ProductImageFallback } from "@/app/_components/product-image-fallback";
import type { Box, Product, ProductCategory } from "@/modules/catalog/types";
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

  const createSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const handleCreateProduct = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const baseName = "Nuevo producto";
      const payload: Partial<Product> = {
        sku: "",
        slug: `${createSlug(baseName)}-${timestamp}`,
        name: { es: baseName, en: "New product" },
        description: { es: "", en: "" },
        unit: "",
        isActive: false,
        price: 0,
        status: "inactive",
        categoryId: "",
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
      onProductCreated?.(created);
      toast.success("Producto creado");
    } catch (error) {
      console.error("Error creando producto:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo crear el producto");
    }
  }, [onProductCreated]);

  const isBoxProduct = useCallback((product: Product) => {
    const sku = product.sku ?? product.id ?? "";
    const id = product.id ?? "";
    const category = product.categoryId ?? "";
    return category === "cajas" || /^GD-CAJA-/i.test(sku) || /^GD-CAJA-/i.test(id);
  }, []);

  const isComboProduct = useCallback((product: Product) => {
    const sku = product.sku ?? product.id ?? "";
    const id = product.id ?? "";
    const category = product.categoryId ?? "";
    const normalizedCategory = category.toLowerCase();
    return (
      normalizedCategory.includes("combo") ||
      /^GD-COMB-/i.test(sku) ||
      /^GD-COMB-/i.test(id) ||
      /^COMBO-/i.test(sku) ||
      /^COMBO-/i.test(id)
    );
  }, []);

  const resolveItemType = useCallback(
    (product: Product) => {
      if (product.type === "product" || product.type === "box" || product.type === "combo") {
        return product.type;
      }
      if (isBoxProduct(product)) return "box";
      if (isComboProduct(product)) return "combo";
      return "product";
    },
    [isBoxProduct, isComboProduct],
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
        (categoryFilter === "combos" &&
          (resolvedType === "combo" || (product.categoryId ?? "").toLowerCase().includes("combo")));

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
        return {
          ...product,
          name: updatedBox.name,
          description: updatedBox.description,
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
              onClick={handleCreateProduct}
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
                <option value="cajas">Cajas</option>
                <option value="combos">Combos</option>
                {categories.map((cat) => (
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
                : resolvedType === "combo"
                  ? "/assets/images/combos"
                  : "/assets/images/products";
            const imageKey = product.sku ?? product.id;
            const imageUrl = product.image || (imageKey ? `${imageBase}/${imageKey}.png` : "");
            const priceText =
              typeof product.price === "number" ? `${product.price.toLocaleString("es-DO")} DOP` : "Precio N/D";
            const salePriceText =
              typeof product.salePrice === "number"
                ? `${product.salePrice.toLocaleString("es-DO")} DOP`
                : null;

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
                    {resolvedType === "combo" && (
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--gd-color-forest)]/70">
                        Combo
                      </p>
                    )}
                    {product.sku && (
                      <p className="text-xs text-[var(--gd-color-text-muted)] font-mono">{product.sku}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-[var(--gd-color-forest)]">{priceText}</p>
                      {salePriceText && (
                        <p className="text-xs text-[var(--gd-color-text-muted)] line-through">{salePriceText}</p>
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
