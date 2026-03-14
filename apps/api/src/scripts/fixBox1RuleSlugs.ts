import dotenv from "dotenv";

import { getDb } from "../lib/firestore";

dotenv.config();

type BoxRule = {
  baseContents?: Array<{ productSku: string; quantity: number }>;
  variantContents?: Record<string, Array<{ productSku: string; quantity: number }>>;
};

function normalizeSlug(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeContents(contents?: Array<{ productSku: string; quantity: number }>) {
  if (!contents) return contents;
  return contents.map((item) => ({
    ...item,
    productSku: normalizeSlug(item.productSku),
  }));
}

async function run() {
  const db = getDb();
  const ref = db.collection("catalog_box_rules").doc("GD-CAJA-001");
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("Box rule GD-CAJA-001 not found in catalog_box_rules.");
  }

  const data = snapshot.data() as BoxRule;
  const baseContents = normalizeContents(data.baseContents);
  const variantContents: BoxRule["variantContents"] = {};

  if (data.variantContents) {
    Object.entries(data.variantContents).forEach(([key, items]) => {
      variantContents[key] = normalizeContents(items);
    });
  }

  await ref.update({
    baseContents,
    variantContents,
  });

  console.log("✅ Box 1 rule slugs normalized to SKU format (uppercase).");
}

run().catch((error) => {
  console.error("Failed to fix Box 1 rule slugs:", error);
  process.exit(1);
});
