"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrders = listOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrderStatus = updateOrderStatus;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../lib/firestore");
const COLLECTION = "orders";
function docToOrder(doc) {
    const data = doc.data() ?? {};
    const normalizeDate = (value) => value instanceof firestore_1.Timestamp ? value.toDate().toISOString() : value;
    return {
        id: doc.id,
        ...data,
        createdAt: normalizeDate(data.createdAt) ?? new Date().toISOString(),
        updatedAt: normalizeDate(data.updatedAt),
    };
}
async function listOrders(limit = 100) {
    const snapshot = await (0, firestore_2.getDb)()
        .collection(COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return snapshot.docs.map(docToOrder);
}
async function getOrderById(id) {
    const doc = await (0, firestore_2.getDb)().collection(COLLECTION).doc(id).get();
    if (!doc.exists)
        return null;
    return docToOrder(doc);
}
async function createOrder(order) {
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
async function updateOrderStatus(id, status) {
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
//# sourceMappingURL=repository.js.map