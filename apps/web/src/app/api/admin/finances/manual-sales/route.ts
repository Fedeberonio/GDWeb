import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const MANUAL_SALES_COLLECTION = "manual_sales";
const ORDERS_COLLECTION = "orders";

type ManualSaleItem = {
  productId: string;
  productSku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

function buildInvoiceId(seed: string) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shortSeed = seed.slice(0, 6).toUpperCase();
  return `INV-${datePart}-${shortSeed}`;
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const body = await request.json();
    const items = Array.isArray(body.items) ? (body.items as ManualSaleItem[]) : [];

    if (!body?.customer?.name || !body?.customer?.phone || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const currency = typeof body.currency === "string" && body.currency ? body.currency : "DOP";
    const totalAmount =
      typeof body.total === "number" && Number.isFinite(body.total)
        ? body.total
        : items.reduce((sum, item) => sum + (item.total || 0), 0);

    const manualSaleRef = db.collection(MANUAL_SALES_COLLECTION).doc();
    const invoiceId = buildInvoiceId(manualSaleRef.id);
    const orderId = `manual-${manualSaleRef.id}`;

    const manualSalePayload = {
      id: manualSaleRef.id,
      type: "manual",
      invoiceId,
      orderId,
      customer: {
        name: body.customer.name,
        phone: body.customer.phone,
      },
      items: items.map((item) => ({
        productId: item.productId,
        productSku: item.productSku ?? null,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      total: totalAmount,
      currency,
      notes: typeof body.notes === "string" ? body.notes : "",
      paymentStatus: body.paymentStatus ?? "paid",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await manualSaleRef.set(manualSalePayload);

    const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
    const orderItems = items.map((item) => {
      const referenceId = item.productSku ?? item.productId;
      const name = item.name;
      return {
        id: referenceId,
        type: "product",
        referenceId,
        name: { es: name, en: name },
        quantity: item.quantity,
        unitPrice: { amount: item.unitPrice, currency },
        metadata: {
          productId: item.productId,
          productSku: item.productSku ?? null,
        },
      };
    });

    const orderPayload = {
      id: orderId,
      invoiceId,
      items: orderItems,
      totals: {
        subtotal: { amount: totalAmount, currency },
        total: { amount: totalAmount, currency },
      },
      status: "confirmed",
      delivery: {
        address: {
          label: "Venta manual",
          contactName: body.customer.name,
          phone: body.customer.phone,
          city: "N/D",
          zone: "N/D",
          notes: typeof body.notes === "string" ? body.notes : "",
        },
      },
      payment: {
        method: "cash",
        status: body.paymentStatus ?? "paid",
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await orderRef.set(orderPayload, { merge: true });

    return NextResponse.json(
      {
        data: {
          id: manualSaleRef.id,
          invoiceId,
          orderId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Manual Sale Save Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
