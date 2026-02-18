import { NextResponse } from "next/server";

import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { getAdminFirestore } from "@/lib/firebase/admin";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

type DashboardNotification = {
  id: string;
  type: "new_order" | "payment_received" | "new_customer" | "stock_warning";
  severity: "info" | "success" | "warning";
  title: string;
  message: string;
  timestamp: string;
  orderId?: string;
  customerId?: string;
};

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [ordersSnapshot, usersSnapshot] = await Promise.all([
      db.collection("orders").limit(500).get(),
      db.collection("users").limit(500).get(),
    ]);

    const notifications: DashboardNotification[] = [];

    let newOrders24h = 0;
    let payments24h = 0;
    let pendingPreparation = 0;
    let pendingPayments = 0;
    let stockWarnings = 0;

    ordersSnapshot.docs.forEach((orderDoc) => {
      const data = (orderDoc.data() ?? {}) as Record<string, unknown>;
      const orderId = orderDoc.id;
      const status = typeof data.status === "string" ? data.status : "";
      const paymentStatus = typeof data.paymentStatus === "string" ? data.paymentStatus : "unpaid";
      const createdAt = toDate(data.createdAt);
      const updatedAt = toDate(data.updatedAt) ?? createdAt;
      const delivery = data.delivery && typeof data.delivery === "object" ? (data.delivery as Record<string, unknown>) : null;
      const address = delivery?.address && typeof delivery.address === "object" ? (delivery.address as Record<string, unknown>) : null;
      const customerName = typeof address?.contactName === "string" ? address.contactName : "Cliente";

      const isActive = status !== "cancelled" && status !== "delivered" && status !== "finalized";

      if (isActive && ["pending", "confirmed", "preparing", "ready"].includes(status)) {
        pendingPreparation += 1;
      }

      if (isActive && paymentStatus !== "paid") {
        pendingPayments += 1;
      }

      const stockValidation =
        data.stockValidation && typeof data.stockValidation === "object"
          ? (data.stockValidation as Record<string, unknown>)
          : null;
      const hasStockWarning = Boolean(stockValidation?.hasInsufficientStock);
      if (hasStockWarning && isActive) {
        stockWarnings += 1;
        notifications.push({
          id: `stock-${orderId}`,
          type: "stock_warning",
          severity: "warning",
          title: "Stock insuficiente",
          message: `Pedido #${orderId.slice(0, 8)} de ${customerName} tiene items con stock insuficiente.`,
          timestamp: (updatedAt ?? now).toISOString(),
          orderId,
        });
      }

      if (createdAt && createdAt >= last24h && isActive) {
        newOrders24h += 1;
        notifications.push({
          id: `new-order-${orderId}`,
          type: "new_order",
          severity: "info",
          title: "Nuevo pedido",
          message: `Pedido #${orderId.slice(0, 8)} creado por ${customerName}.`,
          timestamp: createdAt.toISOString(),
          orderId,
        });
      }

      if (paymentStatus === "paid" && updatedAt && updatedAt >= last24h) {
        payments24h += 1;
        notifications.push({
          id: `payment-${orderId}`,
          type: "payment_received",
          severity: "success",
          title: "Pago recibido",
          message: `Pedido #${orderId.slice(0, 8)} marcado como pagado.`,
          timestamp: updatedAt.toISOString(),
          orderId,
        });
      }
    });

    let newCustomers7d = 0;
    usersSnapshot.docs.forEach((userDoc) => {
      const data = (userDoc.data() ?? {}) as Record<string, unknown>;
      const createdAt = toDate(data.createdAt) ?? toDate(data.fechaCreacion);
      if (!createdAt || createdAt < last7d) return;

      newCustomers7d += 1;
      const name =
        (typeof data.displayName === "string" && data.displayName) ||
        (typeof data.name === "string" && data.name) ||
        "Cliente";

      notifications.push({
        id: `new-customer-${userDoc.id}`,
        type: "new_customer",
        severity: "info",
        title: "Nuevo cliente",
        message: `${name} se registro recientemente.`,
        timestamp: createdAt.toISOString(),
        customerId: userDoc.id,
      });
    });

    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(
      {
        data: {
          counters: {
            newOrders24h,
            payments24h,
            newCustomers7d,
            pendingPreparation,
            pendingPayments,
            stockWarnings,
          },
          notifications: notifications.slice(0, 25),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Dashboard Notifications Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
