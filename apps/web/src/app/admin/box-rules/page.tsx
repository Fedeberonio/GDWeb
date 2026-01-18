"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { BoxRulesManager } from "@/modules/admin/catalog/components/box-rules-manager";
import type { BoxRule } from "@/modules/catalog/types";

type StatusState = "idle" | "loading" | "ready" | "error";

function BoxRulesContent() {
  const [rules, setRules] = useState<BoxRule[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const response = await adminFetch("/api/admin/catalog/box-rules", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("No se pudo cargar la lista de reglas");
      }

      const json = await response.json();
      setRules(Array.isArray(json.data) ? json.data : []);
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

      {status === "ready" && <BoxRulesManager initialRules={rules} />}
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
