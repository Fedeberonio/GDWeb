import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/Ã¡/g, "á"],
  [/Ã©/g, "é"],
  [/Ã­/g, "í"],
  [/Ã³/g, "ó"],
  [/Ãº/g, "ú"],
  [/Ã±/g, "ñ"],
  [/Ã‘/g, "Ñ"],
  [/Â¿/g, "¿"],
  [/Â¡/g, "¡"],
  [/Ã\\s/g, "í "],
];

function fixString(value: string): { value: string; changed: boolean } {
  let next = value;
  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  return { value: next, changed: next !== value };
}

function fixUnknown(value: unknown): { value: unknown; changed: boolean; fields: number } {
  if (typeof value === "string") {
    const fixed = fixString(value);
    return { value: fixed.value, changed: fixed.changed, fields: fixed.changed ? 1 : 0 };
  }
  if (Array.isArray(value)) {
    let changed = false;
    let fields = 0;
    const next = value.map((item) => {
      const fixed = fixUnknown(item);
      if (fixed.changed) changed = true;
      fields += fixed.fields;
      return fixed.value;
    });
    return { value: next, changed, fields };
  }
  if (value && typeof value === "object") {
    let changed = false;
    let fields = 0;
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      const fixed = fixUnknown(entry);
      if (fixed.changed) changed = true;
      fields += fixed.fields;
      next[key] = fixed.value;
    });
    return { value: next, changed, fields };
  }
  return { value, changed: false, fields: 0 };
}

async function fixCollection(collectionName: string) {
  const db = getDb();
  const snapshot = await db.collection(collectionName).get();
  const batchSize = 400;
  let batch = db.batch();
  let batchCount = 0;
  let updatedDocs = 0;
  let updatedFields = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fixed = fixUnknown(data);
    if (!fixed.changed) continue;

    batch.update(doc.ref, fixed.value as Record<string, unknown>);
    batchCount += 1;
    updatedDocs += 1;
    updatedFields += fixed.fields;

    if (batchCount >= batchSize) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { updatedDocs, updatedFields };
}

async function run() {
  const collections = Array.from(
    new Set([
      catalogCollections.products,
      catalogCollections.combos,
      "lunch_combos",
    ]),
  );

  let totalDocs = 0;
  let totalFields = 0;

  for (const collection of collections) {
    const result = await fixCollection(collection);
    totalDocs += result.updatedDocs;
    totalFields += result.updatedFields;
    console.log(`${collection}: ${result.updatedDocs} docs updated, ${result.updatedFields} fields corrected`);
  }

  console.log(`Total: ${totalDocs} docs updated, ${totalFields} fields corrected`);
}

run().catch((error) => {
  console.error("Failed to fix encoding:", error);
  process.exit(1);
});
