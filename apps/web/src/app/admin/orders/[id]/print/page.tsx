"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/modules/admin/api/client";

const LOGO_SRC = "/assets/images/logo/logo-vertical.png";

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
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

type PrintItem = {
  id: string;
  name?: { es?: string; en?: string } | string;
  quantity: number;
  unitPrice?: { amount: number; currency: string };
};

type PrintOrder = {
  id: string;
  createdAt: string;
  guestEmail?: string | null;
  notes?: string;
  totals?: {
    subtotal?: { amount: number; currency: string };
    deliveryFee?: { amount: number; currency: string };
    paymentFee?: { amount: number; currency: string };
    discounts?: { amount: number; currency: string };
    tip?: { amount: number; currency: string };
    total?: { amount: number; currency: string };
  };
  returnsPackaging?: {
    returned?: boolean;
    discountAmount?: number;
  };
  delivery?: {
    address?: {
      contactName?: string;
      phone?: string;
      label?: string;
      city?: string;
      zone?: string;
      notes?: string;
    };
    window?: {
      day?: string;
      slot?: string;
    };
    notes?: string;
  };
  items?: PrintItem[];
};

export default function OrderPrintPage() {
  const params = useParams();
  const orderId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadOrder = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await adminFetch(`/api/admin/orders/${orderId}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error ?? "No se pudo cargar la orden");
        }
        if (isMounted) {
          setOrder(json.data ?? null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error inesperado");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const items = order?.items ?? [];
  const subtotal = order?.totals?.subtotal?.amount ?? 0;
  const deliveryFee = order?.totals?.deliveryFee?.amount ?? 0;
  const paymentFee = order?.totals?.paymentFee?.amount ?? 0;
  const discount = order?.totals?.discounts?.amount ?? 0;
  const returnDiscount = order?.returnsPackaging?.returned ? (order?.returnsPackaging?.discountAmount ?? 0) : 0;
  const otherDiscount = Math.max(0, discount - returnDiscount);
  const tip = order?.totals?.tip?.amount ?? 0;
  const total = order?.totals?.total?.amount ?? subtotal + deliveryFee + paymentFee - discount + tip;
  const currency = order?.totals?.total?.currency ?? "DOP";

  const billedTo = useMemo(() => {
    const name = order?.delivery?.address?.contactName ?? "Cliente";
    const phone = order?.delivery?.address?.phone;
    const label = order?.delivery?.address?.label;
    const zone = order?.delivery?.address?.zone;
    const city = order?.delivery?.address?.city;
    const day = order?.delivery?.window?.day;
    const slot = order?.delivery?.window?.slot;
    return { name, phone, label, zone, city, day, slot };
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-500">Cargando orden...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 text-sm text-red-600">
          {error ?? "No se encontró la orden"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200/60 p-6 md:p-10 font-sans text-slate-900">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .invoice-container {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-4xl items-center justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
        >
          Imprimir / Descargar PDF
        </button>
      </div>

      <div className="invoice-container mx-auto max-w-4xl rounded-3xl bg-white shadow-lg border border-slate-200 overflow-hidden">
        <div className="h-2 bg-[var(--gd-color-forest)]" />
        <header className="flex flex-col gap-6 p-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <Image src={LOGO_SRC} alt="Green Dolio" width={120} height={64} className="h-16 w-auto" />
            <div>
              <p className="text-sm text-[var(--gd-color-forest)] font-semibold">Green Dolio</p>
              <p className="text-xs text-slate-400">Orden de Compra</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Orden</p>
            <p className="text-2xl font-semibold text-slate-900"># {order.id.slice(0, 6).toUpperCase()}</p>
            <p className="mt-1 text-xs text-slate-500">Fecha: {formatDate(order.createdAt)}</p>
          </div>
        </header>

        <section className="mt-0 grid gap-6 px-8 pb-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cliente</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{billedTo.name}</p>
            {order.guestEmail && <p className="text-xs text-slate-500">{order.guestEmail}</p>}
            {billedTo.phone && <p className="text-xs text-slate-500">{billedTo.phone}</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Entrega</p>
            <p className="mt-2 text-sm text-slate-700">{billedTo.label ?? "Dirección no especificada"}</p>
            <p className="text-xs text-slate-500">
              {[billedTo.zone, billedTo.city].filter(Boolean).join(" • ")}
            </p>
            {(billedTo.day || billedTo.slot) && (
              <p className="mt-2 text-xs text-slate-500">
                {billedTo.day ?? ""} {billedTo.slot ? `• ${billedTo.slot}` : ""}
              </p>
            )}
          </div>
        </section>

        <section className="px-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.3em] text-slate-400">
                <th className="py-3">Item</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Precio Unitario</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const name = typeof item.name === "string" ? item.name : item.name?.es ?? item.name?.en ?? "Producto";
                const unitPrice = item.unitPrice?.amount ?? 0;
                const lineTotal = unitPrice * (item.quantity ?? 0);
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 text-slate-700">{name}</td>
                    <td className="py-3 text-center text-slate-500">{item.quantity ?? 0}</td>
                    <td className="py-3 text-right text-slate-500">{formatCurrency(unitPrice, currency)}</td>
                    <td className="py-3 text-right font-semibold text-slate-700">
                      {formatCurrency(lineTotal, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="mt-6 flex justify-end px-8">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Delivery</span>
              <span>{formatCurrency(deliveryFee, currency)}</span>
            </div>
            {paymentFee > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Cargo pago digital</span>
                <span>{formatCurrency(paymentFee, currency)}</span>
              </div>
            )}
            {returnDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Descuento devolución envases</span>
                <span>-{formatCurrency(returnDiscount, currency)}</span>
              </div>
            )}
            {otherDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Descuento</span>
                <span>-{formatCurrency(otherDiscount, currency)}</span>
              </div>
            )}
            {tip > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Propina</span>
                <span>{formatCurrency(tip, currency)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-900 font-semibold text-base border-t border-slate-200 pt-2">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </section>

        {(order.delivery?.notes || order.notes) && (
          <section className="mt-6 mx-8 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notas</p>
            <p className="mt-2">{order.delivery?.notes || order.notes}</p>
          </section>
        )}

        <footer className="mt-8 border-t border-slate-200 px-8 py-6 text-xs text-slate-400">
          Gracias por confiar en Green Dolio.
        </footer>
      </div>
    </div>
  );
}
