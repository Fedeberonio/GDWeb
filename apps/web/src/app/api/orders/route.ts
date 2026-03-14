import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase/admin";
import { loadOrderSettings } from "@/lib/config/load-order-settings";
import { DEFAULT_ORDER_SETTINGS } from "@/lib/config/order-settings";

// Tipos básicos para el payload (simplificados)
type OrderPayload = {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  deliveryDay?: string;
  deliveryZone?: string;
  notes?: string;
  paymentMethod?: string;
  returnsPackaging?: boolean;
  returnDiscountAmount?: number;
  tipAmount?: number;
  tipType?: "none" | "10" | "15" | "20" | "custom";
  cashPayment?: {
    currency?: "DOP" | "USD";
    exchangeRateDop?: number;
    amountDue?: number;
    requiresChange?: boolean;
    paidWithAmount?: number | null;
    changeAmount?: number;
    remainingAmount?: number;
  };
  items: CheckoutLineItem[];
};

type CheckoutLineItem = {
  id?: string;
  slug?: string;
  productId?: string;
  type?: string;
  name?: string;
  quantity?: number;
  price?: number;
  metadata?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
};

type CatalogProductDoc = {
  metadata?: {
    stock?: number;
  };
  name?: unknown;
};

type InsufficientStockItem = {
  id: string;
  name?: string;
  requested: number;
  available: number;
};

function getLabel(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return fallback;

  const record = value as Record<string, unknown>;
  if (typeof record.es === "string") return record.es;
  if (typeof record.en === "string") return record.en;
  return fallback;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizePaymentMethod(value?: string) {
  const key = (value || "").toLowerCase();
  if (!key) return "cash";
  if (key.includes("tarjeta") || key.includes("card")) return "card";
  if (key.includes("paypal") || key.includes("online")) return "online";
  if (key.includes("transfer")) return "transfer";
  if (key.includes("cash") || key.includes("efectivo")) return "cash";
  return "cash";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as OrderPayload;
    const orderSettings = await loadOrderSettings();
    const returnDiscountBase = orderSettings.returnDiscountAmount ?? DEFAULT_ORDER_SETTINGS.returnDiscountAmount;
    const usdExchangeRateDop = orderSettings.usdExchangeRateDop ?? DEFAULT_ORDER_SETTINGS.usdExchangeRateDop;

    // Validación básica
    if (!body.contactName || !body.contactPhone || !body.items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // AUTH IDENTITY
    let userId = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch (e) {
        console.warn("Failed to verify ID token in order creation:", e);
        // Continue as guest
      }
    }

    // Calcular Totales (Replicando lógica del cliente para consistencia inicial)
    const diasConCargo = ["Martes", "Jueves", "Sábado"];
    const deliveryDay = body.deliveryDay || "";
    const deliveryFeeAmount = diasConCargo.includes(deliveryDay) ? 100 : 0;

    // Calcular subtotal
    const subtotal = body.items.reduce((sum: number, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    // Calcular fee de PayPal si aplica
    const normalizedPaymentMethod = normalizePaymentMethod(body.paymentMethod);
    const isPayPal = normalizedPaymentMethod === "online" || normalizedPaymentMethod === "card";
    const paypalFeeAmount = isPayPal ? (subtotal + deliveryFeeAmount) * 0.10 : 0;
    const returnsPackaging = body.returnsPackaging === true;
    const returnDiscountAmount = returnsPackaging ? returnDiscountBase : 0;
    const tipAmountRaw = Number(body.tipAmount ?? 0);
    const tipAmount = Number.isFinite(tipAmountRaw) && tipAmountRaw > 0 ? tipAmountRaw : 0;
    const tipType = body.tipType ?? "none";
    const tipPercentPresets = new Set(["10", "15", "20"]);
    const normalizedTipType: "none" | "10" | "15" | "20" | "custom" =
      tipType === "custom" || tipPercentPresets.has(tipType) ? (tipType as "10" | "15" | "20" | "custom") : "none";

    const totalAmount = Math.max(0, subtotal + deliveryFeeAmount + paypalFeeAmount - returnDiscountAmount + tipAmount);
    const isCashPayment = normalizedPaymentMethod === "cash";
    const cashCurrency = body.cashPayment?.currency === "USD" ? "USD" : "DOP";
    const cashAmountDue = isCashPayment
      ? roundMoney(cashCurrency === "USD" ? totalAmount / usdExchangeRateDop : totalAmount)
      : 0;
    const cashRequiresChange = isCashPayment && body.cashPayment?.requiresChange === true;
    const cashPaidWithRaw = Number(body.cashPayment?.paidWithAmount ?? 0);
    const cashPaidWithAmount =
      cashRequiresChange && Number.isFinite(cashPaidWithRaw) && cashPaidWithRaw > 0
        ? roundMoney(cashPaidWithRaw)
        : null;
    const cashChangeAmount =
      cashRequiresChange && cashPaidWithAmount !== null && cashPaidWithAmount > cashAmountDue
        ? roundMoney(cashPaidWithAmount - cashAmountDue)
        : 0;
    const cashRemainingAmount =
      cashRequiresChange && cashPaidWithAmount !== null && cashPaidWithAmount < cashAmountDue
        ? roundMoney(cashAmountDue - cashPaidWithAmount)
        : 0;
    const cashPaymentDetails = isCashPayment
      ? {
        currency: cashCurrency,
        exchangeRateDop: usdExchangeRateDop,
        amountDue: cashAmountDue,
        requiresChange: cashRequiresChange,
        paidWithAmount: cashPaidWithAmount,
        changeAmount: cashChangeAmount,
        remainingAmount: cashRemainingAmount,
      }
      : null;

    const db = getAdminFirestore();
    let returnStatsForOrder: { totalReturns: number; qualifiesForSpecialReward: boolean } | null = null;

    // --- VALIDACIÓN DE STOCK (solo products, NO BLOQUEA EL PEDIDO) ---
    const stockValidation: {
      hasInsufficientStock: boolean;
      checkedAt: string;
      items: InsufficientStockItem[];
    } = {
      hasInsufficientStock: false,
      checkedAt: new Date().toISOString(),
      items: [],
    };

    const productItems = body.items.filter((item) => (item.type || "product") === "product");
    if (productItems.length > 0) {
      const requestedById = new Map<string, { requested: number; name?: string }>();
      productItems.forEach((item) => {
        const productId = String(item.productId || item.slug || item.id || "").trim();
        if (!productId) return;
        const requestedQty = Number(item.quantity) || 0;
        if (requestedQty <= 0) return;
        const previous = requestedById.get(productId);
        requestedById.set(productId, {
          requested: (previous?.requested || 0) + requestedQty,
          name: previous?.name || item.name,
        });
      });

      const requestedIds = Array.from(requestedById.keys());
      const productRefs = requestedIds.map((productId) => db.collection("catalog_products").doc(productId));

      if (productRefs.length > 0) {
        const productDocs = await db.getAll(...productRefs);
        const foundIds = new Set<string>();

        productDocs.forEach((docSnap) => {
          if (!docSnap.exists) return;
          foundIds.add(docSnap.id);
          const data = docSnap.data() as CatalogProductDoc;
          const currentStock = data?.metadata?.stock ?? 0;
          const requestedItem = requestedById.get(docSnap.id);
          if (!requestedItem) return;

          const requestedQty = requestedItem.requested;
          if (currentStock < requestedQty) {
            stockValidation.items.push({
              id: docSnap.id,
              name: getLabel(data?.name, getLabel(requestedItem.name, docSnap.id)),
              requested: requestedQty,
              available: currentStock,
            });
          }
        });

        requestedIds.forEach((productId) => {
          if (foundIds.has(productId)) return;
          const requestedItem = requestedById.get(productId);
          if (!requestedItem) return;
          stockValidation.items.push({
            id: productId,
            name: getLabel(requestedItem.name, productId),
            requested: requestedItem.requested,
            available: 0,
          });
        });
      }
    }
    stockValidation.hasInsufficientStock = stockValidation.items.length > 0;
    if (stockValidation.hasInsufficientStock) {
      console.warn("Order created with insufficient stock warning:", stockValidation.items);
    }
    // --- FIN VALIDACIÓN DE STOCK ---

    // Construir objeto de orden
    const orderData = {
      status: "pending",
      paymentStatus: "unpaid", // Root level
      paymentMethod: normalizedPaymentMethod, // Root level
      userId: userId, // Identity
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      guestEmail: body.contactEmail || null,
      delivery: {
        address: {
          contactName: body.contactName,
          phone: body.contactPhone,
          label: body.address || "Dirección principal",
          city: "Santo Domingo",
          zone: body.deliveryZone || "Zona Metropolitana",
          notes: body.notes || null, // FIX: Avoid undefined
        },
        window: {
          day: deliveryDay,
          slot: "12:30 PM - 8:00 PM"
        }
      },
      payment: { // Keep for backward compatibility if needed, but rely on root
        method: normalizedPaymentMethod,
        status: "pending",
        ...(cashPaymentDetails ? { cash: cashPaymentDetails } : {}),
      },
      items: body.items.map((item) => ({
        id: item.slug || item.id, // Fallback
        productId: item.slug || item.id, // Ensure productId exists for restoration
        type: item.type || "product",
        name: { es: item.name, en: item.name }, // Simple map
        quantity: item.quantity,
        unitPrice: { amount: item.price, currency: "DOP" },
        startPrice: { amount: item.price, currency: "DOP" },
        metadata: item.metadata || item.configuration || {}
      })),
      totals: {
        subtotal: { amount: subtotal, currency: "DOP" },
        deliveryFee: { amount: deliveryFeeAmount, currency: "DOP" },
        paymentFee: { amount: paypalFeeAmount, currency: "DOP" },
        discounts: { amount: returnDiscountAmount, currency: "DOP" },
        tip: { amount: tipAmount, currency: "DOP" },
        total: { amount: totalAmount, currency: "DOP" }
      },
      returnsPackaging: {
        returned: returnsPackaging,
        discountAmount: returnDiscountAmount,
      },
      tip: {
        amount: tipAmount,
        type: normalizedTipType,
      },
      ...(cashPaymentDetails ? { paymentCash: cashPaymentDetails } : {}),
      ...(stockValidation.hasInsufficientStock ? { stockValidation } : {})
    };

    const docRef = await db.collection("orders").add(orderData);

    if (userId && returnsPackaging) {
      const userRef = db.collection("users").doc(userId);
      returnStatsForOrder = await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const currentReturnsRaw = userSnap.exists ? (userSnap.data() as { returnStats?: { totalReturns?: number } })?.returnStats?.totalReturns : 0;
        const currentReturns = Number(currentReturnsRaw) || 0;
        const nextReturns = currentReturns + 1;
        const qualifiesForSpecialReward = nextReturns >= 5;

        transaction.set(
          userRef,
          {
            returnStats: {
              totalReturns: nextReturns,
              qualifiesForSpecialReward,
              lastReturnAt: FieldValue.serverTimestamp(),
            },
            returnHistory: FieldValue.arrayUnion({
              orderId: docRef.id,
              returnedAt: new Date().toISOString(),
              discountAmount: returnDiscountAmount,
            }),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return { totalReturns: nextReturns, qualifiesForSpecialReward };
      });

      await docRef.update({
        returnsPackaging: {
          returned: true,
          discountAmount: returnDiscountAmount,
          customerReturnCountAfterOrder: returnStatsForOrder.totalReturns,
          qualifiesForSpecialReward: returnStatsForOrder.qualifiesForSpecialReward,
        },
      });
    }

    return NextResponse.json({
      success: true,
      id: docRef.id,
      data: { id: docRef.id }, // Compatibilidad con ambos formatos
      stockWarning: stockValidation.hasInsufficientStock ? stockValidation : null,
      returnStats: returnStatsForOrder,
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating order in Firestore:", error);
    return NextResponse.json({ error: "Error interno al crear la orden" }, { status: 500 });
  }
}
