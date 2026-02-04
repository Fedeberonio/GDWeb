"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { BoxRulesManager } from "@/modules/admin/catalog/components/box-rules-manager";
import type { BoxRule, ProductCategory, Product } from "@/modules/catalog/types";

type StatusState = "idle" | "loading" | "ready" | "error";

function BoxRulesContent() {
  const [rules, setRules] = useState<BoxRule[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const [rulesRes, catsRes, prodsRes] = await Promise.all([
        adminFetch("/api/admin/catalog/box-rules", { cache: "no-store" }),
        adminFetch("/api/catalog/categories", { cache: "no-store" }),
        adminFetch("/api/catalog/products", { cache: "no-store" }),
      ]);

      if (!rulesRes.ok || !catsRes.ok || !prodsRes.ok) {
        throw new Error("No se pudo cargar la data completa");
      }

      const [rulesJson, catsJson, prodsJson] = await Promise.all([
        rulesRes.json(),
        catsRes.json(),
        prodsRes.json(),
      ]);

      setRules(Array.isArray(rulesJson.data) ? rulesJson.data : []);
      setCategories(Array.isArray(catsJson.data) ? catsJson.data : []);
      setProducts(Array.isArray(prodsJson.data) ? prodsJson.data : []);
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
          <h2 className="text-2xl font-semibold text-slate-900">Reglas de cajas</h2>
          <p className="text-sm text-slate-600">
            Edita el presupuesto de slots, pesos y contenido base por caja.
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

      {status === "loading" && <p className="text-sm text-slate-500">Cargando reglas...</p>}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}

      {status === "ready" && (
        <BoxRulesManager
          initialRules={rules}
          categories={categories}
          products={products}
        />
      )}
    </section>
  );
}

export default function AdminBoxRulesPage() {
  return (
    <AdminGuard>
      <BoxRulesContent />
    </AdminGuard>
  );
}
