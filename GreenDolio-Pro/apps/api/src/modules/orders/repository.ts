import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";

import { getDb } from "../../lib/firestore";
import type { Order, OrderStatus } from "./schemas";

const COLLECTION = "orders";

function docToOrder(doc: DocumentSnapshot): Order {
  const data = doc.data() ?? {};
  const normalizeDate = (value: unknown) =>
    value instanceof Timestamp ? value.toDate().toISOString() : (value as string | undefined);

  return {
    id: doc.id,
    ...data,
    createdAt: normalizeDate(data.createdAt) ?? new Date().toISOString(),
    updatedAt: normalizeDate(data.updatedAt),
  } as Order;
}

export async function listOrders(limit = 100): Promise<Order[]> {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(docToOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return docToOrder(doc);
}

export async function createOrder(order: Omit<Order, "createdAt" | "updatedAt"> & { createdAt?: unknown; updatedAt?: unknown }) {
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
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
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
}
