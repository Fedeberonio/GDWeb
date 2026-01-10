"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import type { Order, OrderStatus } from "@/modules/orders/types";

type StatusState = "idle" | "loading" | "ready" | "error";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "in_transit",
  "delivered",
  "cancelled",
];

function formatCurrency(amount: number, currency = "DOP") {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);
      const response = await adminFetch("/api/admin/orders?limit=100", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudieron cargar los pedidos");
      }
      setOrders(Array.isArray(json.data) ? json.data : []);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo actualizar el pedido");
      }
      setOrders((prev) => prev.map((order) => (order.id === orderId ? json.data : order)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.totals.total.amount, 0),
    [orders],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Pedidos</h2>
          <p className="text-sm text-slate-600">Monitorea pedidos recientes y cambia su estado en tiempo real.</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Ingresos totales</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {status === "loading" && <p className="text-sm text-slate-500">Cargando pedidos...</p>}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}

      {status === "ready" && (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pedido #{order.id}</p>
                  <p className="text-sm text-slate-500">
                    {order.delivery.address.contactName} · {order.guestEmail ?? order.delivery.address.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.totals.total.amount)}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
              </header>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entrega</p>
                  <p className="text-sm text-slate-700">
                    {order.delivery.address.city}, {order.delivery.address.zone}
                  </p>
                  {order.delivery.window && (
                    <p className="text-xs text-slate-500">
                      {order.delivery.window.day} · {order.delivery.window.slot ?? "Horario flexible"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</p>
                  <select
                    value={order.status}
                    onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
                    disabled={updatingOrderId === order.id}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumen</p>
                <ul className="mt-2 space-y-1">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.name.es} · {formatCurrency(item.unitPrice.amount)}
                    </li>
                  ))}
                  {order.items.length > 3 && (
                    <li className="text-xs text-slate-500">+ {order.items.length - 3} ítems adicionales</li>
                  )}
                </ul>
              </div>
            </article>
          ))}
          {!orders.length && (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Todavía no hay pedidos registrados.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <OrdersContent />
    </AdminGuard>
  );
}
