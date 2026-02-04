"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import Link from "next/link";

import { useCart } from "@/modules/cart/context";
import { useCatalog } from "@/modules/catalog/context";
import { useAuth } from "@/modules/auth/context";
import { useUser } from "@/modules/user/context";
import type { CartItem } from "@/modules/cart/types";
import { useTranslation } from "@/modules/i18n/use-translation";
import productMetadata from "@/data/productMetadata.json";

type TranslateFn = ReturnType<typeof useTranslation>["t"];
type TDataFn = ReturnType<typeof useTranslation>["tData"];

const productNameMap = new Map(productMetadata.map((item: { slug: string; name: string }) => [item.slug, item.name]));

/** Resolve product/preference label: catalog (SKU/slug → name_es|name_en) first, then productMetadata, then raw value. */
function makeResolvePreferenceLabel(productMap: Map<string, { name: { es?: string; en?: string } }>, tData: TDataFn) {
  return (value: string): string => {
    const product = productMap.get(value);
    if (product?.name) return tData(product.name);
    return productNameMap.get(value) ?? value;
  };
}

const resolveVariantKey = (variant?: string, mix?: string) => {
  if (variant === "fruity" || variant === "veggie" || variant === "mix") return variant;
  if (mix === "frutas") return "fruity";
  if (mix === "vegetales") return "veggie";
  return "mix";
};

const getCatalogHrefForVariant = (variantKey: string) => {
  if (variantKey === "fruity") return "/categoria/frutas";
  if (variantKey === "veggie") return "/categoria/vegetales";
  return "/#catalogo";
};

const getVariantLabel = (variantKey: string, t: TranslateFn) => {
  if (variantKey === "fruity") return t("cart.variant_fruity");
  if (variantKey === "veggie") return t("cart.variant_veggie");
  return t("cart.variant_mix");
};

const CHECKOUT_DRAFT_KEY = "gd-checkout-draft";
const AUTH_MODE_KEY = "gd-auth-mode";

type AuthChoice = "undecided" | "guest";
type PaymentPreference = "Cash" | "Transferencia" | "PayPal";

const mapPaymentMethod = (value: string) => {
  if (value === "Cash") return "cash";
  if (value === "Transferencia") return "transfer";
  if (value === "Tarjeta") return "card";
  if (value === "PayPal") return "online";
  return undefined;
};

const normalizePaymentPreference = (value: string): PaymentPreference | undefined => {
  if (value === "Cash" || value === "Transferencia" || value === "PayPal") {
    return value;
  }
  return undefined;
};

type FormState = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  direccion: string;
  deliveryDay: string;
  metodoPago: string;
  notes: string;
};

export function CheckoutClient() {
  const { items, clear, metrics } = useCart();
  const { productMap } = useCatalog();
  const { user } = useAuth();
  const { profile, updateProfile, syncCart } = useUser();
  const { t, tData } = useTranslation();
  const resolvePreferenceLabel = useMemo(
    () => makeResolvePreferenceLabel(productMap, tData),
    [productMap, tData],
  );
  const [form, setForm] = useState<FormState>({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    direccion: "",
    deliveryDay: "",
    metodoPago: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false); // Nuevo estado para mostrar resumen
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [authChoice, setAuthChoice] = useState<AuthChoice>("undecided");
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Pre-llenar formulario con datos del perfil
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      contactName: prev.contactName || user.displayName || "",
      contactEmail: prev.contactEmail || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      contactPhone: prev.contactPhone || profile.telefono || "",
      direccion: prev.direccion || profile.direccion || "",
      metodoPago: prev.metodoPago || profile.pagoPreferido || "",
      notes: prev.notes || buildNotesFromProfile(profile),
    }));
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawDraft = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Partial<FormState>;
        setForm((prev) => ({ ...prev, ...draft }));
      }
    } catch {
      // ignore draft errors
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!showAuthGate) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAuthGate]);

  useEffect(() => {
    if (!draftLoaded) return;
    if (user) return;
    if (authChoice !== "undecided") return;
    if (!items.length) return;
    setShowAuthGate(true);
  }, [authChoice, draftLoaded, items.length, user]);

  useEffect(() => {
    if (!user) return;
    setShowAuthGate(false);
    if (authChoice !== "undecided") {
      setAuthChoice("undecided");
    }
  }, [user, authChoice]);

  useEffect(() => {
    if (!draftLoaded || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(form));
    } catch {
      // ignore storage errors
    }
  }, [form, draftLoaded]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice = item.configuration?.price?.final ?? item.price;
        return sum + unitPrice * item.quantity;
      }, 0),
    [items],
  );
  const boxItems = useMemo(
    () => items.filter((item) => item.type === "box" && item.configuration),
    [items]
  );
  const hasPreferences = boxItems.some(
    (item) => (item.configuration?.likes?.length ?? 0) > 0 || (item.configuration?.dislikes?.length ?? 0) > 0
  );
  const catalogVariant =
    boxItems.length === 1
      ? resolveVariantKey(boxItems[0].configuration?.variant, boxItems[0].configuration?.mix)
      : "mix";
  const catalogHref = getCatalogHrefForVariant(catalogVariant);

  // Calcular valores del pedido
  const orderCalculations = useMemo(() => {
    const diasConCargo = ["Martes", "Jueves", "Sábado"];
    const cargoEnvio = diasConCargo.includes(form.deliveryDay) ? 100 : 0;
    const metodoPago = form.metodoPago || profile?.pagoPreferido || "Cash";
    const subtotalConEnvio = subtotal + cargoEnvio;
    const requierePaypal = metodoPago === "PayPal" || metodoPago === "Tarjeta";
    const cargoPaypal = requierePaypal ? subtotalConEnvio * 0.1 : 0;
    const totalFinalDOP = subtotalConEnvio + cargoPaypal;
    const tasaCambio = 55;
    const totalFinalUSD = requierePaypal ? (totalFinalDOP / tasaCambio) : 0;

    return {
      cargoEnvio,
      metodoPago,
      subtotalConEnvio,
      requierePaypal,
      cargoPaypal,
      totalFinalDOP,
      totalFinalUSD,
    };
  }, [subtotal, form.deliveryDay, form.metodoPago, profile?.pagoPreferido]);

  const persistDraft = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(form));
      }
    } catch {
      // ignore storage errors
    }
  };

  const persistProfileFromCheckout = async () => {
    if (!user) return;
    const displayName = form.contactName.trim();
    const updates = {
      telefono: form.contactPhone.trim(),
      direccion: form.direccion.trim(),
      pagoPreferido: normalizePaymentPreference(form.metodoPago),
      ...(displayName ? { displayName } : {}),
    };
    try {
      await updateProfile(updates);
    } catch (error) {
      console.error("Error al guardar datos del cliente en Firebase:", error);
      toast.error("No pudimos guardar tus datos en tu cuenta. Intenta nuevamente.", {
        duration: 5000,
      });
    }
  };

  const ensureCheckoutAccess = () => {
    if (user || authChoice === "guest") {
      return true;
    }
    persistDraft();
    setShowAuthGate(true);
    return false;
  };

  const handleAuthLogin = () => {
    persistDraft();
    setShowAuthGate(false);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("gd-show-auth-modal", "true");
        window.sessionStorage.setItem(AUTH_MODE_KEY, "signup");
      }
    } catch {
      // ignore storage errors
    }
    setAuthChoice("undecided");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("gd-auth-modal-open"));
    }
  };

  const handleAuthGuest = () => {
    setAuthChoice("guest");
    setShowAuthGate(false);
  };

  const handleAuthClose = () => {
    setShowAuthGate(false);
  };

  // Paso 1: Validar formulario y mostrar resumen
  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!items.length) {
      toast.error(t("checkout.empty_cart"));
      return;
    }
    if (!form.contactName.trim() || !form.contactPhone.trim()) {
      toast.error(t("checkout.name_phone_required"));
      return;
    }
    if (!form.direccion.trim()) {
      toast.error(t("checkout.address_required"));
      return;
    }
    if (!form.deliveryDay.trim()) {
      toast.error(t("checkout.delivery_day_required"));
      return;
    }
    if (!form.metodoPago.trim()) {
      toast.error(t("checkout.payment_required"));
      return;
    }

    if (!ensureCheckoutAccess()) {
      return;
    }

    // Validar pedido mínimo de DOP 500 (solo si no hay cajas)
    const tieneCajas = items.some((item) => item.type === "box");
    if (!tieneCajas && subtotal < 500) {
      const faltante = 500 - subtotal;
      toast.error(`Pedido mínimo: DOP 500. Te faltan DOP ${faltante.toFixed(2)}.`);
      return;
    }

    // Mostrar resumen del pedido
    setShowSummary(true);
  };

  // Paso 2: Enviar pedido por WhatsApp (SOLO si se guarda en BD)
  const handleSendOrder = async () => {
    if (!ensureCheckoutAccess()) {
      return;
    }

    setSubmitting(true);
    try {
      await persistProfileFromCheckout();

      const {
        cargoEnvio,
        metodoPago,
        requierePaypal,
        cargoPaypal,
        totalFinalDOP,
        totalFinalUSD,
      } = orderCalculations;

      const deliveryZone = boxItems.find((item) => item.configuration?.deliveryZone)?.configuration?.deliveryZone;
      const checkoutItems = items.map((item) => {
        const unitPrice = item.configuration?.price?.final ?? item.price;
        const metadata: Record<string, unknown> = {};
        if (item.notes) metadata.notes = item.notes;
        if (item.excludedIngredients?.length) {
          metadata.excludedIngredients = item.excludedIngredients;
        }
        return {
          type: item.type,
          slug: item.slug,
          name: item.name,
          quantity: item.quantity,
          price: unitPrice,
          image: item.image,
          configuration: item.type === "box" ? item.configuration : undefined,
          metadata: Object.keys(metadata).length ? metadata : undefined,
        };
      });

      const checkoutPayload = {
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail?.trim() || undefined,
        address: form.direccion?.trim() || undefined,
        deliveryZone,
        deliveryDay: form.deliveryDay || undefined,
        notes: form.notes?.trim() || undefined,
        paymentMethod: mapPaymentMethod(metodoPago),
        items: checkoutItems,
      };

      // 1. Guardar primero en el Backend
      let orderId = "PENDIENTE";
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/api/orders", {
          method: "POST",
          headers,
          body: JSON.stringify(checkoutPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Backend responded with ${response.status}`);
        }

        const responseData = await response.json();
        // Intentar obtener ID del formato de respuesta { data: { id: ... } } o { id: ... }
        orderId = responseData.data?.id || responseData.id || "N/A";

      } catch (apiError: any) {
        console.error("Error al registrar pedido en API:", apiError);
        toast.error(`No pudimos procesar tu pedido: ${apiError?.message || "Error de conexión"}. Por favor intenta de nuevo.`);
        setSubmitting(false);
        return; // DETENER SI FALLA LA API
      }

      // 2. Construir mensaje de WhatsApp con el ID real
      const detallePedido = items
        .map((item) => {
          const unitPrice = item.configuration?.price?.final ?? item.price;
          let linea = `• ${item.name} (x${item.quantity}) - DOP ${(unitPrice * item.quantity).toFixed(2)}`;

          if (item.type === "box" && item.configuration) {
            const variantKey = resolveVariantKey(item.configuration.variant, item.configuration.mix);
            const variantLabel = getVariantLabel(variantKey, t);
            linea += `\n  - ${t("cart.mix")}: ${variantLabel}`;

            if (item.configuration.likes?.length > 0 || item.configuration.dislikes?.length > 0) {
              const likes = (item.configuration.likes || []).map(resolvePreferenceLabel).filter(Boolean);
              const dislikes = (item.configuration.dislikes || []).map(resolvePreferenceLabel).filter(Boolean);
              if (likes.length > 0) {
                linea += `\n  - ${t("cart.likes")}: 👍 ${likes.join(", ")}`;
              }
              if (dislikes.length > 0) {
                linea += `\n  - ${t("cart.dislikes")}: 👎 ${dislikes.join(", ")}`;
              }
            }
          }

          if (item.notes || (item.excludedIngredients?.length ?? 0) > 0) {
            if (item.excludedIngredients?.length) {
              linea += `\n  - ${t("cart.excluded_ingredients")}: ${item.excludedIngredients.join(", ")}`;
            }
            if (item.notes) {
              linea += `\n  - ${t("cart.notes")}: ${item.notes}`;
            }
          }

          return linea;
        })
        .join("\n");

      let desgloseTotal = `Subtotal: DOP ${subtotal.toFixed(2)}`;
      if (cargoEnvio > 0) {
        desgloseTotal += `\nEnvío: DOP ${cargoEnvio.toFixed(2)}`;
      }
      if (cargoPaypal > 0) {
        const metodoTexto = metodoPago === "Tarjeta" ? "PayPal/Tarjeta" : "PayPal";
        desgloseTotal += `\nCargo ${metodoTexto} (10%): DOP ${cargoPaypal.toFixed(2)}`;
      }
      desgloseTotal += `\n*Total a Pagar: DOP ${totalFinalDOP.toFixed(2)}*`;

      if (requierePaypal && totalFinalUSD > 0) {
        desgloseTotal += `\n*Total en USD: $${totalFinalUSD.toFixed(2)}* (Tasa: 1 USD = 55 DOP)`;
      }

      let mensajeWhatsApp = `¡Hola Green Dolio! 👋 Nuevo Pedido #${orderId}:

*👤 DATOS DEL CLIENTE:*
- Nombre: ${form.contactName}
- Teléfono: ${form.contactPhone}
- Email: ${form.contactEmail || "No proporcionado"}
- Dirección: ${form.direccion || ""}
- Día de entrega: ${form.deliveryDay}

*🛒 RESUMEN DEL PEDIDO:*
${detallePedido}

*💰 TOTAL:*
${desgloseTotal}

*💳 MÉTODO DE PAGO:*
${metodoPago}`;

      mensajeWhatsApp += `\n\n*📝 OBSERVACIONES:*\n${form.notes || "Sin observaciones."}`;
      mensajeWhatsApp += `\n\n*💬 Recibirás los detalles del pago por WhatsApp.*`;

      // 3. Abrir WhatsApp
      const numeroWhatsApp = "18097537338";
      const mensajeCodificado = encodeURIComponent(mensajeWhatsApp);
      const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;

      if (whatsappUrl.length > 4000) {
        console.warn("URL de WhatsApp muy larga");
        toast.error("El mensaje es muy largo. Por favor contacta soporte.");
        setSubmitting(false);
        return;
      }

      try {
        // Usar window.open directamente para asegurar redirección, 
        // ya que estamos en un contexto de evento de usuario (click)
        const newWindow = window.open(whatsappUrl, "_blank");
        if (!newWindow) {
          // Fallback si el popup blocker lo detiene
          window.location.href = whatsappUrl;
        }
      } catch (error) {
        console.error("Error al abrir WhatsApp:", error);
        toast.error("Pedido guardado, pero no se pudo abrir WhatsApp. Revisa tus popups.");
      }

      // 4. Finalizar
      if (requierePaypal) {
        toast.success("¡Pedido creado! Completando proceso en WhatsApp...", { duration: 6000 });
      } else {
        toast.success("¡Pedido creado con éxito!", { duration: 5000 });
      }

      clear();

      // Force sync for logged in users to avoid "zombie cart" on reload
      if (user) {
        await syncCart([]);
      }

      if (typeof window !== "undefined") {
        // Explicitly clear local buffers to prevent restoration on reload
        const STORAGE_KEY = "gd-cart";
        const GUEST_STORAGE_KEY = "gd-cart-guest";

        if (user?.uid) {
          window.localStorage.removeItem(`${STORAGE_KEY}-${user.uid}`);
        }
        window.sessionStorage.removeItem(GUEST_STORAGE_KEY);
        window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      }

      // Dar tiempo para que el usuario vea el toast antes de redirigir/limpiar UI
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (error) {
      const message = error instanceof Error ? error.message : t("checkout.order_error");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const authGate =
    showAuthGate && !user && typeof window !== "undefined"
      ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={handleAuthClose}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white shadow-xl flex flex-col z-[10000]"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="p-6 pb-4 border-b border-gray-200">
              <h2 className="mb-2 font-display text-2xl text-[var(--color-foreground)]">
                {t("checkout.auth_title")}
              </h2>
              <p className="text-sm text-[var(--color-muted)]">{t("checkout.auth_desc")}</p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
                <li>✓ {t("checkout.auth_benefit_1")}</li>
                <li>✓ {t("checkout.auth_benefit_2")}</li>
                <li>✓ {t("checkout.auth_benefit_3")}</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-6 pt-4 border-t border-gray-200 bg-white rounded-b-3xl">
              <button
                type="button"
                onClick={handleAuthLogin}
                className="flex-1 rounded-full bg-[var(--gd-color-forest)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--gd-color-leaf)]"
              >
                {t("checkout.auth_login")}
              </button>
              <button
                type="button"
                onClick={handleAuthGuest}
                className="flex-1 rounded-full border border-[var(--gd-color-forest)]/30 px-6 py-3 text-sm font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/10"
              >
                {t("checkout.auth_guest")}
              </button>
            </div>
            <p className="px-6 pb-6 text-xs text-[var(--color-muted)]">
              {t("checkout.auth_guest_hint")}
            </p>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={handleAuthClose}
                className="w-full rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-background-muted)]"
              >
                {t("checkout.auth_back")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  // Si showSummary es true, mostrar solo el resumen del pedido (sin aside duplicado)
  if (showSummary) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{t("checkout.review_title")}</p>
            <h1 className="font-display text-3xl text-[var(--color-foreground)]">{t("checkout.review_heading")}</h1>
            <p className="text-sm text-[var(--color-muted)]">
              {t("checkout.review_subtitle")}
            </p>
          </header>

          <section className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft">
            <OrderSummaryView
              form={form}
              items={items}
              orderCalculations={orderCalculations}
              resolvePreferenceLabel={resolvePreferenceLabel}
            />

            <div className="pt-6 border-t-2 border-[var(--color-border)] space-y-4">
              <button
                onClick={() => setShowSummary(false)}
                className="w-full rounded-full border-2 border-[var(--color-border)] px-8 py-4 text-base font-semibold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background-muted)]"
              >
                {t("checkout.review_back")}
              </button>
              <button
                onClick={handleSendOrder}
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>{t("checkout.review_sending")}</span>
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    <span>{t("checkout.review_send_whatsapp")}</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
        {authGate}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{t("checkout.title")}</p>
          <h1 className="font-display text-3xl text-[var(--color-foreground)]">{t("checkout.confirm_order")}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {t("checkout.description")}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft">
            <form onSubmit={handleConfirm} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  {t("checkout.full_name")}
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  {t("checkout.whatsapp")}
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  {t("checkout.email")}
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
                  Dirección <span className="text-red-500">*</span>
                  <textarea
                    value={form.direccion}
                    onChange={(e) => setForm((s) => ({ ...s, direccion: e.target.value }))}
                    placeholder="Calle Principal #123, Santo Domingo"
                    rows={2}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                    required
                  />
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)] block">
                {t("checkout.delivery_day")} <span className="text-red-500">*</span>
                <select
                  value={form.deliveryDay}
                  onChange={(e) => setForm((s) => ({ ...s, deliveryDay: e.target.value }))}
                  required
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                >
                  <option value="">Selecciona un día</option>
                  <option value="Lunes">Lunes (12:30-20:00) - Gratis</option>
                  <option value="Martes">Martes (12:30-20:00) - DOP 100</option>
                  <option value="Miércoles">Miércoles (12:30-20:00) - Gratis</option>
                  <option value="Jueves">Jueves (12:30-20:00) - DOP 100</option>
                  <option value="Viernes">Viernes (12:30-20:00) - Gratis</option>
                  <option value="Sábado">Sábado (12:30-20:00) - DOP 100</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)] block">
                Método de pago <span className="text-red-500">*</span>
                <select
                  value={form.metodoPago}
                  onChange={(e) => setForm((s) => ({ ...s, metodoPago: e.target.value }))}
                  required
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                >
                  <option value="">Selecciona un método</option>
                  <option value="Cash">Efectivo / Cash</option>
                  <option value="Transferencia">Transferencia Bancaria / Bank Transfer</option>
                  <option value="PayPal">PayPal (+10%)</option>
                  <option value="Tarjeta">Tarjeta de Crédito / Credit Card</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)] block">
                {t("checkout.delivery_notes")}
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                  placeholder={t("checkout.delivery_notes_placeholder")}
                />
              </label>
              <div className="pt-6 border-t-2 border-[var(--color-border)]">
                <button
                  type="submit"
                  disabled={submitting || !form.deliveryDay || !form.metodoPago}
                  className="w-full rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>{t("checkout.submitting")}</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>Confirmar Pedido</span>
                    </>
                  )}
                </button>
                {(!form.deliveryDay || !form.metodoPago) && (
                  <p className="text-xs text-red-600 text-center mt-2">
                    Por favor completa todos los campos requeridos
                  </p>
                )}
              </div>
            </form>
          </section>

          <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{t("checkout.summary")}</p>
              <p className="font-display text-2xl text-[var(--color-foreground)]">{t("checkout.your_cart")}</p>
              <p className="text-sm text-[var(--color-muted)]">{items.length} {t("checkout.items")} · {metrics.itemCount} {t("checkout.units")}</p>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <CartLine key={`${item.slug}-${item.configuration ? "box" : "simple"}-${index}`} item={item} resolvePreferenceLabel={resolvePreferenceLabel} />
              ))}
            </div>
            {boxItems.length > 0 && (
              <AlaCarteReminder catalogHref={catalogHref} hasPreferences={hasPreferences} />
            )}
            <OrderSummary
              subtotal={subtotal}
              deliveryDay={form.deliveryDay}
              metodoPago={form.metodoPago}
            />
          </aside>
        </div>
      </div>
      {authGate}
    </main>
  );
}

function CartLine({ item, resolvePreferenceLabel }: { item: CartItem; resolvePreferenceLabel: (value: string) => string }) {
  const { t } = useTranslation();
  const isBox = item.type === "box" && item.configuration;
  const unitPrice = item.configuration?.price?.final ?? item.price;
  const variantKey = item.configuration
    ? resolveVariantKey(item.configuration.variant, item.configuration.mix)
    : "mix";
  const variantLabel = isBox ? getVariantLabel(variantKey, t) : "";
  const likes = (item.configuration?.likes || []).map(resolvePreferenceLabel).filter(Boolean);
  const dislikes = (item.configuration?.dislikes || []).map(resolvePreferenceLabel).filter(Boolean);
  const showProductNotes = item.type === "product" && (Boolean(item.notes) || (item.excludedIngredients?.length ?? 0) > 0);
  return (
    <div className="rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-background-muted)]/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-foreground)]">{item.name}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {item.quantity} x RD${unitPrice.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          RD${(unitPrice * item.quantity).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
        </p>
      </div>
      {isBox && (
        <div className="mt-2 space-y-2 text-xs text-[var(--color-muted)]">
          <p>{t("cart.mix")}: {variantLabel}</p>
          {likes.length > 0 && <p>👍 {t("cart.likes")}: {likes.join(", ")}</p>}
          {dislikes.length > 0 && <p>👎 {t("cart.dislikes")}: {dislikes.join(", ")}</p>}
          <p>{t("cart.delivery_zone")}: {item.configuration?.deliveryZone || t("checkout.delivery_to_define")} · {t("cart.delivery_day")}: {item.configuration?.deliveryDay || t("checkout.day_to_agree")}</p>
          {item.configuration?.selectedProducts && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(item.configuration.selectedProducts)
                .filter(([, qty]) => qty && qty > 0)
                .slice(0, 6)
                .map(([slug, qty]) => (
                  <span key={slug} className="rounded-full bg-white px-2 py-1">
                    {resolvePreferenceLabel(slug)} x{qty}
                  </span>
                ))}
            </div>
          )}
          {item.configuration?.price && (
            <p className="text-[var(--color-foreground)] font-semibold">
              {item.configuration.price.isACarta ? t("checkout.price_a_la_carta") : t("checkout.box_price")}: RD$
              {item.configuration.price.final.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      )}
      {showProductNotes && (
        <div className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
          {item.excludedIngredients?.length ? (
            <p>{t("cart.excluded_ingredients")}: {item.excludedIngredients.join(", ")}</p>
          ) : null}
          {item.notes ? <p>{t("cart.notes")}: {item.notes}</p> : null}
        </div>
      )}
    </div>
  );
}

function OrderSummary({
  subtotal,
  deliveryDay,
  metodoPago
}: {
  subtotal: number;
  deliveryDay: string;
  metodoPago: string;
}) {
  const { t } = useTranslation();
  const tasaCambio = 55; // 1 USD = 55 DOP
  const diasConCargo = ["Martes", "Jueves", "Sábado"];
  const cargoEnvio = diasConCargo.includes(deliveryDay) ? 100 : 0;
  const requierePaypal = metodoPago === "PayPal" || metodoPago === "Tarjeta";
  const subtotalConEnvio = subtotal + cargoEnvio;
  const cargoPaypal = requierePaypal ? subtotalConEnvio * 0.1 : 0;
  const totalFinalDOP = subtotalConEnvio + cargoPaypal;
  const totalFinalUSD = requierePaypal ? (totalFinalDOP / tasaCambio) : 0;

  return (
    <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted)]">{t("checkout.subtotal")}</span>
        <span className="font-semibold text-[var(--color-foreground)]">RD${subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span>
      </div>
      {cargoEnvio > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">{t("checkout.delivery")}</span>
          <span className="font-semibold text-[var(--color-foreground)]">RD${cargoEnvio.toFixed(2)}</span>
        </div>
      ) : deliveryDay ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">{t("checkout.delivery")}</span>
          <span className="font-semibold text-green-700">{t("checkout.free")}</span>
        </div>
      ) : null}
      {cargoPaypal > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">Cargo PayPal (10%)</span>
          <span className="font-semibold text-orange-600">RD${cargoPaypal.toFixed(2)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-foreground)]">{t("checkout.total")}</span>
        <div className="text-right">
          <span className="font-display text-2xl text-[var(--color-foreground)] block">
            RD${totalFinalDOP.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </span>
          {requierePaypal && totalFinalUSD > 0 && (
            <span className="text-xs text-[var(--color-muted)] block mt-1">
              ≈ ${totalFinalUSD.toFixed(2)} USD (1 USD = 55 DOP)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderSummaryView({
  form,
  items,
  orderCalculations,
  resolvePreferenceLabel,
}: {
  form: FormState;
  items: CartItem[];
  orderCalculations: {
    cargoEnvio: number;
    metodoPago: string;
    requierePaypal: boolean;
    cargoPaypal: number;
    totalFinalDOP: number;
    totalFinalUSD: number;
  };
  resolvePreferenceLabel: (value: string) => string;
}) {
  const { t } = useTranslation();
  const { cargoEnvio, metodoPago, requierePaypal, cargoPaypal, totalFinalDOP, totalFinalUSD } = orderCalculations;

  const subtotal = items.reduce(
    (sum, item) => sum + (item.configuration?.price?.final ?? item.price) * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">👤 Datos del Cliente</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Nombre:</span> {form.contactName}</p>
          <p><span className="font-semibold">Teléfono:</span> {form.contactPhone}</p>
          {form.contactEmail && <p><span className="font-semibold">Email:</span> {form.contactEmail}</p>}
          <p><span className="font-semibold">Dirección:</span> {form.direccion}</p>
          <p><span className="font-semibold">Día de entrega:</span> {form.deliveryDay}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">🛒 Resumen del Pedido</h2>
        <div className="space-y-3">
          {items.map((item) => {
            const unitPrice = item.configuration?.price?.final ?? item.price;
            return (
              <div key={`${item.slug}-${item.configuration ? "box" : "simple"}`} className="rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-background-muted)]/60">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--color-foreground)]">{item.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {item.quantity} x RD${unitPrice.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    RD${(unitPrice * item.quantity).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {item.type === "box" && item.configuration && (
                  <div className="mt-2 space-y-2 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)] pt-2">
                    <p>
                      {t("cart.mix")}: {getVariantLabel(resolveVariantKey(item.configuration.variant, item.configuration.mix), t)}
                    </p>
                    {item.configuration?.likes?.length > 0 && (
                      <p>👍 {t("cart.likes")}: {item.configuration.likes.map(resolvePreferenceLabel).join(", ")}</p>
                    )}
                    {item.configuration?.dislikes?.length > 0 && (
                      <p>👎 {t("cart.dislikes")}: {item.configuration.dislikes.map(resolvePreferenceLabel).join(", ")}</p>
                    )}
                    {item.configuration?.selectedProducts && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(item.configuration.selectedProducts)
                          .filter(([, qty]) => qty && qty > 0)
                          .map(([slug, qty]) => (
                            <span key={slug} className="rounded-full bg-white px-2 py-1">
                              {resolvePreferenceLabel(slug)} x{qty}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
                {item.type === "product" && (item.notes || item.excludedIngredients?.length) && (
                  <div className="mt-2 space-y-2 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)] pt-2">
                    {item.excludedIngredients?.length ? (
                      <p>{t("cart.excluded_ingredients")}: {item.excludedIngredients.join(", ")}</p>
                    ) : null}
                    {item.notes ? <p>{t("cart.notes")}: {item.notes}</p> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">💰 Totales</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)]">Subtotal:</span>
            <span className="font-semibold">RD${subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span>
          </div>
          {cargoEnvio > 0 ? (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Envío:</span>
              <span className="font-semibold">RD${cargoEnvio.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Envío:</span>
              <span className="font-semibold text-green-700">Gratis</span>
            </div>
          )}
          {cargoPaypal > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Cargo PayPal (10%):</span>
              <span className="font-semibold text-orange-600">RD${cargoPaypal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
            <span className="font-semibold text-[var(--color-foreground)]">Total:</span>
            <div className="text-right">
              <span className="font-display text-xl text-[var(--color-foreground)] block">
                RD${totalFinalDOP.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
              </span>
              {requierePaypal && totalFinalUSD > 0 && (
                <span className="text-xs text-[var(--color-muted)] block mt-1">
                  ≈ ${totalFinalUSD.toFixed(2)} USD (1 USD = 55 DOP)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">💳 Método de Pago</h2>
        <p className="text-sm font-semibold">{metodoPago}</p>
        <p className="text-xs text-[var(--color-muted)] mt-2">
          Recibirás los detalles del pago por WhatsApp.
        </p>
      </div>

      {form.notes && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">📝 Observaciones</h2>
          <p className="text-sm text-[var(--color-muted)] whitespace-pre-line">{form.notes}</p>
        </div>
      )}
    </div>
  );
}

function AlaCarteReminder({ catalogHref, hasPreferences }: { catalogHref: string; hasPreferences: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-sprout)]/20 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">
        {t("cart.add_a_la_carte_title")}
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {hasPreferences ? t("cart.add_a_la_carte_hint_with_likes") : t("cart.add_a_la_carte_hint_no_likes")}
      </p>
      <Link
        href={catalogHref}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/40 bg-white px-4 py-2 text-xs font-semibold text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30 transition-colors"
      >
        {t("cart.view_catalog")}
      </Link>
    </div>
  );
}

function buildNotesFromProfile(profile: { likes?: string; dislikes?: string }): string {
  const notes: string[] = [];
  if (profile.likes) {
    notes.push(`👍 Preferencias: ${profile.likes}`);
  }
  if (profile.dislikes) {
    notes.push(`👎 Evitar: ${profile.dislikes}`);
  }
  return notes.join("\n");
}



