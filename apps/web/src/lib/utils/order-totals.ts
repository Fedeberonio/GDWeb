export interface OrderItem {
  quantity: number;
  unitPrice: { amount: number; currency?: string };
}

export interface OrderTotalsParams {
  items: OrderItem[];
  deliveryDay?: string;
  paymentMethod?: string;
  manualDiscount?: number;
}

type OrderTotalsSettings = {
  paymentFeePercentage?: number;
  deliveryFeeAmount?: number;
  deliveryFeeDays?: string[];
};

export function calculateOrderTotals(
  params: OrderTotalsParams,
  settings?: OrderTotalsSettings
) {
  const { items, deliveryDay, paymentMethod, manualDiscount = 0 } = params;

  const paymentFeePercentage = settings?.paymentFeePercentage ?? 10;
  const deliveryFeeAmount = settings?.deliveryFeeAmount ?? 100;
  const deliveryFeeDays = settings?.deliveryFeeDays ?? ["Martes", "Jueves", "Sábado"];

  // Calculate subtotal from items
  const subtotalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice.amount);
  }, 0);

  // Delivery fee logic (same as checkout)
  const cargoEnvio = deliveryDay && deliveryFeeDays.includes(deliveryDay) ? deliveryFeeAmount : 0;

  // PayPal/Card fee logic (same as checkout)
  const methodLower = (paymentMethod || "").toLowerCase();
  const requierePaypal =
    methodLower === "online" ||     // PayPal from public checkout
    methodLower === "card" ||       // Card from checkout and admin
    methodLower === "paypal" ||     // Legacy
    methodLower === "tarjeta" ||    // Legacy
    methodLower.includes("credit");
  const subtotalConEnvio = subtotalAmount + cargoEnvio;
  const cargoPaypal = requierePaypal ? Math.round(subtotalConEnvio * (paymentFeePercentage / 100)) : 0;

  // Total calculation
  const totalAmount = subtotalConEnvio + cargoPaypal - manualDiscount;

  return {
    subtotal: { amount: subtotalAmount, currency: "DOP" },
    deliveryFee: { amount: cargoEnvio, currency: "DOP" },
    paymentFee: { amount: cargoPaypal, currency: "DOP" },
    discount: { amount: manualDiscount, currency: "DOP" },
    total: { amount: totalAmount, currency: "DOP" },
  };
}
