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

      // Importar dinámicamente para no romper SSR si fuera el caso, aunque es 'use client'
      const { getFirebaseFirestore } = await import("@/lib/firebase/client");
      const { collection, getDocs } = await import("firebase/firestore");
      const db = getFirebaseFirestore();

      // Fetch products directly
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

      // Fetch categories directly
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesData = categoriesSnapshot.docs.map(doc => doc.data()) as ProductCategory[];

      setProducts(productsData);
      setCategories(categoriesData);
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error inesperado al cargar de Firestore");
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
