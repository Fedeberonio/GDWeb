"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { ProductManager } from "@/modules/admin/catalog/components/product-manager";
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
        fetch("/api/catalog/categories", { cache: "force-cache" }),
      ]);

      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error("No se pudieron cargar los datos del catálogo");
      }

      const [productsJson, categoriesJson] = await Promise.all([productsRes.json(), categoriesRes.json()]);

      setProducts(Array.isArray(productsJson.data) ? productsJson.data : []);
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

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Administrar productos</h2>
          <p className="text-sm text-slate-600">
            Actualiza precios, descripciones, imágenes y estado sin depender del Excel. Cada cambio se guarda
            directamente en Firebase.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700"
        >
          Refrescar datos
        </button>
      </div>

      {status === "loading" && <p className="text-sm text-slate-500">Cargando productos...</p>}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}

      {status === "ready" && (
        <ProductManager
          initialProducts={products}
          categories={categories}
          onProductCreated={handleProductCreated}
        />
      )}
    </section>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <ProductsContent />
    </AdminGuard>
  );
}
