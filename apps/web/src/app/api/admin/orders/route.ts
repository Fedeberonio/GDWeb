import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { FieldValue } from "firebase-admin/firestore";
import type { Order } from "@/modules/orders/types";

// Helper to recursively serialize dates/timestamps
function serializeData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeData);
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeData(data[key]);
    }
    return result;
  }

  return data;
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const limit = isNaN(limitParam) ? 50 : Math.min(limitParam, 100);

    const db = getAdminFirestore();
    const ordersRef = db.collection("orders");
    const snapshot = await ordersRef
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Use recursive serialization to catch nested Timestamps
      return {
        id: doc.id,
        ...serializeData(data),
        // Fallback/Ensure top level fields are definitely strings (already handled by serializeData but keeping specific overrides is safe)
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        paymentStatus: data.paymentStatus || data.payment?.status || "unpaid",
        paymentMethod: data.paymentMethod || data.payment?.method || "other",
      };
    });

    return NextResponse.json({ data: orders });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

type AdminOrderItemInput = {
  id: string;
  productId?: string;
  type?: "product" | "box" | "addon";
  name: string;
  quantity: number;
  unitPrice?: number;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const body = await request.json();

    const items = Array.isArray(body?.items) ? (body.items as AdminOrderItemInput[]) : [];
    if (!items.length) {
      return NextResponse.json({ error: "Debe agregar al menos un item." }, { status: 400 });
    }

    const contactName = String(body?.contactName ?? "").trim();
    const contactPhone = String(body?.contactPhone ?? "").trim();
    if (!contactName || !contactPhone) {
      return NextResponse.json({ error: "Nombre y teléfono son requeridos." }, { status: 400 });
    }

    const paymentMethod = String(body?.paymentMethod ?? "cash");
    const paymentStatus = String(body?.paymentStatus ?? "unpaid");
    const deliveryFeeAmount = Number(body?.deliveryFee ?? 0) || 0;
    const deliveryDay = String(body?.deliveryDay ?? "");
    const deliveryWindow = String(body?.deliveryWindow ?? "");
    const deliveryZone = String(body?.deliveryZone ?? "Zona Metropolitana");
    const addressLabel = String(body?.address ?? "Dirección principal");

    const subtotalAmount = items.reduce((sum, item) => {
      const unitPrice = Number(item.unitPrice ?? 0) || 0;
      const quantity = Number(item.quantity ?? 0) || 0;
      return sum + unitPrice * quantity;
    }, 0);

    const totalAmount = subtotalAmount + deliveryFeeAmount;

    const orderData = {
      status: "pending",
      paymentStatus,
      paymentMethod,
      userId: body?.userId ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      guestEmail: body?.userId ? null : (body?.contactEmail ?? null),
      delivery: {
        address: {
          contactName,
          phone: contactPhone,
          label: addressLabel,
          city: "Santo Domingo",
          zone: deliveryZone,
          notes: body?.notes ?? null,
        },
        window: {
          day: deliveryDay,
          slot: deliveryWindow || "12:30 PM - 8:00 PM",
        },
      },
      payment: {
        method: paymentMethod,
        status: paymentStatus,
      },
      items: items.map((item) => {
        const unitPrice = Number(item.unitPrice ?? 0) || 0;
        return {
          id: item.id,
          productId: item.productId ?? item.id,
          type: item.type ?? "product",
          name: { es: item.name, en: item.name },
          quantity: Number(item.quantity ?? 0) || 0,
          unitPrice: { amount: unitPrice, currency: "DOP" },
          startPrice: { amount: unitPrice, currency: "DOP" },
          metadata: item.metadata ?? {},
        };
      }),
      totals: {
        subtotal: { amount: subtotalAmount, currency: "DOP" },
        deliveryFee: { amount: deliveryFeeAmount, currency: "DOP" },
        total: { amount: totalAmount, currency: "DOP" },
      },
    };

    const db = getAdminFirestore();
    const docRef = await db.collection("orders").add(orderData);

    return NextResponse.json({ data: { id: docRef.id } }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin order:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
