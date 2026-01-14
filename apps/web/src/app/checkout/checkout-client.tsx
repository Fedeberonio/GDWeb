"use client";

import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";

import { useCart } from "@/modules/cart/context";
import { useAuth } from "@/modules/auth/context";
import { useUser } from "@/modules/user/context";
import { getFirestoreDb } from "@/lib/firebase/client";
import { saveOrderToFirestore } from "@/modules/orders/firestore";
import { cartItemsToFirestore } from "@/modules/cart/firestore-sync";
import type { CartItem } from "@/modules/cart/types";
import { useTranslation } from "@/modules/i18n/use-translation";

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
  const { user } = useAuth();
  const { profile } = useUser();
  const { t } = useTranslation();
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

  // Pre-llenar formulario con datos del perfil
  useEffect(() => {
    if (user && profile) {
      setForm((prev) => ({
        ...prev,
        contactName: user.displayName || prev.contactName,
        contactPhone: profile.telefono || prev.contactPhone,
        contactEmail: user.email || prev.contactEmail,
        direccion: profile.direccion || prev.direccion,
        metodoPago: profile.pagoPreferido || prev.metodoPago,
        notes: buildNotesFromProfile(profile),
      }));
    }
  }, [user, profile]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice = item.configuration?.price?.final ?? item.price;
        return sum + unitPrice * item.quantity;
      }, 0),
    [items],
  );

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
    const paypalLink = requierePaypal && totalFinalUSD > 0 
      ? `https://www.paypal.com/paypalme/greendolioexpress/${totalFinalUSD.toFixed(2)}USD`
      : "";

    return {
      cargoEnvio,
      metodoPago,
      subtotalConEnvio,
      requierePaypal,
      cargoPaypal,
      totalFinalDOP,
      totalFinalUSD,
      paypalLink,
    };
  }, [subtotal, form.deliveryDay, form.metodoPago, profile?.pagoPreferido]);

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
      toast.error("La dirección es requerida");
      return;
    }
    if (!form.deliveryDay.trim()) {
      toast.error("El día de entrega es requerido");
      return;
    }
    if (!form.metodoPago.trim()) {
      toast.error("El método de pago es requerido");
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión para completar el pedido.");
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

  // Paso 2: Enviar pedido por WhatsApp
  const handleSendOrder = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para completar el pedido.");
      return;
    }

    setSubmitting(true);
    try {
      const {
        cargoEnvio,
        metodoPago,
        subtotalConEnvio,
        requierePaypal,
        cargoPaypal,
        totalFinalDOP,
        totalFinalUSD,
        paypalLink,
      } = orderCalculations;

      // Crear detalle del pedido para WhatsApp
      console.log("Construyendo detalle del pedido con", items.length, "items");
      const detallePedido = items
        .map((item) => {
          const unitPrice = item.configuration?.price?.final ?? item.price;
          let linea = `• ${item.name} (x${item.quantity}) - DOP ${(unitPrice * item.quantity).toFixed(2)}`;

          if (item.type === "box" && item.configuration) {
            const variant = item.configuration.variant || item.configuration.mix || "mix";
            linea += `\n  - Variedad: ${variant}`;

            if (item.configuration.likes?.length > 0 || item.configuration.dislikes?.length > 0) {
              linea += `\n  - Gustos: 👍 ${item.configuration.likes?.join(", ") || "ninguno"}`;
              linea += `\n  - Disgustos: 👎 ${item.configuration.dislikes?.join(", ") || "ninguno"}`;
            }
          }

          return linea;
        })
        .join("\n");
      
      console.log("Detalle del pedido:", detallePedido);

      // Crear desglose de totales
      let desgloseTotal = `Subtotal: DOP ${subtotal.toFixed(2)}`;
      if (cargoEnvio > 0) {
        desgloseTotal += `\nEnvío: DOP ${cargoEnvio.toFixed(2)}`;
      }
      if (cargoPaypal > 0) {
        const metodoTexto = metodoPago === "Tarjeta" ? "PayPal/Tarjeta" : "PayPal";
        desgloseTotal += `\nCargo ${metodoTexto} (10%): DOP ${cargoPaypal.toFixed(2)}`;
      }
      desgloseTotal += `\n*Total a Pagar: DOP ${totalFinalDOP.toFixed(2)}*`;
      
      // Agregar conversión a USD si es PayPal o Tarjeta
      if (requierePaypal && totalFinalUSD > 0) {
        desgloseTotal += `\n*Total en USD: $${totalFinalUSD.toFixed(2)}* (Tasa: 1 USD = 55 DOP)`;
      }

      // Crear mensaje para WhatsApp (SIEMPRE se envía primero)
      let mensajeWhatsApp = `¡Hola Green Dolio! 👋 Quisiera confirmar mi pedido:

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

      // Solo indicar el método de pago, sin links ni instrucciones adicionales
      // Green Dolio enviará los detalles del pago por WhatsApp después
      
      mensajeWhatsApp += `\n\n*📝 OBSERVACIONES:*\n${form.notes || "Sin observaciones."}`;
      
      // Nota final sobre detalles del pago
      mensajeWhatsApp += `\n\n*💬 Recibirás los detalles del pago por WhatsApp.*`;

      // Guardar en Firestore primero
      const db = getFirestoreDb();
      const firestoreItems = cartItemsToFirestore(items);
      const orderData = {
        userId: user.uid,
        cliente: form.contactName,
        telefono: form.contactPhone,
        email: form.contactEmail || undefined,
        direccion: form.direccion || "",
        diaEntrega: form.deliveryDay,
        observaciones: form.notes || undefined,
        metodoPago: metodoPago,
        items: firestoreItems,
        total: totalFinalDOP,
        totalUSD: requierePaypal ? totalFinalUSD : undefined,
        paypalLink: paypalLink || undefined,
        estado: requierePaypal ? "Pendiente Pago" : "Recibido",
        // fechaCreacion se agrega automáticamente con serverTimestamp() en saveOrderToFirestore
      };

      // Preparar URL de WhatsApp antes de guardar
      const numeroWhatsApp = "18493757338";
      
      // Log del mensaje completo para depuración
      console.log("=== MENSAJE DE WHATSAPP COMPLETO ===");
      console.log(mensajeWhatsApp);
      console.log("Longitud del mensaje:", mensajeWhatsApp.length);
      console.log("Primeros 300 caracteres:", mensajeWhatsApp.substring(0, 300));
      
      const mensajeCodificado = encodeURIComponent(mensajeWhatsApp);
      const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
      
      // Log de la URL para verificar
      console.log("=== URL DE WHATSAPP GENERADA ===");
      console.log("Longitud de la URL:", whatsappUrl.length);
      console.log("Primeros 300 caracteres de la URL:", whatsappUrl.substring(0, 300));
      
      // Verificar que el mensaje no esté vacío
      if (!mensajeWhatsApp || mensajeWhatsApp.trim().length === 0) {
        console.error("ERROR: El mensaje de WhatsApp está vacío!");
        toast.error("Error: No se pudo construir el mensaje del pedido.");
        setSubmitting(false);
        return;
      }

      // Guardar en Firestore primero
      try {
        console.log("Guardando pedido en Firestore...", { 
          userId: orderData.userId, 
          cliente: orderData.cliente,
          itemsCount: orderData.items.length 
        });
        const orderId = await saveOrderToFirestore(db, orderData);
        console.log("Pedido guardado en Firestore con ID:", orderId);
      } catch (firestoreError: any) {
        console.error("Error al guardar en Firestore:", firestoreError);
        console.error("Detalles del error:", {
          message: firestoreError?.message,
          code: firestoreError?.code,
        });
        // Continuar con el envío por WhatsApp aunque falle Firestore
        toast.error(`Error al guardar en Firestore: ${firestoreError?.message || "Error desconocido"}. El pedido se enviará por WhatsApp de todas formas.`, { duration: 5000 });
      }

      // Abrir WhatsApp con toda la información (SIEMPRE al final, después de guardar)
      console.log("Abriendo WhatsApp...");
      console.log("URL length:", whatsappUrl.length);
      
      // Verificar si la URL es demasiado larga (límite de WhatsApp es ~4096 caracteres)
      if (whatsappUrl.length > 4000) {
        console.warn("URL de WhatsApp muy larga, puede causar problemas");
        toast.error("El mensaje es muy largo. Por favor contacta directamente por WhatsApp.");
        setSubmitting(false);
        return;
      }
      
      // Usar método más confiable: crear link y hacer click programáticamente
      try {
        const link = document.createElement("a");
        link.href = whatsappUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.display = "none";
        document.body.appendChild(link);
        
        // Hacer click en el link
        link.click();
        
        // Limpiar después de un momento
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1000);
        
        console.log("WhatsApp abierto exitosamente");
      } catch (error) {
        console.error("Error al abrir WhatsApp:", error);
        // Fallback: intentar window.open
        try {
          const newWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          if (!newWindow) {
            // Si fue bloqueado, mostrar mensaje al usuario con opción de abrir manualmente
            toast.error("No se pudo abrir WhatsApp automáticamente. Por favor haz click en el botón de abajo para abrir WhatsApp manualmente.", {
              duration: 10000,
            });
            // Crear un botón visible para abrir WhatsApp
            const button = document.createElement("button");
            button.textContent = "Abrir WhatsApp";
            button.className = "fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50";
            button.onclick = () => {
              window.location.href = whatsappUrl;
              document.body.removeChild(button);
            };
            document.body.appendChild(button);
          }
        } catch (e) {
          console.error("Error en fallback:", e);
          toast.error("Error al abrir WhatsApp. Por favor contacta directamente por WhatsApp.", { duration: 8000 });
        }
      }

      // Mensaje de éxito
      if (requierePaypal) {
        toast.success("¡Pedido enviado! Revisa WhatsApp y completa el pago usando el link de PayPal. Recibirás los detalles del pago por WhatsApp.", { duration: 6000 });
      } else {
        toast.success("¡Pedido enviado con éxito! Revisa WhatsApp para confirmar. Recibirás los detalles del pago por WhatsApp.", { duration: 5000 });
      }
      
      // Limpiar carrito y redirigir después de enviar
      clear();
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("checkout.order_error");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Si showSummary es true, mostrar resumen del pedido
  if (showSummary) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Resumen del Pedido</p>
            <h1 className="font-display text-3xl text-[var(--color-foreground)]">Confirma tu Pedido</h1>
            <p className="text-sm text-[var(--color-muted)]">
              Revisa todos los detalles antes de enviar
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <section className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft">
              <OrderSummaryView 
                form={form}
                items={items}
                orderCalculations={orderCalculations}
              />
              
              <div className="pt-6 border-t-2 border-[var(--color-border)] space-y-4">
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-full rounded-full border-2 border-[var(--color-border)] px-8 py-4 text-base font-semibold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background-muted)]"
                >
                  ← Volver a Editar
                </button>
                <button
                  onClick={handleSendOrder}
                  disabled={submitting}
                  className="w-full rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>📱</span>
                      <span>Enviar Pedido por WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-soft">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{t("checkout.summary")}</p>
                <p className="font-display text-2xl text-[var(--color-foreground)]">{t("checkout.your_cart")}</p>
                <p className="text-sm text-[var(--color-muted)]">{items.length} {t("checkout.items")} · {metrics.itemCount} {t("checkout.units")}</p>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <CartLine key={`${item.slug}-${item.configuration ? "box" : "simple"}`} item={item} />
                ))}
              </div>
              <OrderSummary 
                subtotal={subtotal} 
                deliveryDay={form.deliveryDay} 
                metodoPago={form.metodoPago} 
              />
            </aside>
          </div>
        </div>
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
              {items.map((item) => (
                <CartLine key={`${item.slug}-${item.configuration ? "box" : "simple"}`} item={item} />
              ))}
            </div>
            <OrderSummary 
              subtotal={subtotal} 
              deliveryDay={form.deliveryDay} 
              metodoPago={form.metodoPago} 
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const { t } = useTranslation();
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
          <p>{t("checkout.mix")} {item.configuration?.mix || item.configuration?.variant || "mix"}</p>
          <p>{t("cart.delivery_zone")}: {item.configuration?.deliveryZone || t("checkout.delivery_to_define")} · {t("cart.delivery_day")}: {item.configuration?.deliveryDay || t("checkout.day_to_agree")}</p>
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
              {item.configuration.price.isACarta ? t("checkout.price_a_la_carta") : t("checkout.box_price")}: RD$
              {item.configuration.price.final.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
            </p>
          )}
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
  orderCalculations 
}: { 
  form: FormState; 
  items: CartItem[];
  orderCalculations: {
    cargoEnvio: number;
    metodoPago: string;
    subtotalConEnvio: number;
    requierePaypal: boolean;
    cargoPaypal: number;
    totalFinalDOP: number;
    totalFinalUSD: number;
    paypalLink: string;
  };
}) {
  const { t } = useTranslation();
  const { cargoEnvio, metodoPago, requierePaypal, cargoPaypal, totalFinalDOP, totalFinalUSD, paypalLink } = orderCalculations;
  
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
                    <p>{t("checkout.mix")} {item.configuration?.mix || item.configuration?.variant || "mix"}</p>
                    {item.configuration?.likes?.length > 0 && (
                      <p>👍 Gustos: {item.configuration.likes.join(", ")}</p>
                    )}
                    {item.configuration?.dislikes?.length > 0 && (
                      <p>👎 Disgustos: {item.configuration.dislikes.join(", ")}</p>
                    )}
                    {item.configuration?.selectedProducts && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(item.configuration.selectedProducts)
                          .filter(([, qty]) => qty && qty > 0)
                          .map(([slug, qty]) => (
                            <span key={slug} className="rounded-full bg-white px-2 py-1">
                              {slug} x{qty}
                            </span>
                          ))}
                      </div>
                    )}
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
