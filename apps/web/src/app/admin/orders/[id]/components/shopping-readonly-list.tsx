"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChefHat, Loader2, Package, ShoppingBag } from "lucide-react";

import { adminFetch } from "@/modules/admin/api/client";

type SourceType = "box" | "prepared" | "direct";

type ShoppingItem = {
  id: string;
  name: string;
  estimated_price: number;
  quantity: number;
  unit?: string;
  category?: string;
  source_type: SourceType;
  box_name?: string;
  box_variant?: string;
  prepared_product?: string;
};

type ShoppingReadonlyListProps = {
  orderId: string;
};

type StatusState = "idle" | "loading" | "ready" | "error";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ShoppingReadonlyList({ orderId }: ShoppingReadonlyListProps) {
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadList() {
      setStatus("loading");
      setError(null);
      try {
        const res = await adminFetch(`/api/admin/orders/${orderId}/shopping-list`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error ?? "No se pudo cargar la lista del pedido.");
        }
        if (!isMounted) return;
        setItems(Array.isArray(json.data) ? json.data : []);
        setStatus("ready");
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error inesperado.");
        setStatus("error");
      }
    }

    loadList();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const grouped = useMemo(() => {
    const boxes: Record<string, ShoppingItem[]> = {};
    const prepared: Record<string, ShoppingItem[]> = {};
    const direct: ShoppingItem[] = [];

    items.forEach((item) => {
      if (item.source_type === "box") {
        const boxName = item.box_name?.trim() || "Caja sin nombre";
        const boxVariant = item.box_variant?.trim() || "mix";
        const key = `${boxName} - ${boxVariant}`;
        if (!boxes[key]) boxes[key] = [];
        boxes[key].push(item);
      } else if (item.source_type === "prepared") {
        const key = item.prepared_product?.trim() || "Preparado";
        if (!prepared[key]) prepared[key] = [];
        prepared[key].push(item);
      } else {
        direct.push(item);
      }
    });

    Object.values(boxes).forEach((groupItems) => groupItems.sort((a, b) => a.name.localeCompare(b.name)));
    Object.values(prepared).forEach((groupItems) => groupItems.sort((a, b) => a.name.localeCompare(b.name)));
    direct.sort((a, b) => a.name.localeCompare(b.name));

    return { boxes, prepared, direct };
  }, [items]);

  const hasData =
    Object.keys(grouped.boxes).length > 0 ||
    Object.keys(grouped.prepared).length > 0 ||
    grouped.direct.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-900">Vista de solo lectura para este pedido</p>
          <p className="text-xs text-emerald-800">Aqui ves el detalle de productos expandidos para este pedido individual.</p>
        </div>
        <Link
          href={`/admin/shopping?order=${orderId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Ir a Lista de Compras para este Pedido
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando lista...
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "No se pudo cargar la lista."}
        </div>
      )}

      {status === "ready" && !hasData && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No hay items para este pedido.
        </div>
      )}

      {status === "ready" && hasData && (
        <div className="space-y-5">
          {Object.keys(grouped.boxes).length > 0 && (
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Package className="h-5 w-5 text-emerald-600" />
                CAJAS
              </h3>

              {Object.entries(grouped.boxes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([boxName, boxItems]) => (
                  <div key={boxName} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
                      <h4 className="font-semibold text-emerald-900">{boxName}</h4>
                    </div>
                    <div className="space-y-3 p-4">
                      {boxItems.map((item, index) => (
                        <div key={`${item.id}-box-${index}`} className="flex items-center gap-3">
                          <img
                            src={`/assets/images/products/${item.id}.png`}
                            alt={item.name}
                            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                            onError={(event) => {
                              event.currentTarget.src = "/assets/images/products/placeholder.png";
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-600">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            {formatCurrency(item.estimated_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>
          )}

          {Object.keys(grouped.prepared).length > 0 && (
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <ChefHat className="h-5 w-5 text-amber-600" />
                PRODUCTOS PREPARADOS
              </h3>

              {Object.entries(grouped.prepared)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([preparedName, preparedItems]) => (
                  <div key={preparedName} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
                      <h4 className="font-semibold text-amber-900">Ingredientes para: {preparedName}</h4>
                    </div>
                    <div className="space-y-3 p-4">
                      {preparedItems.map((item, index) => (
                        <div key={`${item.id}-prepared-${index}`} className="flex items-center gap-3">
                          <img
                            src={`/assets/images/products/${item.id}.png`}
                            alt={item.name}
                            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                            onError={(event) => {
                              event.currentTarget.src = "/assets/images/products/placeholder.png";
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-600">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            {formatCurrency(item.estimated_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </section>
          )}

          {grouped.direct.length > 0 && (
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                A LA CARTA
              </h3>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                {grouped.direct.map((item, index) => (
                  <div key={`${item.id}-direct-${index}`} className="flex items-center gap-3">
                    <img
                      src={`/assets/images/products/${item.id}.png`}
                      alt={item.name}
                      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "/assets/images/products/placeholder.png";
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatCurrency(item.estimated_price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
