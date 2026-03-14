"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Clock, Calendar, Truck, CheckCircle2, AlertCircle, XCircle, Package, ArrowRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import type { Order, OrderStatus } from "@/modules/orders/types";

type StatusState = "idle" | "loading" | "ready" | "error";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "NUEVO", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
  preparing: { label: "Preparando", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Package },
  ready: { label: "Listo", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  in_transit: { label: "En Ruta", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Truck },
  delivered: { label: "Entregado", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-50 text-red-600 border-red-100", icon: XCircle },
};

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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar este pedido permanentemente?")) return;

    try {
      const response = await adminFetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      toast.success("Pedido eliminado");
      setOrders(prev => prev.filter(o => o.id !== order.id));
    } catch {
      toast.error("Error al eliminar");
    }
  };

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.status !== 'cancelled' ? order.totals.total.amount : 0), 0),
    [orders],
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 font-sans pb-32">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Pedidos</h1>
          <p className="text-slate-500 mt-2 text-lg">Administra las órdenes entrantes y su logística.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Link
            href="/admin/orders/create"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Crear Pedido
          </Link>
          <div className="bg-white rounded-2xl px-8 py-4 shadow-sm border border-slate-100 flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Ingresos Totales</span>
            <span className="text-3xl font-black text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center p-20 opacity-50">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-slate-500 font-medium">Cargando pedidos...</span>
        </div>
      )}

      {status === "ready" && (
        <div className="grid gap-5">
          <AnimatePresence>
            {orders.map((order) => {
              const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusInfo.icon;
              const isPending = order.status === "pending";
              const stockWarningCount = order.stockValidation?.hasInsufficientStock
                ? order.stockValidation.items.length
                : 0;
              const hasStockWarning = stockWarningCount > 0;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  whileHover={{ y: -2, shadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className={`group relative bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden p-0 flex flex-col md:flex-row shadow-sm ${isPending ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'border-slate-100 hover:border-emerald-200'}`}
                >

                  {/* Left Indicator Strip */}
                  <div className={`h-2 md:h-auto md:w-3 flex-shrink-0 ${isPending ? 'bg-emerald-500' :
                    order.status === 'confirmed' ? 'bg-blue-500' :
                      order.status === 'cancelled' ? 'bg-slate-200' : 'bg-emerald-200'}`}
                  />

                  <div className="flex-1 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">

                    {/* Customer & ID */}
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${isPending ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {order.delivery.address.contactName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg group-hover:text-emerald-700 transition-colors">
                            {order.delivery.address.contactName}
                          </h3>
                          <p className="text-xs font-mono text-slate-400">Order #{order.id.slice(0, 8)}</p>
                          {hasStockWarning && (
                            <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              <AlertCircle className="h-3 w-3" />
                              Stock insuficiente ({stockWarningCount})
                            </p>
                          )}
                        </div>
                        {isPending && (
                          <span className="relative flex h-3 w-3 ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Pills */}
                    <div className="flex flex-wrap gap-4 md:gap-8 items-center text-sm text-slate-500 flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        <div className="flex flex-col leading-none gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fecha</span>
                          <span className="font-medium text-slate-700">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-300" />
                        <div className="flex flex-col leading-none gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Entrega</span>
                          <span className="font-medium text-slate-700">{order.delivery.address.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mb-1 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                        <div className="text-lg font-bold text-slate-900">{formatCurrency(order.totals.total.amount)}</div>
                      </div>

                      <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                        <button
                          onClick={(e) => handleDelete(e, order)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="p-3 text-emerald-600 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <OrdersContent />
    </AdminGuard>
  );
}
