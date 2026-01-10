"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { BoxManager } from "@/modules/admin/catalog/components/box-manager";
import type { Box } from "@/modules/catalog/types";

type StatusState = "idle" | "loading" | "ready" | "error";

function BoxesContent() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const response = await adminFetch("/api/admin/catalog/boxes", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("No se pudo cargar la lista de cajas");
      }

      const json = await response.json();
      setBoxes(Array.isArray(json.data) ? json.data : []);
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
          <h2 className="text-2xl font-semibold text-slate-900">Administrar cajas</h2>
          <p className="text-sm text-slate-600">
            Actualiza precios, descripciones, imágenes y duración estimada de cada caja personalizada.
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

      {status === "loading" && <p className="text-sm text-slate-500">Cargando cajas...</p>}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}

      {status === "ready" && <BoxManager initialBoxes={boxes} />}
    </section>
  );
}

export default function AdminBoxesPage() {
  return (
    <AdminGuard>
      <BoxesContent />
    </AdminGuard>
  );
}
