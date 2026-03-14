"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { BoxGridManager } from "@/modules/admin/catalog/components/box-grid-manager";
import type { Box, Product } from "@/modules/catalog/types";

type StatusState = "idle" | "loading" | "ready" | "error";

function BoxesContent() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const [boxesRes, productsRes] = await Promise.all([
        adminFetch("/api/admin/catalog/boxes", { cache: "no-store" }),
        adminFetch("/api/admin/catalog/products", { cache: "no-store" }),
      ]);

      if (!boxesRes.ok || !productsRes.ok) {
        throw new Error("No se pudo cargar la lista de cajas y productos");
      }

      const [boxesJson, productsJson] = await Promise.all([
        boxesRes.json(),
        productsRes.json(),
      ]);

      const rawBoxes = Array.isArray(boxesJson.data) ? boxesJson.data : [];
      const rawProducts = Array.isArray(productsJson.data) ? productsJson.data : [];
      const filteredProducts = rawProducts.filter((product: Product) => {
        const productKey = (product.sku ?? product.id ?? "").toUpperCase();
        const categoryId = (product.categoryId ?? "").toLowerCase();
        return categoryId !== "cajas" && !productKey.startsWith("GD-CAJA-");
      });

      setBoxes(rawBoxes);
      setProducts(filteredProducts);
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
          <p className="text-sm text-[var(--gd-color-text-muted)]">Cargando cajas...</p>
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

  return <BoxGridManager initialBoxes={boxes} products={products} />;
}

export default function AdminBoxesPage() {
  return (
    <AdminGuard>
      <BoxesContent />
    </AdminGuard>
  );
}
