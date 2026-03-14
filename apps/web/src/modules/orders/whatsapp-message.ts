import type { Order, OrderDelivery, OrderItem } from "./types";

type LanguageCode = "es" | "en";

type ProductLabelEntry = { es?: string; en?: string } | string;
export type ProductLabelMap = Map<string, ProductLabelEntry>;

export type OrderTotalsSummary = {
  subtotal: number;
  deliveryFee: number;
  paymentFee: number;
  discount?: number;
  returnDiscount?: number;
  tip?: number;
  total: number;
};

export type OrderConfirmationMessageInput = {
  order: Order;
  language: LanguageCode;
  customerName?: string;
  customerPhone?: string;
  delivery?: OrderDelivery;
  timeWindow?: { start?: string; end?: string };
  totals?: OrderTotalsSummary;
  productLabelMap?: ProductLabelMap;
};

type BoxConfig = {
  mix?: string;
  variant?: string;
  likes?: string[];
  dislikes?: string[];
  selectedProducts?: Record<string, number>;
  notes?: string;
  deliveryZone?: string;
  deliveryDay?: string;
};

type ItemMetadata = {
  excludedIngredients?: string[];
  notes?: string;
  configuration?: BoxConfig;
};

const LABELS = {
  es: {
    greeting: (name: string, id: string) => `¡Hola ${name}! 👋 Tu pedido #${id} está confirmado.`,
    customerDetails: "*👤 DATOS DEL CLIENTE:*",
    orderSummary: "*🛒 RESUMEN DEL PEDIDO:*",
    totals: "*💰 TOTALES:*",
    paymentMethod: "*💳 MÉTODO DE PAGO:*",
    notes: "*📝 OBSERVACIONES:*",
    deliveryDay: "Día de entrega",
    deliveryWindow: "Ventana de entrega",
    name: "Nombre",
    address: "Dirección",
    city: "Ciudad",
    zone: "Zona",
    phone: "Teléfono",
    email: "Email",
    variety: "Variedad",
    likes: "Gustos",
    dislikes: "Evitar",
    excludedIngredients: "Ingredientes a excluir",
    itemNotes: "Notas",
    selection: "Selección",
    subtotal: "Subtotal",
    shipping: "Envío",
    paymentFee: "Cargo pago digital (10%)",
    returnDiscount: "Descuento devolución envases",
    discount: "Descuento",
    tip: "Propina",
    cashCurrency: "Moneda en efectivo",
    cashExchangeRate: "Tasa aplicada",
    cashPaidWith: "Paga con",
    cashChangeDue: "Cambio a devolver",
    cashRemaining: "Monto pendiente",
    totalPay: "Total a pagar",
    noNotes: "Sin observaciones.",
    noEmail: "No proporcionado",
    toBeConfirmed: "Por confirmar",
    footer: "Te avisaremos cuando el pedido vaya en camino.",
  },
  en: {
    greeting: (name: string, id: string) => `Hi ${name}! 👋 Your order #${id} is confirmed.`,
    customerDetails: "*👤 CUSTOMER DETAILS:*",
    orderSummary: "*🛒 ORDER SUMMARY:*",
    totals: "*💰 TOTALS:*",
    paymentMethod: "*💳 PAYMENT METHOD:*",
    notes: "*📝 NOTES:*",
    deliveryDay: "Delivery day",
    deliveryWindow: "Delivery window",
    name: "Name",
    address: "Address",
    city: "City",
    zone: "Zone",
    phone: "Phone",
    email: "Email",
    variety: "Variety",
    likes: "Likes",
    dislikes: "Avoid",
    excludedIngredients: "Excluded ingredients",
    itemNotes: "Notes",
    selection: "Selection",
    subtotal: "Subtotal",
    shipping: "Delivery",
    paymentFee: "Online payment fee (10%)",
    returnDiscount: "Packaging return discount",
    discount: "Discount",
    tip: "Tip",
    cashCurrency: "Cash currency",
    cashExchangeRate: "Applied exchange rate",
    cashPaidWith: "Pays with",
    cashChangeDue: "Change due",
    cashRemaining: "Pending amount",
    totalPay: "Total to pay",
    noNotes: "No notes.",
    noEmail: "Not provided",
    toBeConfirmed: "To be confirmed",
    footer: "We will notify you when the order is on its way.",
  },
};

const VARIANT_LABELS = {
  es: {
    mix: "Mixta",
    fruity: "Frutas",
    veggie: "Vegetales",
  },
  en: {
    mix: "Mix",
    fruity: "Fruits",
    veggie: "Vegetables",
  },
};

const PAYMENT_LABELS = {
  es: {
    cash: "Efectivo",
    transfer: "Transferencia",
    transfer_popular: "Transferencia Banco Popular",
    transfer_qik: "Transferencia Qik",
    card: "Tarjeta",
    online: "PayPal/Online",
    other: "Otro",
  },
  en: {
    cash: "Cash",
    transfer: "Bank transfer",
    transfer_popular: "Banco Popular transfer",
    transfer_qik: "Qik transfer",
    card: "Card",
    online: "PayPal/Online",
    other: "Other",
  },
};

type PaymentKey = keyof typeof PAYMENT_LABELS["es"];

function resolveVariantKey(variant?: string, mix?: string) {
  if (variant === "fruity" || variant === "veggie" || variant === "mix") return variant;
  if (mix === "frutas") return "fruity";
  if (mix === "vegetales") return "veggie";
  return "mix";
}

function normalizePaymentMethod(value?: string): PaymentKey {
  const key = (value || "").toLowerCase();
  if (!key) return "other";
  if (key.includes("popular")) return "transfer_popular";
  if (key.includes("qik")) return "transfer_qik";
  if (key.includes("transfer")) return "transfer";
  if (key.includes("cash") || key.includes("efectivo")) return "cash";
  if (key.includes("card") || key.includes("tarjeta")) return "card";
  if (key.includes("online") || key.includes("paypal")) return "online";
  return "other";
}

function formatMoney(amount: number, currency = "DOP") {
  if (Number.isNaN(amount)) return `${currency} 0.00`;
  return `${currency} ${amount.toFixed(2)}`;
}

function resolveItemName(item: OrderItem, language: LanguageCode) {
  const name = item.name as unknown;
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    const localized = name as { es?: string; en?: string };
    return localized[language] || localized.es || localized.en || item.referenceId || item.id;
  }
  return item.referenceId || item.id;
}

function resolvePreferenceLabel(
  value: string,
  language: LanguageCode,
  productLabelMap?: ProductLabelMap,
) {
  const entry =
    productLabelMap?.get(value) ??
    productLabelMap?.get(value.toLowerCase()) ??
    productLabelMap?.get(value.toUpperCase());

  if (entry) {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") {
      return entry[language] || entry.es || entry.en || value;
    }
  }
  return value;
}

function resolveBoxConfig(item: OrderItem): BoxConfig | null {
  if (item.type !== "box" || !item.metadata || typeof item.metadata !== "object") return null;
  const metadata = item.metadata as ItemMetadata;
  if (metadata.configuration && typeof metadata.configuration === "object") {
    return metadata.configuration as BoxConfig;
  }
  return metadata as BoxConfig;
}

function extractArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter(Boolean);
}

function extractSelectedProducts(value: unknown): Array<[string, number]> {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, number>)
    .map(([key, qty]) => [key, Number(qty)] as [string, number])
    .filter(([, qty]) => Number.isFinite(qty) && qty > 0);
}

function buildItemsDetail(
  items: OrderItem[],
  language: LanguageCode,
  productLabelMap?: ProductLabelMap,
  currency?: string,
) {
  if (!items.length) return language === "en" ? "(No items)" : "(Sin items)";

  return items
    .map((item) => {
      const itemName = resolveItemName(item, language);
      const lineTotal = item.unitPrice.amount * item.quantity;
      const line = `• ${itemName} (x${item.quantity}) - ${formatMoney(lineTotal, currency)}`;
      const subLines: string[] = [];

      if (item.type === "box") {
        const config = resolveBoxConfig(item);
        if (config) {
          if (config.variant || config.mix) {
            const variantKey = resolveVariantKey(config.variant, config.mix);
            const variantLabel = VARIANT_LABELS[language][variantKey as keyof typeof VARIANT_LABELS["es"]];
            if (variantLabel) {
              subLines.push(`${LABELS[language].variety}: ${variantLabel}`);
            }
          }

          const likes = extractArray(config.likes).map((value) =>
            resolvePreferenceLabel(value, language, productLabelMap),
          );
          const dislikes = extractArray(config.dislikes).map((value) =>
            resolvePreferenceLabel(value, language, productLabelMap),
          );

          if (likes.length > 0) {
            subLines.push(`${LABELS[language].likes}: 👍 ${likes.join(", ")}`);
          }
          if (dislikes.length > 0) {
            subLines.push(`${LABELS[language].dislikes}: 👎 ${dislikes.join(", ")}`);
          }

          const selectedProducts = extractSelectedProducts(config.selectedProducts);
          if (selectedProducts.length > 0) {
            const selectionText = selectedProducts
              .map(([slug, qty]) => `${resolvePreferenceLabel(slug, language, productLabelMap)} x${qty}`)
              .join(", ");
            subLines.push(`${LABELS[language].selection}: ${selectionText}`);
          }

          if (config.notes) {
            subLines.push(`${LABELS[language].itemNotes}: ${config.notes}`);
          }
        }
      }

      if (item.metadata && typeof item.metadata === "object") {
        const metadata = item.metadata as ItemMetadata;
        if (metadata.excludedIngredients?.length) {
          subLines.push(`${LABELS[language].excludedIngredients}: ${metadata.excludedIngredients.join(", ")}`);
        }
        if (metadata.notes) {
          subLines.push(`${LABELS[language].itemNotes}: ${metadata.notes}`);
        }
      }

      if (subLines.length === 0) return line;
      return `${line}\n${subLines.map((subLine) => `  - ${subLine}`).join("\n")}`;
    })
    .join("\n");
}

export function buildOrderConfirmationMessage({
  order,
  language,
  customerName,
  customerPhone,
  delivery,
  timeWindow,
  totals,
  productLabelMap,
}: OrderConfirmationMessageInput) {
  const labels = LABELS[language];
  const orderDelivery = delivery || order.delivery;
  const rawName = customerName || orderDelivery?.address?.contactName || "";
  const nameForGreeting = rawName || (language === "en" ? "there" : "cliente");

  const currency = order.totals?.total?.currency || "DOP";
  const subtotal = totals?.subtotal ?? order.totals?.subtotal?.amount ?? 0;
  const deliveryFee = totals?.deliveryFee ?? order.totals?.deliveryFee?.amount ?? 0;
  const paymentFee = totals?.paymentFee ?? order.totals?.paymentFee?.amount ?? 0;
  const discount =
    totals?.discount ??
    order.totals?.discounts?.amount ??
    ((order.totals as { discount?: { amount?: number } }).discount?.amount ?? 0);
  const explicitReturnDiscount = totals?.returnDiscount ?? 0;
  const orderReturnDiscount = order.returnsPackaging?.returned ? (order.returnsPackaging.discountAmount ?? 0) : 0;
  const returnDiscount = explicitReturnDiscount > 0 ? explicitReturnDiscount : orderReturnDiscount;
  const otherDiscount = Math.max(0, discount - returnDiscount);
  const tip = totals?.tip ?? order.totals?.tip?.amount ?? order.tip?.amount ?? 0;
  const total =
    totals?.total ?? order.totals?.total?.amount ?? subtotal + deliveryFee + paymentFee - discount + tip;

  const deliveryDay = orderDelivery?.window?.day || labels.toBeConfirmed;
  const timeStart = timeWindow?.start?.trim() || "";
  const timeEnd = timeWindow?.end?.trim() || "";
  const computedSlot = timeStart && timeEnd ? `${timeStart} - ${timeEnd}` : "";
  const slotCandidate = (orderDelivery?.window?.slot || "").trim();
  const slotIsValid = Boolean(slotCandidate) && slotCandidate.replace(/\s/g, "") !== "-";
  const slot = computedSlot || (slotIsValid ? slotCandidate : "") || labels.toBeConfirmed;

  const addressLabel = orderDelivery?.address?.label || "";
  const city = orderDelivery?.address?.city || "";
  const zone = orderDelivery?.address?.zone || "";
  const phone = customerPhone || orderDelivery?.address?.phone || "";
  const email = order.guestEmail?.trim() || labels.noEmail;
  const notes = orderDelivery?.notes || orderDelivery?.address?.notes || labels.noNotes;

  const itemsDetail = buildItemsDetail(order.items, language, productLabelMap, currency);

  const totalsLines = [
    `${labels.subtotal}: ${formatMoney(subtotal, currency)}`,
  ];

  if (deliveryFee > 0) {
    totalsLines.push(`${labels.shipping}: ${formatMoney(deliveryFee, currency)}`);
  }

  if (paymentFee > 0) {
    totalsLines.push(`${labels.paymentFee}: ${formatMoney(paymentFee, currency)}`);
  }

  if (returnDiscount > 0) {
    totalsLines.push(`${labels.returnDiscount}: -${formatMoney(returnDiscount, currency)}`);
  }

  if (otherDiscount > 0) {
    totalsLines.push(`${labels.discount}: -${formatMoney(otherDiscount, currency)}`);
  }

  if (tip > 0) {
    totalsLines.push(`${labels.tip}: ${formatMoney(tip, currency)}`);
  }

  totalsLines.push(`*${labels.totalPay}: ${formatMoney(total, currency)}*`);

  const paymentMethodRaw = order.paymentMethod || order.payment?.method || "";
  const paymentKey = normalizePaymentMethod(paymentMethodRaw);
  const paymentLabel = PAYMENT_LABELS[language][paymentKey];
  const cashPayment = order.payment?.cash || order.paymentCash;
  const paymentLines = [paymentLabel || PAYMENT_LABELS[language].other];

  if (paymentKey === "cash" && cashPayment) {
    paymentLines.push(`- ${labels.cashCurrency}: ${cashPayment.currency}`);
    if (cashPayment.currency === "USD") {
      paymentLines.push(`- ${labels.cashExchangeRate}: 1 USD = ${cashPayment.exchangeRateDop} DOP`);
      paymentLines.push(`- ${labels.totalPay}: ${formatMoney(cashPayment.amountDue, "USD")}`);
    }
    if (cashPayment.requiresChange && cashPayment.paidWithAmount && cashPayment.paidWithAmount > 0) {
      paymentLines.push(`- ${labels.cashPaidWith}: ${formatMoney(cashPayment.paidWithAmount, cashPayment.currency)}`);
      if ((cashPayment.changeAmount || 0) > 0) {
        paymentLines.push(`- ${labels.cashChangeDue}: ${formatMoney(cashPayment.changeAmount || 0, cashPayment.currency)}`);
      } else if ((cashPayment.remainingAmount || 0) > 0) {
        paymentLines.push(`- ${labels.cashRemaining}: ${formatMoney(cashPayment.remainingAmount || 0, cashPayment.currency)}`);
      }
    }
  }

  return [
    labels.greeting(nameForGreeting, order.id),
    "",
    labels.customerDetails,
    `- ${labels.name}: ${rawName || labels.toBeConfirmed}`,
    `- ${labels.phone}: ${phone || labels.toBeConfirmed}`,
    `- ${labels.email}: ${email || labels.noEmail}`,
    `- ${labels.address}: ${addressLabel || labels.toBeConfirmed}`,
    `- ${labels.city}: ${city || labels.toBeConfirmed}`,
    `- ${labels.zone}: ${zone || labels.toBeConfirmed}`,
    `- ${labels.deliveryDay}: ${deliveryDay || labels.toBeConfirmed}`,
    `- ${labels.deliveryWindow}: ${slot || labels.toBeConfirmed}`,
    "",
    labels.orderSummary,
    itemsDetail,
    "",
    labels.totals,
    totalsLines.join("\n"),
    "",
    labels.paymentMethod,
    paymentLines.join("\n"),
    "",
    labels.notes,
    notes || labels.noNotes,
    "",
    labels.footer,
  ].join("\n");
}
