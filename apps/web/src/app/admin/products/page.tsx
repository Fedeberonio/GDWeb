"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { ProductGridManager } from "@/modules/admin/catalog/components/product-grid-manager";
import type { Product, ProductCategory } from "@/modules/catalog/types";

type StatusState = "idle" | "loading" | "ready" | "error";

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleProductCreated = useCallback((product: Product) => {
    setProducts((prev) => [...prev, product]);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const [productsRes, categoriesRes] = await Promise.all([
        adminFetch("/api/admin/catalog/products", { cache: "no-store" }),
        fetch("/api/catalog/categories", { cache: "no-store" }),
      ]);

      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error("No se pudieron cargar los datos del catálogo");
      }

      const [productsJson, categoriesJson] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
      ]);

      const rawProducts = Array.isArray(productsJson.data) ? productsJson.data : [];
      setProducts(rawProducts);
      setCategories(Array.isArray(categoriesJson.data) ? categoriesJson.data : []);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--gd-color-leaf)] mx-auto" />
          <p className="text-sm text-[var(--gd-color-text-muted)]">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-red-200 bg-red-50 text-center">
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-6 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <ProductGridManager
      initialProducts={products}
      categories={categories}
      onProductCreated={handleProductCreated}
    />
  );
}

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <ProductsContent />
    </AdminGuard>
  );
}
