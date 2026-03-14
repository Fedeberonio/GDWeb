"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useTranslation } from "@/modules/i18n/use-translation";
import { useCart } from "@/modules/cart/context";

const ORDER_CONFIRMATION_KEY = "gd-order-confirmation";

type ConfirmationItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type ConfirmationPayload = {
  orderId: string;
  whatsappUrl: string;
  items: ConfirmationItem[];
  totals: {
    subtotal: number;
    delivery: number;
    total: number;
  };
};

export default function OrderConfirmationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { clear } = useCart();
  const [payload, setPayload] = useState<ConfirmationPayload | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(ORDER_CONFIRMATION_KEY);
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  if (!payload) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gd-color-leaf)]/15 text-4xl">
            ✅
          </div>
          <h1 className="font-display text-3xl text-[var(--color-foreground)]">
            {t("checkout.order_confirmed_title")}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {t("checkout.order_confirmed_message")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t("checkout.back_checkout")}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-foreground)]"
            >
              {t("checkout.back_home")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        <header className="text-center space-y-3">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--gd-color-leaf)]/15 text-5xl animate-bounce">
            ✅
          </div>
          <h1 className="font-display text-3xl text-[var(--color-foreground)]">
            {t("checkout.order_confirmed_title")}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {t("checkout.order_confirmed_message")}
          </p>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
            {t("checkout.order_number")}: {payload.orderId}
          </p>
        </header>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft space-y-4">
          <h2 className="font-display text-xl text-[var(--color-foreground)]">{t("checkout.summary")}</h2>
          <div className="space-y-3">
            {payload.items.map((item) => (
              <div key={`${item.name}-${item.quantity}`} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-[var(--color-foreground)]">{item.name}</p>
                  <p className="text-[var(--color-muted)]">x{item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--color-foreground)]">
                    RD${item.total.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    RD${item.unitPrice.toLocaleString("es-DO", { minimumFractionDigits: 0 })} c/u
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-border)] pt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>{t("checkout.subtotal")}</span>
              <span>RD${payload.totals.subtotal.toLocaleString("es-DO", { minimumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("checkout.delivery")}</span>
              <span>
                {payload.totals.delivery > 0
                  ? `RD${payload.totals.delivery.toLocaleString("es-DO", { minimumFractionDigits: 0 })}`
                  : t("checkout.free")}
              </span>
            </div>
            <div className="flex items-center justify-between font-semibold text-[var(--color-foreground)]">
              <span>{t("checkout.total")}</span>
              <span>RD${payload.totals.total.toLocaleString("es-DO", { minimumFractionDigits: 0 })}</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={payload.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              clear();
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(ORDER_CONFIRMATION_KEY);
                window.sessionStorage.removeItem("gd-checkout-draft");
                window.sessionStorage.removeItem("gd-checkout-auth");
              }
            }}
            className="flex-1 rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-4 text-center text-sm font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
          >
            {t("checkout.send_whatsapp")}
          </a>
          <button
            type="button"
            onClick={() => router.push("/checkout")}
            className="flex-1 rounded-full border border-[var(--color-border)] px-6 py-4 text-center text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-background-muted)]"
          >
            {t("checkout.back_checkout")}
          </button>
          <Link
            href="/"
            className="flex-1 rounded-full border border-[var(--color-border)] px-6 py-4 text-center text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-background-muted)]"
          >
            {t("checkout.back_home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
