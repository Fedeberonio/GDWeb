"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrders = listOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrderStatus = updateOrderStatus;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../lib/firestore");
const COLLECTION = "orders";
const globalForMock = globalThis;
const globalMockOrders = globalForMock.__mockOrders ?? [];
globalForMock.__mockOrders = globalMockOrders;
function normalizeDate(value) {
    if (value instanceof firestore_1.Timestamp)
        return value.toDate().toISOString();
    return typeof value === "string" ? value : undefined;
}
function docToOrder(doc) {
    const data = (doc.data() ?? {});
    const createdAt = normalizeDate(data.createdAt) ?? new Date().toISOString();
    const updatedAt = normalizeDate(data.updatedAt);
    return {
        id: doc.id,
        userId: typeof data.userId === "string" ? data.userId : undefined,
        guestEmail: typeof data.guestEmail === "string" ? data.guestEmail : undefined,
        items: Array.isArray(data.items) ? data.items : [],
        totals: data.totals ?? { subtotal: { amount: 0, currency: "DOP" }, total: { amount: 0, currency: "DOP" } },
        status: (typeof data.status === "string" ? data.status : "pending"),
        delivery: data.delivery ?? {
            address: { id: "", label: "", contactName: "", phone: "", city: "", zone: "", isDefault: false },
        },
        payment: data.payment ?? { method: "cash", status: "pending" },
        createdAt,
        updatedAt,
        whatsappMessageId: typeof data.whatsappMessageId === "string" ? data.whatsappMessageId : undefined,
    };
}
async function listOrders(limit = 100) {
    try {
        const snapshot = await (0, firestore_2.getDb)()
            .collection(COLLECTION)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(docToOrder);
    }
    catch (_error) {
        console.warn("⚠️ Firebase unavailable, listing from in-memory mock store.", _error instanceof Error ? _error.message : "");
        return [...globalMockOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
    }
}
async function getOrderById(id) {
    try {
        const doc = await (0, firestore_2.getDb)().collection(COLLECTION).doc(id).get();
        if (!doc.exists)
            return null;
        return docToOrder(doc);
    }
    catch (_error) {
        console.warn("⚠️ Firebase unavailable, reading from in-memory mock store.");
        return globalMockOrders.find((o) => o.id === id) || null;
    }
}
async function createOrder(order) {
    try {
        const ref = order.id ? (0, firestore_2.getDb)().collection(COLLECTION).doc(order.id) : (0, firestore_2.getDb)().collection(COLLECTION).doc();
        const payload = {
            ...order,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        await ref.set(payload, { merge: true });
        const saved = await ref.get();
        if (!saved.exists) {
            throw new Error("Failed to create order");
        }
        return docToOrder(saved);
    }
    catch (_error) {
        console.warn("⚠️ Firebase unavailable, saving to in-memory mock store.");
        // Simulate what Firebase would do
        const now = new Date().toISOString();
        const mockOrder = {
            ...order,
            id: order.id || `mock-${Date.now()}`,
            createdAt: now,
            updatedAt: now,
        };
        const existingIndex = globalMockOrders.findIndex((o) => o.id === mockOrder.id);
        if (existingIndex >= 0) {
            globalMockOrders[existingIndex] = { ...globalMockOrders[existingIndex], ...mockOrder };
        }
        else {
            globalMockOrders.push(mockOrder);
        }
        return mockOrder;
    }
}
async function updateOrderStatus(id, status) {
    try {
        const ref = (0, firestore_2.getDb)().collection(COLLECTION).doc(id);
        await ref.set({
            status,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        const updated = await ref.get();
        if (!updated.exists)
            return null;
        return docToOrder(updated);
    }
    catch (_error) {
        console.warn("⚠️ Firebase unavailable, updating in-memory mock store.");
        const index = globalMockOrders.findIndex((o) => o.id === id);
        if (index === -1)
            return null;
        const updatedOrder = {
            ...globalMockOrders[index],
            status,
            updatedAt: new Date().toISOString(),
        };
        globalMockOrders[index] = updatedOrder;
        return updatedOrder;
    }
}
//# sourceMappingURL=repository.js.map