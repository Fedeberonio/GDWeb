import { FieldValue, type Timestamp } from "firebase-admin/firestore";

import { getDb } from "../../lib/firestore";
import type { Box, Product } from "./schemas";

export type CatalogEntityType = "product" | "box";

export type CatalogChangeContext = {
  actorEmail?: string | null;
  actorUid?: string | null;
};

export async function recordCatalogChange(
  entityType: CatalogEntityType,
  before: Product | Box,
  after: Product | Box,
  context: CatalogChangeContext = {},
) {
  const db = getDb();
  await db.collection("catalog_history").add({
    entityType,
    entityId: before.id,
    actorEmail: context.actorEmail ?? null,
    actorUid: context.actorUid ?? null,
    timestamp: FieldValue.serverTimestamp(),
    before,
    after,
  });
}

export type CatalogChange = {
  id: string;
  entityType: CatalogEntityType;
  entityId: string;
  actorEmail: string | null;
  actorUid: string | null;
  timestamp: Timestamp | null;
  before: Product | Box;
  after: Product | Box;
};

export async function listCatalogHistory(limit = 100): Promise<CatalogChange[]> {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;
  const snapshot = await getDb()
    .collection("catalog_history")
    .orderBy("timestamp", "desc")
    .limit(safeLimit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<CatalogChange, "id">;
    return {
      id: doc.id,
      ...data,
    };
  });
}
