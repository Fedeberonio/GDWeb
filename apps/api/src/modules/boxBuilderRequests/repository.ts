import { getDb } from "../../lib/firestore";

const COLLECTION = "box_builder_requests";

export async function listRequests(limit = 100) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getRequestById(id: string) {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateRequestStatus(id: string, status: string) {
  const ref = getDb().collection(COLLECTION).doc(id);
  await ref.set({ status }, { merge: true });
  const updated = await ref.get();
  if (!updated.exists) return null;
  return { id: updated.id, ...updated.data() };
}
