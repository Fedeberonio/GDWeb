// @ts-nocheck
"use client";

import { useState, useCallback, useEffect } from "react";
import type { ComponentType, ReactNode } from "react";
import { OrderDocumentPDF } from "./invoice-pdf";
import dynamic from "next/dynamic";
import { FileDown, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

import { adminFetch } from "@/modules/admin/api/client";
import type { Order } from "@/modules/orders/types";

const BlobProvider = dynamic(() => import("@react-pdf/renderer").then(mod => mod.BlobProvider), {
  ssr: false,
  loading: () => <span>...</span>
});

type InvoiceGeneratorProps = {
  orderId: string | null;
  onOrderSelect: (orderId: string) => void;
};

import { type OrderStatus } from "@/modules/orders/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  in_transit: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};



export function InvoiceGenerator({ orderId, onOrderSelect }: InvoiceGeneratorProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid'>('all');

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    } else {
      loadRecentOrders();
    }
  }, [orderId]);

  const loadOrder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await adminFetch(`/api/admin/orders/${id}`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
      }
    } catch (err) {
      console.error("Error cargando pedido:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentOrders = useCallback(async () => {
    try {
      const response = await adminFetch("/api/admin/orders?limit=10", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setRecentOrders(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error("Error cargando pedidos recientes:", err);
    }
  }, []);

  const filteredOrders = recentOrders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.delivery.address.contactName.toLowerCase().includes(searchQuery.toLowerCase());

    const isPaid = o.paymentStatus === "paid";
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "paid"
          ? isPaid
          : !isPaid; // unpaid or undefined

    return matchesSearch && matchesTab;
  });

  if (order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[order.status as OrderStatus] || "bg-gray-100 text-gray-800"}`}>
                {STATUS_LABELS[order.status as OrderStatus] || order.status}
              </span>
              <p className="font-medium text-[var(--gd-color-forest)]">Pedido #{order.id}</p>
              {/* Payment Badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${order.paymentStatus === 'paid'
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}>
                {order.paymentStatus === 'paid' ? "PAGADO" : "PENDIENTE"}
              </span>
            </div>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              {order.delivery.address.contactName} - {formatCurrency(order.totals.total.amount)}
            </p>
          </div>
          <div className="flex gap-2">
            {/* View Order / PO - Highlighted if Unpaid */}
            <BlobProvider document={<OrderDocumentPDF order={order} type="purchase_order" />}>
              {({ url, loading }) => (
                <button
                  onClick={() => url && window.open(url, "_blank")}
                  disabled={loading}
                  className={`px-3 py-2 rounded-xl border font-medium text-xs transition-colors flex items-center gap-2 ${order.paymentStatus !== 'paid'
                      ? "bg-[var(--gd-color-leaf)] text-white border-[var(--gd-color-leaf)] hover:bg-[var(--gd-color-forest)]"
                      : "border-[var(--gd-color-leaf)] text-[var(--gd-color-leaf)] hover:bg-[var(--gd-color-leaf)]/10"
                    }`}
                >
                  {loading ? "..." : "Orden de Compra"}
                </button>
              )}
            </BlobProvider>

            {/* View Invoice - Highlighted if Paid */}
            <BlobProvider document={<OrderDocumentPDF order={order} type="invoice" />}>
              {({ url, loading }) => (
                <button
                  onClick={() => url && window.open(url, "_blank")}
                  disabled={loading}
                  className={`px-3 py-2 rounded-xl border font-medium text-xs transition-colors flex items-center gap-2 ${order.paymentStatus === 'paid'
                      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      : "bg-gray-100 text-gray-400 border-gray-200" // Less prominent if not paid
                    }`}
                >
                  <FileDown className="h-3 w-3" />
                  {loading ? "..." : "Factura"}
                </button>
              )}
            </BlobProvider>

            <Link
              href={`/admin/orders/${order.id}`}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium text-xs hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              Ir al Pedido
            </Link>
          </div>
        </div>
        <button
          onClick={() => {
            setOrder(null);
            onOrderSelect("");
          }}
          className="text-sm text-[var(--gd-color-text-muted)] hover:text-[var(--gd-color-forest)]"
        >
          ← Seleccionar otro pedido
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {([
          { id: 'all', label: 'Todos' },
          { id: 'unpaid', label: 'Por Cobrar' },
          { id: 'paid', label: 'Cobrados' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
              ? "bg-white text-[var(--gd-color-forest)] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--gd-color-text-muted)]" />
        <input
          type="text"
          placeholder="Buscar pedido..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredOrders.map((o) => (
          <button
            key={o.id}
            onClick={() => onOrderSelect(o.id)}
            className="w-full text-left p-3 rounded-xl border border-white/60 bg-white/30 hover:bg-white/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <p className="font-medium text-sm text-[var(--gd-color-forest)]">#{o.id.slice(0, 8)}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[o.status as OrderStatus] || "bg-gray-100 text-gray-800"}`}>
                    {STATUS_LABELS[o.status as OrderStatus] || o.status}
                  </span>

                  {/* Small pill for payment status in list */}
                  <span className={`w-2 h-2 rounded-full ${o.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-400'}`} title={o.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'} />
                </div>
                <p className="text-xs text-[var(--gd-color-text-muted)] truncate">{o.delivery.address.contactName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-[var(--gd-color-forest)]">
                  {formatCurrency(o.totals.total.amount)}
                </p>
                {o.paymentStatus === 'paid' &&
                  <p className="text-[10px] text-green-600 font-bold">PAGADO</p>
                }
              </div>
            </div>
          </button>
        ))}
        {filteredOrders.length === 0 && (
          <p className="text-center text-sm text-[var(--gd-color-text-muted)] py-4">
            No se encontraron pedidos
          </p>
        )}
      </div>
    </div >
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(amount);
}
