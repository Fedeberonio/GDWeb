"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { ComboManager } from "@/modules/admin/catalog/components/combo-manager";
import type { Combo } from "@/modules/catalog/types";

type StatusState = "idle" | "loading" | "ready" | "error";

function CombosContent() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const combosRes = await adminFetch("/api/admin/catalog/combos", { cache: "no-store" });

      if (!combosRes.ok) {
        throw new Error("No se pudieron cargar los combos");
      }

      const combosJson = await combosRes.json();

      setCombos(Array.isArray(combosJson.data) ? combosJson.data : []);
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
          <h2 className="text-2xl font-semibold text-slate-900">Administrar Combos de Almuerzo</h2>
          <p className="text-sm text-slate-600">
            Actualiza nombres, descripciones, precios, información nutricional e imágenes de los combos. Cada cambio se
            guarda directamente en Firebase.
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

      {status === "loading" && <p className="text-sm text-slate-500">Cargando combos...</p>}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}

      {status === "ready" && <ComboManager initialCombos={combos} />}
    </section>
  );
}

export default function AdminCombosPage() {
  return (
    <AdminGuard>
      <CombosContent />
    </AdminGuard>
  );
}
