"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCatalogChange = recordCatalogChange;
exports.listCatalogHistory = listCatalogHistory;
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../lib/firestore");
async function recordCatalogChange(entityType, before, after, context = {}) {
    const db = (0, firestore_2.getDb)();
    await db.collection("catalog_history").add({
        entityType,
        entityId: before.id,
        actorEmail: context.actorEmail ?? null,
        actorUid: context.actorUid ?? null,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        before,
        after,
    });
}
async function listCatalogHistory(limit = 100) {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;
    const snapshot = await (0, firestore_2.getDb)()
        .collection("catalog_history")
        .orderBy("timestamp", "desc")
        .limit(safeLimit)
        .get();
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
        };
    });
}
//# sourceMappingURL=history.js.map