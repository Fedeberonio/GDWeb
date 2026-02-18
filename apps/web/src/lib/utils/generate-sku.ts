import { collection, getDocs, query, where } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase/client";

const CATEGORY_ALIASES: Record<string, string> = {
  "productos-granja": "productos-de-granja",
  "productos-de-campo": "productos-de-granja",
  "jugos-naturales": "jugos",
  "productos-caseros": "otros",
  "caseros": "otros",
  "legumbres": "otros",
  "hierbas": "hierbas-y-especias",
};

const CATEGORY_PREFIX: Record<string, string> = {
  "cajas": "CAJA",
  "productos-de-granja": "GRAN",
  "frutas": "FRUT",
  "vegetales": "VEGE",
  "hierbas-y-especias": "HIER",
  "otros": "OTRO",
  "jugos": "JUGO",
  "ensaladas": "ENSA",
  "ingredientes": "INGR",
};

const CATEGORY_QUERY_IDS: Record<string, string[]> = {
  "productos-de-granja": ["productos-de-granja", "productos-granja", "productos-de-campo"],
  "jugos": ["jugos", "jugos-naturales"],
  "otros": ["otros", "legumbres", "productos-caseros", "caseros"],
  "hierbas-y-especias": ["hierbas-y-especias", "hierbas"],
};

function normalizeCategoryId(categoryId: string): string {
  const normalized = categoryId.trim().toLowerCase();
  return CATEGORY_ALIASES[normalized] ?? normalized;
}

function getCategoryIdsForQuery(categoryId: string): string[] {
  const normalized = normalizeCategoryId(categoryId);
  const grouped = CATEGORY_QUERY_IDS[normalized];
  if (!grouped) return [normalized];
  return Array.from(new Set(grouped.map((id) => id.trim().toLowerCase())));
}

export async function generateNextSKU(categoryId: string): Promise<string> {
  try {
    const db = getFirestoreDb();
    const normalizedCategoryId = normalizeCategoryId(categoryId);
    const prefix = CATEGORY_PREFIX[normalizedCategoryId] || "PROD";
    const fullPrefix = `GD-${prefix}-`;
    const categoryIdsForQuery = getCategoryIdsForQuery(categoryId);

    const productsRef = collection(db, "catalog_products");
    const q =
      categoryIdsForQuery.length === 1
        ? query(productsRef, where("categoryId", "==", categoryIdsForQuery[0]))
        : query(productsRef, where("categoryId", "in", categoryIdsForQuery));
    const snapshot = await getDocs(q);

    let maxNumber = 0;

    snapshot.forEach((doc) => {
      const sku = doc.data().sku || doc.id;
      const match = sku.match(new RegExp(`${fullPrefix}(\\d+)`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    return `${fullPrefix}${nextNumber}`;
  } catch (error) {
    console.error("Error generating SKU:", error);
    // Fallback to timestamp-based SKU if query fails
    const timestamp = Date.now().toString().slice(-6);
    return `GD-PROD-${timestamp}`;
  }
}
