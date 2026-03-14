"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Clock3 } from "lucide-react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";

type CountsState = {
  productCount: number;
  boxCount: number;
  requestCount: number;
  pendingRequests: number;
  lowStockCount: number;
};

type StatusState = "idle" | "loading" | "ready" | "error";

type MetricsState = {
  totalSalesMonth: number;
  pendingOrders: number;
  criticalSupplies: number;
  newCustomers: number;
};

type NotificationCounters = {
  newOrders24h: number;
  payments24h: number;
  newCustomers7d: number;
  pendingPreparation: number;
  pendingPayments: number;
  stockWarnings: number;
};

type NotificationItem = {
  id: string;
  type: "new_order" | "payment_received" | "new_customer" | "stock_warning";
  severity: "info" | "success" | "warning";
  title: string;
  message: string;
  timestamp: string;
  orderId?: string;
  customerId?: string;
};

type FinanceItem = {
  label: string;
  date: string;
  sales: number;
  orders: number;
};

type ActivityItem = {
  id: string;
  message?: string;
  type?: string;
  entityType?: string;
  timestamp?: unknown;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(rawValue?: string | null) {
  if (!rawValue) return "Sin fecha";
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString("es-DO");
}

function timestampToString(value: unknown) {
  if (!value) return "Sin fecha";
  const candidate = value as { toDate?: () => Date };
  if (typeof candidate?.toDate === "function") {
    return candidate.toDate().toLocaleString("es-DO");
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("es-DO");
    }
    return value;
  }
  return "Sin fecha";
}

function DashboardContent() {
  const [counts, setCounts] = useState<CountsState>({
    productCount: 0,
    boxCount: 0,
    requestCount: 0,
    pendingRequests: 0,
    lowStockCount: 0,
  });
  const [metrics, setMetrics] = useState<MetricsState>({
    totalSalesMonth: 0,
    pendingOrders: 0,
    criticalSupplies: 0,
    newCustomers: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationCounters, setNotificationCounters] = useState<NotificationCounters>({
    newOrders24h: 0,
    payments24h: 0,
    newCustomers7d: 0,
    pendingPreparation: 0,
    pendingPayments: 0,
    stockWarnings: 0,
  });
  const [lastNotificationRefresh, setLastNotificationRefresh] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [eventsExpanded, setEventsExpanded] = useState(true);
  const [financeData, setFinanceData] = useState<FinanceItem[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    const response = await adminFetch("/api/admin/dashboard/notifications", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar notificaciones");

    const json = await response.json();
    setNotifications(Array.isArray(json?.data?.notifications) ? json.data.notifications : []);
    setNotificationCounters({
      newOrders24h: json?.data?.counters?.newOrders24h ?? 0,
      payments24h: json?.data?.counters?.payments24h ?? 0,
      newCustomers7d: json?.data?.counters?.newCustomers7d ?? 0,
      pendingPreparation: json?.data?.counters?.pendingPreparation ?? 0,
      pendingPayments: json?.data?.counters?.pendingPayments ?? 0,
      stockWarnings: json?.data?.counters?.stockWarnings ?? 0,
    });
    setLastNotificationRefresh(new Date());
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const [summaryRes, metricsRes, activityRes, salesRes] = await Promise.all([
        adminFetch("/api/admin/dashboard/summary", { cache: "no-store" }),
        adminFetch("/api/admin/dashboard/metrics", { cache: "no-store" }),
        adminFetch("/api/admin/dashboard/activity?limit=8", { cache: "no-store" }),
        adminFetch("/api/admin/dashboard/daily-sales?days=7", { cache: "no-store" }),
      ]);

      if (!summaryRes.ok || !metricsRes.ok || !activityRes.ok || !salesRes.ok) {
        throw new Error("No se pudo cargar el dashboard");
      }

      const [summaryJson, metricsJson, activityJson, salesJson] = await Promise.all([
        summaryRes.json(),
        metricsRes.json(),
        activityRes.json(),
        salesRes.json(),
      ]);

      setCounts({
        productCount: summaryJson?.data?.productCount ?? 0,
        boxCount: summaryJson?.data?.boxCount ?? 0,
        requestCount: summaryJson?.data?.requestCount ?? 0,
        pendingRequests: summaryJson?.data?.pendingRequests ?? 0,
        lowStockCount: summaryJson?.data?.lowStockCount ?? 0,
      });

      setMetrics({
        totalSalesMonth: metricsJson?.data?.totalSalesMonth ?? 0,
        pendingOrders: metricsJson?.data?.pendingOrders ?? 0,
        criticalSupplies: metricsJson?.data?.criticalSupplies ?? 0,
        newCustomers: metricsJson?.data?.newCustomers ?? 0,
      });

      setActivity(Array.isArray(activityJson?.data) ? activityJson.data : []);
      setFinanceData(Array.isArray(salesJson?.data) ? salesJson.data : []);

      await loadNotifications();
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStatus("error");
    }
  }, [loadNotifications]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        await loadNotifications();
      } catch (notificationError) {
        console.error("Failed to refresh dashboard notifications", notificationError);
      }
    }, 20_000);

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const revenue7d = useMemo(() => financeData.reduce((sum, item) => sum + (item.sales || 0), 0), [financeData]);
  const orders7d = useMemo(() => financeData.reduce((sum, item) => sum + (item.orders || 0), 0), [financeData]);
  const avgTicket7d = orders7d > 0 ? revenue7d / orders7d : 0;
  const avgDay7d = financeData.length > 0 ? revenue7d / financeData.length : 0;
  const maxSales = useMemo(() => Math.max(...financeData.map((item) => item.sales || 0), 1), [financeData]);
  const currentDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-DO", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(currentTime),
    [currentTime],
  );
  const currentTimeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(currentTime),
    [currentTime],
  );

  const criticalCount =
    notificationCounters.pendingPreparation + notificationCounters.pendingPayments + notificationCounters.stockWarnings;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Operativo</h1>
            <p className="text-sm text-slate-600">
              Prioridad del dia: primero lo critico, luego operacion y finalmente mantenimiento.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Actualizado: {lastNotificationRefresh ? lastNotificationRefresh.toLocaleTimeString("es-DO") : "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock3 className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Dia y Hora</p>
            </div>
            <p className="mt-1 text-3xl font-black text-slate-900 tabular-nums">{currentTimeLabel}</p>
            <p className="text-xs font-medium text-slate-600">{currentDayLabel}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <h2 className="text-lg font-bold text-emerald-900">3) Dinero (Ultimos 7 dias)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Ventas 7 dias</p>
            <p className="mt-1 text-2xl font-black text-emerald-900">{formatCurrency(revenue7d)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Pedidos 7 dias</p>
            <p className="mt-1 text-2xl font-black text-emerald-900">{orders7d}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Ticket promedio 7 dias</p>
            <p className="mt-1 text-2xl font-black text-emerald-900">{formatCurrency(avgTicket7d)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Promedio diario</p>
            <p className="mt-1 text-2xl font-black text-emerald-900">{formatCurrency(avgDay7d)}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 transition-all duration-200 hover:shadow-md">
          <p className="mb-3 text-sm font-semibold text-emerald-900">Comportamiento de ventas por dia</p>
          <div className="grid h-44 grid-cols-7 items-end gap-2">
            {financeData.map((item) => (
              <div key={`${item.date}-${item.label}`} className="flex flex-col items-center gap-2">
                <div className="relative flex h-32 w-full items-end overflow-hidden rounded-lg bg-emerald-100">
                  <div
                    className="w-full rounded-lg bg-emerald-600"
                    style={{ height: `${((item.sales || 0) / maxSales) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-emerald-800">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-rose-900">1) Critico Ahora</h2>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
            {criticalCount} alertas
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/orders" className="rounded-2xl border border-amber-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-50 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-amber-700">Pendientes de preparar</p>
            <p className="mt-1 text-3xl font-black text-amber-900">{notificationCounters.pendingPreparation}</p>
            <p className="mt-2 text-xs font-semibold text-amber-800">Ir a pedidos</p>
          </Link>

          <Link href="/admin/supplies" className="rounded-2xl border border-orange-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-orange-700">Stock en riesgo</p>
            <p className="mt-1 text-3xl font-black text-orange-900">{notificationCounters.stockWarnings}</p>
            <p className="mt-2 text-xs font-semibold text-orange-800">Ir a insumos</p>
          </Link>

          <Link href="/admin/finances" className="rounded-2xl border border-rose-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-rose-700">Pagos pendientes</p>
            <p className="mt-1 text-3xl font-black text-rose-900">{notificationCounters.pendingPayments}</p>
            <p className="mt-2 text-xs font-semibold text-rose-800">Ir a finanzas</p>
          </Link>

          <Link href="/admin/orders" className="rounded-2xl border border-blue-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md">
            <p className="text-xs uppercase tracking-wide text-blue-700">Nuevos pedidos (24h)</p>
            <p className="mt-1 text-3xl font-black text-blue-900">{notificationCounters.newOrders24h}</p>
            <p className="mt-2 text-xs font-semibold text-blue-800">Revisar entradas</p>
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">2) Eventos Recientes</h2>
            <span className="text-xs text-slate-500">Notificaciones del sistema</span>
          </div>
          <button
            type="button"
            onClick={() => setEventsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100"
          >
            {eventsExpanded ? (
              <>
                Ocultar
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Mostrar
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {!eventsExpanded ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Seccion plegada. Hay {notifications.length} eventos recientes.
          </p>
        ) : notifications.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No hay eventos recientes.
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 8).map((notification) => (
              <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(notification.timestamp)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                {notification.orderId ? (
                  <Link href={`/admin/orders/${notification.orderId}`} className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:underline">
                    Abrir pedido #{notification.orderId.slice(0, 8)}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ventas del mes</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(metrics.totalSalesMonth)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Clientes nuevos del mes</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{metrics.newCustomers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pedidos en estado pending</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{metrics.pendingOrders}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Insumos criticos</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{metrics.criticalSupplies}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <h2 className="text-lg font-bold text-slate-900">4) Catalogo y Mantenimiento</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/products" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Productos</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{counts.productCount}</p>
          </Link>
          <Link href="/admin/boxes" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cajas</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{counts.boxCount}</p>
          </Link>
          <Link href="/admin/requests" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Solicitudes</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{counts.requestCount}</p>
            <p className="text-xs text-slate-500">Pendientes: {counts.pendingRequests}</p>
          </Link>
          <Link href="/admin/supplies" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Stock bajo</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{counts.lowStockCount}</p>
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">5) Actividad Tecnica</h2>
          <span className="text-xs text-slate-500">Ultimos 8 eventos</span>
        </div>
        {activity.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Aun no hay actividad registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  {entry.message || entry.type || entry.entityType || "Actividad"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{timestampToString(entry.timestamp)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {status === "loading" && (
        <p className="text-sm text-slate-500">Cargando dashboard...</p>
      )}
      {status === "error" && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </section>
  );
}

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
