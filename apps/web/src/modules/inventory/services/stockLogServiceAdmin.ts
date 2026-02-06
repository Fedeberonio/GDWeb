import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ProductStockLog } from "../types";

export async function createProductStockLogAdmin(
  log: Omit<ProductStockLog, "createdAt">
): Promise<void> {
  const db = getAdminFirestore();
  const logRef = db.collection("product_stock_logs").doc();
  
  await logRef.set({
    ...log,
    createdAt: FieldValue.serverTimestamp(),
  });
}
