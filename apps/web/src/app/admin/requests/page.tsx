"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import type { BoxBuilderRequest, BoxBuilderRequestStatus } from "@/modules/box-builder/types";

const STATUS_OPTIONS: BoxBuilderRequestStatus[] = ["pending", "confirmed", "cancelled"];

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha inválida"
    : new Intl.DateTimeFormat("es-DO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function RequestsContent() {
  const [requests, setRequests] = useState<BoxBuilderRequest[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);
      const response = await adminFetch("/api/admin/box-builder/requests?limit=100", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudieron cargar las solicitudes");
      }
      setRequests(Array.isArray(json.data) ? json.data : []);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const totalPending = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );

  const handleStatusChange = useCallback(async (requestId: string, nextStatus: BoxBuilderRequestStatus) => {
    setUpdatingId(requestId);
    try {
      const response = await adminFetch(`/api/admin/box-builder/requests/${requestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo actualizar la solicitud");
      }
      setRequests((prev) => prev.map((request) => (request.id === requestId ? json.data : request)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setUpdatingId(null);
    }
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Solicitudes de cajas personalizadas</h2>
            <p className="text-sm text-slate-600">
              Revisa las solicitudes del builder, ajusta su estado y mantén al equipo informado.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pendientes</p>
            <p className="text-3xl font-semibold text-slate-900">{totalPending}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={loadRequests}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700"
          >
            Refrescar
          </button>
          {status === "loading" && <span className="text-xs text-slate-500">Actualizando...</span>}
        </div>
      </div>

      {status === "loading" && <p className="text-sm text-slate-500">Cargando solicitudes...</p>}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}

      {status === "ready" && (
        <div className="space-y-4">
          {requests.length === 0 && (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aún no hay solicitudes registradas.
            </p>
          )}
          {requests.map((request) => (
            <article key={request.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Solicitud #{request.id}</p>
                  <p className="text-lg font-semibold text-slate-900">{request.contactName}</p>
                  <p className="text-xs text-slate-500">
                    {request.contactEmail ?? "Email no proporcionado"} · {request.contactPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Creada {formatDate(request.createdAt)}</p>
                  <select
                    value={request.status}
                    onChange={(event) => handleStatusChange(request.id, event.target.value as BoxBuilderRequestStatus)}
                    disabled={updatingId === request.id}
                    className="mt-1 rounded-2xl border border-slate-200 px-3 py-1 text-sm focus:border-green-500 focus:outline-none disabled:opacity-70"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Caja</p>
                  <p className="text-base font-semibold text-slate-900">{request.boxId}</p>
                  <p>{request.metrics.productCount} productos · RD${request.metrics.costEstimate.toFixed(2)}</p>
                  <p>{request.metrics.slotsUsed}/{request.metrics.slotBudget ?? "∞"} slots · {request.metrics.weightUsedKg.toFixed(1)} kg</p>
                </div>
                <div className="space-y-1">
                  {request.mix && (
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">Mix:</span> {request.mix}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Entrega:</span>{" "}
                    {request.deliveryZone ?? "Sin zona"} · {request.deliveryDay ?? "Sin día"}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Likes:</span> {request.likes.join(", ") || "—"}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Dislikes:</span>{" "}
                    {request.dislikes.join(", ") || "—"}
                  </p>
                  {request.notes && (
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">Notas:</span> {request.notes}
                    </p>
                  )}
                </div>
              </div>

              <details className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                <summary className="cursor-pointer font-semibold text-slate-900">Ver selección</summary>
                <ul className="mt-3 space-y-1">
                  {Object.entries(request.selection)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([slug, quantity]) => (
                      <li key={slug}>
                        {slug} · x{quantity}
                      </li>
                    ))}
                  {!Object.values(request.selection).some((quantity) => quantity > 0) && (
                    <li className="text-xs text-slate-500">Sin productos registrados</li>
                  )}
                </ul>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminRequestsPage() {
  return (
    <AdminGuard>
      <RequestsContent />
    </AdminGuard>
  );
}
