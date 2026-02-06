"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
  const [activity, setActivity] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        setError(null);

        const [summaryRes, metricsRes, activityRes] = await Promise.all([
          adminFetch("/api/admin/dashboard/summary", { cache: "no-store" }),
          adminFetch("/api/admin/dashboard/metrics", { cache: "no-store" }),
          adminFetch("/api/admin/dashboard/activity?limit=5", { cache: "no-store" }),
        ]);

        // Cargar ventas diarias
        const salesRes = await adminFetch("/api/admin/dashboard/daily-sales?days=7", { cache: "no-store" });
        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setFinanceData(salesData.data || []);
        }

        if (!summaryRes.ok || !metricsRes.ok || !activityRes.ok) {
          throw new Error("No se pudo cargar el resumen del catálogo");
        }

        const [{ data }, metricsJson, activityJson] = await Promise.all([
          summaryRes.json(),
          metricsRes.json(),
          activityRes.json(),
        ]);

        setCounts({
          productCount: data?.productCount ?? 0,
          boxCount: data?.boxCount ?? 0,
          requestCount: data?.requestCount ?? 0,
          pendingRequests: data?.pendingRequests ?? 0,
          lowStockCount: data?.lowStockCount ?? 0,
        });
        setMetrics({
          totalSalesMonth: metricsJson?.data?.totalSalesMonth ?? 0,
          pendingOrders: metricsJson?.data?.pendingOrders ?? 0,
          criticalSupplies: metricsJson?.data?.criticalSupplies ?? 0,
          newCustomers: metricsJson?.data?.newCustomers ?? 0,
        });
        setActivity(Array.isArray(activityJson?.data) ? activityJson.data : []);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
        setStatus("error");
      }
    }

    load();
  }, []);

  const totalRevenue = financeData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = financeData.reduce((sum, item) => sum + item.orders, 0);
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const maxSales = Math.max(...financeData.map((item) => item.sales), 1);

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Finance Overview</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Total ventas</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
              RD${totalRevenue.toLocaleString("es-DO")}
            </p>
          </div>
          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Ticket promedio</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
              RD${averageOrderValue.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Órdenes del mes</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
              {totalOrders}
            </p>
          </div>
          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Ventas promedio día</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
              RD${(totalRevenue / financeData.length).toLocaleString("es-DO", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Resumen de Ventas</h3>
            <span className="text-xs text-[var(--gd-color-text-muted)]">Últimos 7 días</span>
          </div>
          <div className="mt-6 grid grid-cols-7 items-end gap-3 h-40">
            {financeData.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-full rounded-xl bg-[var(--gd-color-leaf)]/15 flex items-end overflow-hidden">
                  <div
                    className="w-full rounded-xl bg-[var(--gd-color-forest)]"
                    style={{ height: `${(item.sales / maxSales) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--gd-color-text-muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Ventas del mes</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
            RD${metrics.totalSalesMonth.toLocaleString("es-DO")}
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Pedidos pendientes</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
            {metrics.pendingOrders}
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Insumos críticos</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
            {metrics.criticalSupplies}
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">Clientes nuevos</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
            {metrics.newCustomers}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-white to-green-50 p-6 shadow-soft">
        <div className="absolute right-0 top-0 h-32 w-32 opacity-10">
          <Image
            src="/assets/images/boxes/GD-CAJA-003.png"
            alt=""
            fill
            sizes="128px"
            priority
            className="object-cover"
            aria-hidden="true"
          />
        </div>
        <div className="relative">
          <h2 className="text-xl font-semibold text-slate-900">Resumen rápido</h2>
          <p className="mt-2 text-sm text-slate-600">
            Desde aquí puedes administrar el catálogo sin depender del Excel. Actualiza precios, descripciones e imágenes de
            productos y cajas.
          </p>

          {status === "loading" && <p className="mt-4 text-sm text-slate-500">Cargando métricas...</p>}
          {status === "error" && error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/products"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="absolute right-2 top-2 h-16 w-16 opacity-5 transition-opacity group-hover:opacity-10">
                <Image
                  src="/assets/images/products/placeholder.png"
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover rounded-lg"
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-500">Productos</p>
                <p className="text-3xl font-semibold text-slate-900">{counts.productCount}</p>
                <p className="mt-4 inline-flex text-sm font-semibold text-green-700 group-hover:underline">
                  Gestionar productos →
                </p>
              </div>
            </Link>
            <Link
              href="/admin/boxes"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="absolute right-2 top-2 h-16 w-16 opacity-5 transition-opacity group-hover:opacity-10">
                <Image
                  src="/assets/images/boxes/GD-CAJA-001.png"
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover rounded-lg"
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-500">Cajas</p>
                <p className="text-3xl font-semibold text-slate-900">{counts.boxCount}</p>
                <p className="mt-4 inline-flex text-sm font-semibold text-green-700 group-hover:underline">
                  Gestionar cajas →
                </p>
              </div>
            </Link>
            <Link
              href="/admin/requests"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="absolute right-2 top-2 h-16 w-16 opacity-5 transition-opacity group-hover:opacity-10">
                <Image
                  src="/assets/images/boxes/GD-CAJA-002.png"
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover rounded-lg"
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-500">Solicitudes Personalizadas</p>
                <p className="text-3xl font-semibold text-slate-900">{counts.requestCount}</p>
                <p className="text-xs text-slate-500">Pendientes: {counts.pendingRequests}</p>
                <p className="mt-4 inline-flex text-sm font-semibold text-green-700 group-hover:underline">
                  Revisar solicitudes →
                </p>
              </div>
            </Link>
            <Link
              href="/admin/supplies"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="relative">
                <p className="text-sm font-medium text-slate-500">Stock bajo</p>
                <p className="text-3xl font-semibold text-slate-900">{counts.lowStockCount}</p>
                <p className="mt-4 inline-flex text-sm font-semibold text-green-700 group-hover:underline">
                  Revisar insumos →
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-green-200 bg-green-50 p-6 text-sm text-green-900">
        <p className="font-semibold">Próximos pasos recomendados</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Habilitar autenticación obligatoria antes de desplegar el panel en producción.</li>
          <li>Agregar subida de imágenes a Firebase Storage o Cloudinary desde este panel.</li>
          <li>Sumar historial de cambios y control de versiones de precios.</li>
        </ul>
      </div>

      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">Actividad reciente</h3>
          <span className="text-xs text-[var(--gd-color-text-muted)]">Últimos 5 eventos</span>
        </div>
        {activity.length === 0 ? (
          <p className="text-sm text-[var(--gd-color-text-muted)]">Aún no hay actividad registrada.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/60 bg-white/50 p-3">
                <p className="text-sm font-medium text-[var(--gd-color-forest)]">
                  {entry?.message || entry?.type || entry?.entityType || "Actividad"}
                </p>
                <p className="text-xs text-[var(--gd-color-text-muted)]">
                  {entry?.timestamp?.toDate?.()?.toLocaleString("es-DO") ?? entry?.timestamp ?? "Sin fecha"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
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
