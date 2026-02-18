"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBasket,
} from "lucide-react";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";

type OriginType = "box_content" | "prepared_ingredient" | "direct_item";

type Origin = {
  type: OriginType;
  orderId: string;
  customerName: string;
  quantity: number;
  boxName?: string;
  variant?: string;
  preparedProduct?: string;
  liked?: boolean;
  disliked?: boolean;
};

type ShoppingItem = {
  id: string;
  type: "product" | "supply";
  name: string;
  category: string;
  totalQuantity: number;
  resolvedQuantity: number;
  pendingQuantity: number;
  isComplete: boolean;
  unit: string;
  estimatedPrice: number;
  estimatedTotal: number;
  orderCount: number;
  origins: Origin[];
};

type CategoryGroup = {
  category: string;
  items: ShoppingItem[];
};

type Summary = {
  totalOrders: number;
  totalProducts: number;
  estimatedCost: number;
  completedItems: number;
  pendingItems: number;
  totalRequiredUnits: number;
  totalResolvedUnits: number;
  breakdown: {
    fromBoxes: number;
    fromPrepared: number;
    fromDirect: number;
  };
};

type ConsolidatedShoppingResponse = {
  data: {
    items: ShoppingItem[];
    grouped: CategoryGroup[];
    summary: Summary;
  };
};

type StatusState = "idle" | "loading" | "ready" | "error";
type SourceFilter = "all" | "box" | "prepared" | "direct";
type ProgressFilter = "all" | "pending" | "complete";

const AUTO_REFRESH_MS = 10_000;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("es-DO", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

type ProgressPalette = {
  bar: string;
  track: string;
  text: string;
  badge: string;
};

function getProgressPalette(progress: number): ProgressPalette {
  if (progress >= 100) {
    return {
      bar: "bg-emerald-500",
      track: "bg-emerald-100",
      text: "text-emerald-700",
      badge: "border-emerald-300 bg-emerald-100 text-emerald-800",
    };
  }
  if (progress >= 70) {
    return {
      bar: "bg-lime-500",
      track: "bg-lime-100",
      text: "text-lime-700",
      badge: "border-lime-300 bg-lime-100 text-lime-800",
    };
  }
  if (progress >= 40) {
    return {
      bar: "bg-amber-500",
      track: "bg-amber-100",
      text: "text-amber-700",
      badge: "border-amber-300 bg-amber-100 text-amber-800",
    };
  }
  return {
    bar: "bg-rose-500",
    track: "bg-rose-100",
    text: "text-rose-700",
    badge: "border-rose-300 bg-rose-100 text-rose-800",
  };
}

function renderOriginLine(origin: Origin) {
  if (origin.type === "box_content") {
    return `${origin.quantity} und · caja "${origin.boxName ?? "Caja"} (${origin.variant ?? "Mix"})"`;
  }

  if (origin.type === "prepared_ingredient") {
    return `${origin.quantity} und · ingrediente para "${origin.preparedProduct ?? "Preparado"}"`;
  }

  const liked = origin.liked ? "❤️ " : "";
  const disliked = origin.disliked ? "💔 " : "";
  return `${origin.quantity} und · directo ${liked}${disliked}`;
}

function ShoppingContent() {
  const searchParams = useSearchParams();
  const orderFilter = searchParams.get("order")?.trim() || null;

  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ConsolidatedShoppingResponse["data"] | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");

  const loadData = useCallback(async () => {
    try {
      setStatus((prev) => (prev === "ready" ? "ready" : "loading"));
      setError(null);

      const response = await adminFetch("/api/admin/shopping/consolidated", { cache: "no-store" });
      const json = (await response.json()) as ConsolidatedShoppingResponse & { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "No se pudo cargar la lista consolidada.");
      }

      setPayload(json.data);
      setLastUpdatedAt(new Date());
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error inesperado.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadData();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const all = payload?.items || [];
    const normalizedSearch = search.trim().toLowerCase();

    return all.filter((item) => {
      if (orderFilter && !item.origins.some((origin) => origin.orderId === orderFilter)) {
        return false;
      }

      if (progressFilter === "complete" && !item.isComplete) return false;
      if (progressFilter === "pending" && item.isComplete) return false;

      if (sourceFilter !== "all") {
        const sourceType =
          sourceFilter === "box"
            ? "box_content"
            : sourceFilter === "prepared"
              ? "prepared_ingredient"
              : "direct_item";
        if (!item.origins.some((origin) => origin.type === sourceType)) {
          return false;
        }
      }

      if (!normalizedSearch) return true;
      const haystack = `${item.name} ${item.id} ${item.category}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [payload?.items, orderFilter, progressFilter, sourceFilter, search]);

  const grouped = useMemo<CategoryGroup[]>(() => {
    const groupedRecord = filteredItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
      const category = item.category || "Sin categoría";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});

    return Object.entries(groupedRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => {
          if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
          return a.name.localeCompare(b.name);
        }),
      }));
  }, [filteredItems]);

  const computedSummary = useMemo(() => {
    const estimatedCost = filteredItems.reduce((sum, item) => sum + item.estimatedTotal, 0);
    const totalRequiredUnits = filteredItems.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalResolvedUnits = filteredItems.reduce((sum, item) => sum + item.resolvedQuantity, 0);
    const completedItems = filteredItems.filter((item) => item.isComplete).length;
    const pendingItems = filteredItems.length - completedItems;

    const orderSet = new Set<string>();
    const breakdown = {
      fromBoxes: 0,
      fromPrepared: 0,
      fromDirect: 0,
    };

    filteredItems.forEach((item) => {
      item.origins.forEach((origin) => {
        orderSet.add(origin.orderId);
        if (origin.type === "box_content") breakdown.fromBoxes += origin.quantity;
        if (origin.type === "prepared_ingredient") breakdown.fromPrepared += origin.quantity;
        if (origin.type === "direct_item") breakdown.fromDirect += origin.quantity;
      });
    });

    return {
      totalOrders: orderFilter ? 1 : (payload?.summary?.totalOrders || orderSet.size),
      totalProducts: filteredItems.length,
      estimatedCost,
      completedItems,
      pendingItems,
      totalRequiredUnits,
      totalResolvedUnits,
      breakdown,
    } satisfies Summary;
  }, [filteredItems, orderFilter, payload?.summary?.totalOrders]);

  const progressPercent = useMemo(() => {
    if (!computedSummary.totalRequiredUnits) return 0;
    return Math.min(100, (computedSummary.totalResolvedUnits / computedSummary.totalRequiredUnits) * 100);
  }, [computedSummary.totalRequiredUnits, computedSummary.totalResolvedUnits]);
  const overallPalette = useMemo(() => getProgressPalette(progressPercent), [progressPercent]);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Preparación Pedidos</h1>
            <p className="text-sm text-slate-500">
              Vista consolidada para preparar pedidos en curso.
            </p>
            <p className="text-xs text-slate-400">Ultima actualizacion: {formatDateTime(lastUpdatedAt)}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        {orderFilter && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-900">Filtrando por pedido: #{orderFilter}</p>
                <p className="text-xs text-blue-700">Mostrando solo items de este pedido.</p>
              </div>
              <Link href="/admin/shopping" className="text-sm text-blue-700 underline hover:text-blue-900">
                Ver todos
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pedidos Activos</p>
            <p className="text-2xl font-bold text-slate-900">{computedSummary.totalOrders}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Items Consolidados</p>
            <p className="text-2xl font-bold text-slate-900">{computedSummary.totalProducts}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Costo Estimado</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(computedSummary.estimatedCost)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Estado</p>
            <p className="text-sm font-semibold text-slate-700">
              {computedSummary.completedItems} completos · {computedSummary.pendingItems} pendientes
            </p>
            <p className="text-xs text-slate-500">
              {computedSummary.totalResolvedUnits.toLocaleString("es-DO")} / {computedSummary.totalRequiredUnits.toLocaleString("es-DO")} unidades
            </p>
          </div>
          <div className="md:col-span-4">
            <div className={`h-2.5 w-full overflow-hidden rounded-full ${overallPalette.track}`}>
              <div className={`h-full rounded-full transition-all ${overallPalette.bar}`} style={{ width: `${progressPercent}%` }} />
            </div>
            <p className={`mt-1 text-xs font-semibold ${overallPalette.text}`}>{progressPercent.toFixed(1)}% completado</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs text-slate-500">Buscar</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nombre, SKU o categoria"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none"
                />
              </div>
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-500">Origen</span>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
              >
                <option value="all">Todos</option>
                <option value="box">Cajas</option>
                <option value="prepared">Elaborados</option>
                <option value="direct">Directos</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-500">Progreso</span>
              <select
                value={progressFilter}
                onChange={(event) => setProgressFilter(event.target.value as ProgressFilter)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="complete">Completos</option>
              </select>
            </label>
          </div>
        </div>

        {status === "loading" && !payload && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-16">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Cargando lista consolidada...</span>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">{error ?? "No se pudo cargar la información."}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        )}

        {status !== "error" && grouped.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <ShoppingBasket className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            No hay items para mostrar con los filtros actuales.
          </div>
        )}

        {grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map((group) => {
              const groupRequired = group.items.reduce((sum, item) => sum + item.totalQuantity, 0);
              const groupResolved = group.items.reduce((sum, item) => sum + item.resolvedQuantity, 0);
              const groupProgress = groupRequired > 0 ? (groupResolved / groupRequired) * 100 : 0;
              const groupPalette = getProgressPalette(groupProgress);
              const groupComplete = groupProgress >= 100;

              return (
                <section key={group.category} className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-slate-300 shadow-sm">
                    <div className="bg-slate-900 px-5 py-4">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-wide text-white">{group.category}</h3>
                          <p className="text-sm text-slate-200">
                            {group.items.length} productos · {formatQuantity(groupResolved)} / {formatQuantity(groupRequired)} unidades listas
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${groupPalette.badge}`}>
                            {groupComplete ? "COMPLETO" : "EN PROCESO"}
                          </span>
                          <p className={`mt-1 text-sm font-semibold ${groupPalette.text}`}>{groupProgress.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${groupPalette.track}`}>
                        <div className={`h-full rounded-full transition-all ${groupPalette.bar}`} style={{ width: `${Math.min(100, groupProgress)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const itemKey = `${item.type}-${item.id}`;
                      const isExpanded = Boolean(expanded[itemKey]);
                      const itemProgress = item.totalQuantity > 0 ? (item.resolvedQuantity / item.totalQuantity) * 100 : 0;
                      const itemPalette = getProgressPalette(itemProgress);

                      return (
                        <article key={itemKey} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={`/assets/images/products/${item.id}.png`}
                                alt={item.name}
                                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src = "/assets/images/products/placeholder.png";
                                }}
                              />
                              {item.isComplete ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                              ) : (
                                <CircleAlert className="mt-0.5 h-5 w-5 text-amber-500" />
                              )}
                              <div>
                                <h4 className="text-base font-semibold text-slate-900">
                                  {item.name} <span className="text-xs font-medium text-slate-500">({item.id})</span>
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Pedidos: {item.orderCount} · Costo estimado: {formatCurrency(item.estimatedTotal)}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleExpanded(itemKey)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              {isExpanded ? "Ocultar" : "Ver"} origenes
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Necesario</p>
                              <p className="text-xl font-black text-slate-900">
                                {formatQuantity(item.totalQuantity)} <span className="text-sm font-semibold">{item.unit}</span>
                              </p>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Resuelto</p>
                              <p className="text-xl font-black text-emerald-800">
                                {formatQuantity(item.resolvedQuantity)} <span className="text-sm font-semibold">{item.unit}</span>
                              </p>
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Pendiente</p>
                              <p className="text-xl font-black text-amber-800">
                                {formatQuantity(item.pendingQuantity)} <span className="text-sm font-semibold">{item.unit}</span>
                              </p>
                            </div>
                          </div>

                          <div className={`mt-3 h-2 overflow-hidden rounded-full ${itemPalette.track}`}>
                            <div className={`h-full rounded-full transition-all ${itemPalette.bar}`} style={{ width: `${Math.min(100, itemProgress)}%` }} />
                          </div>
                          <p className={`mt-1 text-xs font-semibold ${itemPalette.text}`}>{itemProgress.toFixed(1)}% completado</p>

                          {isExpanded && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Desglose por pedido</p>
                              <div className="space-y-2">
                                {item.origins.map((origin, index) => (
                                  <div key={`${itemKey}-${origin.orderId}-${index}`} className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
                                    <p>{renderOriginLine(origin)}</p>
                                    <Link
                                      href={`/admin/orders/${origin.orderId}`}
                                      className="text-xs font-semibold text-emerald-700 hover:underline"
                                    >
                                      Pedido #{origin.orderId.slice(0, 8)} · {origin.customerName}
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminShoppingPage() {
  return (
    <AdminGuard>
      <ShoppingContent />
    </AdminGuard>
  );
}
