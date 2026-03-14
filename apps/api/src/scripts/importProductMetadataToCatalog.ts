import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

type RawProductMeta = {
  slug: string;
  weightKg?: number;
  wholesaleCost?: number;
  slotValue?: number;
};

const METADATA_PATH = path.resolve(__dirname, "../data/productMetadata.json");
const BATCH_LIMIT = 400;

function loadMetadata(): RawProductMeta[] {
  if (!fs.existsSync(METADATA_PATH)) {
    throw new Error(`Metadata file not found at ${METADATA_PATH}`);
  }
  return JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8")) as RawProductMeta[];
}

async function importMetadata() {
  const db = getDb();
  const raw = loadMetadata();
  const updates: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }> = [];
  const missing: string[] = [];

  for (const item of raw) {
    if (!item.slug) continue;
    const normalizedId = item.slug.toUpperCase();
    const ref = db.collection(catalogCollections.products).doc(item.slug);
    const snapshot = await ref.get();
    const targetRef = snapshot.exists ? ref : db.collection(catalogCollections.products).doc(normalizedId);
    const targetSnapshot = snapshot.exists ? snapshot : await targetRef.get();
    if (!targetSnapshot.exists) {
      missing.push(item.slug);
      continue;
    }

    const metadata: Record<string, number> = {};
    if (typeof item.slotValue === "number") metadata.slotValue = item.slotValue;
    if (typeof item.wholesaleCost === "number") metadata.wholesaleCost = item.wholesaleCost;

    const data: Record<string, unknown> = {};
    if (Object.keys(metadata).length) {
      data.metadata = metadata;
    }
    if (typeof item.weightKg === "number") {
      data.logistics = { weightKg: item.weightKg };
    }

    if (Object.keys(data).length) {
      updates.push({ ref: targetRef, data });
    }
  }

  let index = 0;
  while (index < updates.length) {
    const batch = db.batch();
    updates.slice(index, index + BATCH_LIMIT).forEach(({ ref, data }) => {
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
    index += BATCH_LIMIT;
  }

  console.log(`Updated metadata for ${updates.length} products.`);
  if (missing.length) {
    console.log(`Skipped ${missing.length} missing products.`);
  }
}

importMetadata().catch((error) => {
  console.error("Failed to import product metadata:", error);
  process.exit(1);
});
