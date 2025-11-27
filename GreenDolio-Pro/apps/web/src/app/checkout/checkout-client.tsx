"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useCart } from "@/modules/cart/context";
import type { CartItem } from "@/modules/cart/types";

type FormState = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  deliveryZone: string;
  deliveryDay: string;
  notes: string;
};

export function CheckoutClient() {
  const { items, clear, metrics } = useCart();
  const [form, setForm] = useState<FormState>({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    deliveryZone: "",
    deliveryDay: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice = item.configuration?.price?.final ?? item.price;
        return sum + unitPrice * item.quantity;
      }, 0),
    [items],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!items.length) {
      toast.error("Tu carrito está vacío");
      return;
    }
    if (!form.contactName.trim() || !form.contactPhone.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        deliveryZone: form.deliveryZone || undefined,
        deliveryDay: form.deliveryDay || undefined,
        notes: form.notes || undefined,
        items: items.map(mapCartItemToOrderItem),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "No pudimos confirmar tu pedido");
      }

      toast.success("Pedido registrado. Te contactaremos para confirmar la entrega 💚");
      clear();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos confirmar tu pedido";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Checkout</p>
          <h1 className="font-display text-3xl text-[var(--color-foreground)]">Confirma tu pedido</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Revisaremos tu pedido y te contactaremos por WhatsApp para confirmar la entrega.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  Nombre completo *
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  WhatsApp *
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  Email (opcional)
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  Zona de entrega
                  <input
                    type="text"
                    value={form.deliveryZone}
                    onChange={(e) => setForm((s) => ({ ...s, deliveryZone: e.target.value }))}
                    placeholder="Juan Dolio, Santo Domingo Este..."
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                  />
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)] block">
                Día de entrega preferido
                <input
                  type="text"
                  value={form.deliveryDay}
                  onChange={(e) => setForm((s) => ({ ...s, deliveryDay: e.target.value }))}
                  placeholder="Lunes / Miércoles / Viernes"
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)] block">
                Notas para la entrega
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                  placeholder="Ej: edificio, torre, instrucciones, horario preferido..."
                />
              </label>
              <div className="pt-4 border-t border-[var(--color-border)]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--color-brand-accent)] disabled:opacity-50"
                >
                  {submitting ? "Enviando pedido..." : "Confirmar pedido"}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Resumen</p>
              <p className="font-display text-2xl text-[var(--color-foreground)]">Tu carrito</p>
              <p className="text-sm text-[var(--color-muted)]">{items.length} items · {metrics.itemCount} unidades</p>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <CartLine key={`${item.slug}-${item.configuration ? "box" : "simple"}`} item={item} />
              ))}
            </div>
            <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="font-semibold text-[var(--color-foreground)]">RD${subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Delivery</span>
                <span className="font-semibold text-green-700">Gratis</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                <span className="text-sm font-semibold text-[var(--color-foreground)]">Total</span>
                <span className="font-display text-2xl text-[var(--color-foreground)]">
                  RD${subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const isBox = item.type === "box" && item.configuration;
  return (
    <div className="rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-background-muted)]/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-foreground)]">{item.name}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {item.quantity} x RD${item.price.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          RD${(item.price * item.quantity).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
        </p>
      </div>
      {isBox && (
        <div className="mt-2 space-y-2 text-xs text-[var(--color-muted)]">
          <p>Mix: {item.configuration?.mix || item.configuration?.variant || "mix"}</p>
          <p>Entrega: {item.configuration?.deliveryZone || "Por definir"} · {item.configuration?.deliveryDay || "Día a convenir"}</p>
          {item.configuration?.selectedProducts && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(item.configuration.selectedProducts)
                .filter(([, qty]) => qty && qty > 0)
                .slice(0, 6)
                .map(([slug, qty]) => (
                  <span key={slug} className="rounded-full bg-white px-2 py-1">
                    {slug} x{qty}
                  </span>
                ))}
            </div>
          )}
          {item.configuration?.price && (
            <p className="text-[var(--color-foreground)] font-semibold">
              {item.configuration.price.isACarta ? "Precio A la Carta" : "Precio caja"}: RD$
              {item.configuration.price.final.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function mapCartItemToOrderItem(item: CartItem) {
  return {
    type: item.type,
    slug: item.slug,
    name: item.name,
    quantity: item.quantity,
    price: item.configuration?.price?.final ?? item.price,
    image: item.image,
    configuration: item.configuration,
  };
}
