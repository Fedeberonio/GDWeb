import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { ProductStockLog } from "../types";

export async function createProductStockLog(
  log: Omit<ProductStockLog, "createdAt"> & { createdAt?: any }
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firebase not initialized");
  }

  const logsRef = collection(db, "product_stock_logs");
  const logRef = doc(logsRef);

  await setDoc(logRef, {
    ...log,
    createdAt: serverTimestamp(),
  });
}
