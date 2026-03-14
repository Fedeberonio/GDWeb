import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";

import { getDb } from "../../lib/firestore";
import type { Order, OrderStatus } from "./schemas";

const COLLECTION = "orders";

/** In-memory fallback for demo/dev when Firebase is unavailable. Stored on globalThis to survive hot reloads. */
interface GlobalWithMockOrders {
  __mockOrders?: Order[];
}

const globalForMock = globalThis as GlobalWithMockOrders;
const globalMockOrders: Order[] = globalForMock.__mockOrders ?? [];
globalForMock.__mockOrders = globalMockOrders;

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : undefined;
}

function docToOrder(doc: DocumentSnapshot): Order {
  const data = (doc.data() ?? {}) as Record<string, unknown>;
  const createdAt = normalizeDate(data.createdAt) ?? new Date().toISOString();
  const updatedAt = normalizeDate(data.updatedAt);

  return {
    id: doc.id,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    guestEmail: typeof data.guestEmail === "string" ? data.guestEmail : undefined,
    items: Array.isArray(data.items) ? (data.items as Order["items"]) : [],
    totals: (data.totals as Order["totals"]) ?? { subtotal: { amount: 0, currency: "DOP" }, total: { amount: 0, currency: "DOP" } },
    status: (typeof data.status === "string" ? data.status : "pending") as Order["status"],
    delivery: (data.delivery as Order["delivery"]) ?? {
      address: { id: "", label: "", contactName: "", phone: "", city: "", zone: "", isDefault: false },
    },
    payment: (data.payment as Order["payment"]) ?? { method: "cash", status: "pending" },
    createdAt,
    updatedAt,
    whatsappMessageId: typeof data.whatsappMessageId === "string" ? data.whatsappMessageId : undefined,
  };
}

export async function listOrders(limit = 100): Promise<Order[]> {
  try {
    const snapshot = await getDb()
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snapshot.docs.map(docToOrder);
  } catch (_error) {
    console.warn("⚠️ Firebase unavailable, listing from in-memory mock store.", _error instanceof Error ? _error.message : "");
    return [...globalMockOrders].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const doc = await getDb().collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return docToOrder(doc);
  } catch (_error) {
    console.warn("⚠️ Firebase unavailable, reading from in-memory mock store.");
    return globalMockOrders.find((o: Order) => o.id === id) || null;
  }
}

export async function createOrder(order: Omit<Order, "createdAt" | "updatedAt"> & { createdAt?: unknown; updatedAt?: unknown }) {
  try {
    const ref = order.id ? getDb().collection(COLLECTION).doc(order.id) : getDb().collection(COLLECTION).doc();
    const payload = {
      ...order,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(payload, { merge: true });
    const saved = await ref.get();
    if (!saved.exists) {
      throw new Error("Failed to create order");
    }
    return docToOrder(saved);
  } catch (_error) {
    console.warn("⚠️ Firebase unavailable, saving to in-memory mock store.");

    // Simulate what Firebase would do
    const now = new Date().toISOString();
    const mockOrder: Order = {
      ...order,
      id: order.id || `mock-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    } as Order;

    const existingIndex = globalMockOrders.findIndex((o: Order) => o.id === mockOrder.id);
    if (existingIndex >= 0) {
      globalMockOrders[existingIndex] = { ...globalMockOrders[existingIndex], ...mockOrder };
    } else {
      globalMockOrders.push(mockOrder);
    }

    return mockOrder;
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  try {
    const ref = getDb().collection(COLLECTION).doc(id);
    await ref.set(
      {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const updated = await ref.get();
    if (!updated.exists) return null;
    return docToOrder(updated);
  } catch (_error) {
    console.warn("⚠️ Firebase unavailable, updating in-memory mock store.");
    const index = globalMockOrders.findIndex((o: Order) => o.id === id);
    if (index === -1) return null;

    const updatedOrder: Order = {
      ...globalMockOrders[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    globalMockOrders[index] = updatedOrder;
    return updatedOrder;
  }
}
