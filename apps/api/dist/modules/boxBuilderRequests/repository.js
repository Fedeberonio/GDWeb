"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRequests = listRequests;
exports.getRequestById = getRequestById;
exports.updateRequestStatus = updateRequestStatus;
const firestore_1 = require("../../lib/firestore");
const COLLECTION = "box_builder_requests";
async function listRequests(limit = 100) {
    const snapshot = await (0, firestore_1.getDb)()
        .collection(COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function getRequestById(id) {
    const doc = await (0, firestore_1.getDb)().collection(COLLECTION).doc(id).get();
    if (!doc.exists)
        return null;
    return { id: doc.id, ...doc.data() };
}
async function updateRequestStatus(id, status) {
    const ref = (0, firestore_1.getDb)().collection(COLLECTION).doc(id);
    await ref.set({ status }, { merge: true });
    const updated = await ref.get();
    if (!updated.exists)
        return null;
    return { id: updated.id, ...updated.data() };
}
//# sourceMappingURL=repository.js.map