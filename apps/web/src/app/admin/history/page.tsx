"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import type { Box, Product } from "@/modules/catalog/types";

type CatalogHistoryEntry = {
  id: string;
  entityType: "product" | "box";
  entityId: string;
  actorEmail: string | null;
  actorUid: string | null;
  timestamp: string | null;
  before: Product | Box;
  after: Product | Box;
};

type StatusState = "idle" | "loading" | "ready" | "error";

function formatTimestamp(value: string | null, formatter: Intl.DateTimeFormat) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatter.format(date);
}

function getChangedFields(before: Product | Box, after: Product | Box) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];

  keys.forEach((key) => {
    const beforeValue = JSON.stringify(before[key as keyof typeof before]);
    const afterValue = JSON.stringify(after[key as keyof typeof after]);
    if (beforeValue !== afterValue) {
      changed.push(key);
    }
  });

  return changed.sort();
}

function HistoryEntryCard({ entry, formatter }: { entry: CatalogHistoryEntry; formatter: Intl.DateTimeFormat }) {
  const changedFields = useMemo(() => getChangedFields(entry.before, entry.after), [entry.after, entry.before]);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{entry.entityType === "product" ? "Producto" : "Caja"}</p>
          <h3 className="text-lg font-semibold text-slate-900">{entry.entityId}</h3>
          <p className="text-xs text-slate-500">
            {entry.actorEmail ? `Editado por ${entry.actorEmail}` : "Edición automática"}
          </p>
        </div>
        <p className="text-sm text-slate-500">{formatTimestamp(entry.timestamp, formatter)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {changedFields.length ? (
          changedFields.map((field) => (
            <span
              key={field}
              className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
            >
              {field}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Sin cambios detectados</span>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-green-700">Ver detalle</summary>
        <div className="mt-3 grid gap-4 text-xs text-slate-600 md:grid-cols-2">
          <pre className="rounded-2xl bg-slate-50 p-4">{JSON.stringify(entry.before, null, 2)}</pre>
          <pre className="rounded-2xl bg-slate-50 p-4">{JSON.stringify(entry.after, null, 2)}</pre>
        </div>
      </details>
    </article>
  );
}

function HistoryContent() {
  const [entries, setEntries] = useState<CatalogHistoryEntry[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-DO", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  const loadData = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const response = await adminFetch("/api/admin/catalog/history?limit=200", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo cargar el historial");
      }
      const json = (await response.json()) as { data: CatalogHistoryEntry[] };
      setEntries(Array.isArray(json.data) ? json.data : []);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Historial de cambios</h2>
          <p className="text-sm text-slate-600">
            Registra quién modificó cajas o productos y qué campos fueron actualizados. Se muestran los últimos 200 eventos.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700"
        >
          Refrescar
        </button>
      </div>

      {status === "loading" && <p className="text-sm text-slate-500">Cargando historial...</p>}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}

      {status === "ready" && (
        <div className="space-y-4">
          {entries.length === 0 && (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aún no hay registros en el historial.
            </p>
          )}
          {entries.map((entry) => (
            <HistoryEntryCard key={entry.id} entry={entry} formatter={formatter} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminHistoryPage() {
  return (
    <AdminGuard>
      <HistoryContent />
    </AdminGuard>
  );
}
