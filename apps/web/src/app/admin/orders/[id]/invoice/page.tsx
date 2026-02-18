"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/modules/admin/api/client";
import Image from "next/image";

const LOGO_SRC = "/assets/images/logo/logo-vertical.png";
const COMPANY = {
  name: "GreenDolio",
  phone: "+1 (809) 753-7338",
  email: "greendolioexpress@gmail.com",
  country: "República Dominicana",
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
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

type InvoiceItem = {
  id: string;
  name?: { es?: string; en?: string } | string;
  quantity: number;
  unitPrice?: { amount: number; currency: string };
};

type InvoiceOrder = {
  id: string;
  createdAt: string;
  guestEmail?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
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
    };
  };
  items?: InvoiceItem[];
};

export default function OrderInvoicePage() {
  const params = useParams();
  const orderId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
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
    return { name, phone, label, zone, city };
  }, [order]);

  const paymentBadge = useMemo(() => {
    const method = (order?.paymentMethod ?? "").toString().trim();
    const status = (order?.paymentStatus ?? "").toString().trim();

    if (!method && !status) {
      return {
        text: "Pendiente - Método no especificado",
        className: "border-amber-200 bg-amber-50 text-amber-800",
      };
    }

    const paid = status.toLowerCase() === "paid";
    const label = method ? `vía ${method}` : "Método no especificado";
    return paid
      ? { text: `Pagado ${label}`, className: "border-emerald-200 bg-emerald-50 text-emerald-800" }
      : { text: `Pendiente - ${label}`, className: "border-amber-200 bg-amber-50 text-amber-800" };
  }, [order?.paymentMethod, order?.paymentStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-500">Cargando factura...</div>
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
    <div className="min-h-screen bg-slate-200/60 p-6 md:p-10 print:bg-white print:p-0 font-sans text-slate-900">
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          html,
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            background: white !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-end gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
        >
          Imprimir / Descargar PDF
        </button>
      </div>

      <div className="mx-auto w-full max-w-[210mm] print:max-w-none bg-white shadow-lg print:shadow-none border border-slate-200 print:border-transparent rounded-2xl print:rounded-none overflow-hidden print:overflow-visible">
        <div className="h-2 bg-[var(--gd-color-forest)] print:h-3" />
        <header className="p-[12mm] pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <Image src={LOGO_SRC} alt="GreenDolio" fill sizes="64px" className="object-contain" priority />
              </div>
              <div className="leading-tight">
                <p className="text-base font-semibold text-[var(--gd-color-forest)]">{COMPANY.name}</p>
                <p className="mt-1 text-xs text-slate-500">{COMPANY.country}</p>
                <p className="mt-1 text-xs text-slate-500">{COMPANY.phone}</p>
                <p className="text-xs text-slate-500">{COMPANY.email}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-3xl font-extrabold tracking-tight text-[var(--gd-color-forest)]">FACTURA</p>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center justify-end gap-2">
                  <dt className="text-slate-400">Factura #</dt>
                  <dd className="font-semibold text-slate-800">{order.id}</dd>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <dt className="text-slate-400">Fecha</dt>
                  <dd className="font-medium text-slate-700">{formatDate(order.createdAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </header>

        <section className="grid gap-4 px-[12mm] pb-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Facturado a</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold text-slate-800">{COMPANY.name}</p>
              <p className="text-slate-600">{COMPANY.country}</p>
              <p className="text-slate-600">{COMPANY.phone}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Enviar a</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold text-slate-800">{billedTo.name}</p>
              {order.guestEmail && <p className="text-slate-600 break-all">{order.guestEmail}</p>}
              <p className="text-slate-600">{billedTo.label ?? "Dirección no especificada"}</p>
              {(billedTo.zone || billedTo.city) && (
                <p className="text-slate-600">Zona: {[billedTo.zone, billedTo.city].filter(Boolean).join(" • ")}</p>
              )}
              {billedTo.phone && <p className="text-slate-600">Tel: {billedTo.phone}</p>}
            </div>
          </div>
        </section>

        <section className="px-[12mm]">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                  <th className="py-3 pl-4 pr-2 w-[18%]">Cantidad</th>
                  <th className="px-2 py-3">Descripción</th>
                  <th className="px-2 py-3 text-right w-[20%]">Precio Unit.</th>
                  <th className="py-3 pl-2 pr-4 text-right w-[20%]">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const name = typeof item.name === "string" ? item.name : item.name?.es ?? item.name?.en ?? "Producto";
                  const unitPrice = item.unitPrice?.amount ?? 0;
                  const lineTotal = unitPrice * (item.quantity ?? 0);
                  return (
                    <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
                      <td className="py-3 pl-4 pr-2 text-slate-700">{item.quantity ?? 0}</td>
                      <td className="px-2 py-3 text-slate-700">{name}</td>
                      <td className="px-2 py-3 text-right text-slate-600">{formatCurrency(unitPrice, currency)}</td>
                      <td className="py-3 pl-2 pr-4 text-right font-semibold text-slate-800">
                        {formatCurrency(lineTotal, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 px-[12mm] pb-6 md:grid-cols-2 md:items-end">
          <div className="md:order-1">
            <div
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                paymentBadge.className,
              ].join(" ")}
            >
              Método de Pago: {paymentBadge.text}
            </div>
          </div>

          <div className="md:order-2 md:justify-self-end w-full max-w-xs space-y-2 text-sm">
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
            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-base font-extrabold text-slate-900">TOTAL</span>
              <span className="text-base font-extrabold text-slate-900">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 px-[12mm] py-5 text-xs text-slate-500">
          <div className="flex items-center justify-between gap-4">
            <p>Gracias por confiar en {COMPANY.name}.</p>
            <p className="text-slate-400">Documento generado automáticamente.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
