import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

type LocalizedName = { es?: string; en?: string };

function normalize(value: string | undefined): string {
  return (value ?? "").trim();
}

function isBabyName(name: string): boolean {
  return name.toLowerCase().includes("baby");
}

function normalizeEsName(nameEs: string, nameEn: string): string {
  const trimmed = normalize(nameEs);
  if (!trimmed) {
    const fallback = normalize(nameEn).replace(/^baby\\s+/i, "").trim();
    return fallback ? `${fallback} Baby` : trimmed;
  }
  const withoutPrefix = trimmed.replace(/^baby\\s+/i, "").trim();
  const withoutSuffix = withoutPrefix.replace(/\\s+baby$/i, "").trim();
  return withoutSuffix ? `${withoutSuffix} Baby` : trimmed;
}

function normalizeEnName(nameEn: string, nameEs: string): string {
  const trimmed = normalize(nameEn);
  if (trimmed && /^baby\\b/i.test(trimmed)) {
    return trimmed;
  }
  const fallback = normalize(nameEn).replace(/^baby\\s+/i, "").trim();
  if (fallback) {
    return `Baby ${fallback}`;
  }
  const esBase = normalize(nameEs).replace(/^baby\\s+/i, "").replace(/\\s+baby$/i, "").trim();
  return esBase ? `Baby ${esBase}` : trimmed;
}

async function run() {
  const db = getDb();
  const snapshot = await db.collection(catalogCollections.products).get();

  let updated = 0;
  let skipped = 0;

  const batchSize = 400;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as { name?: LocalizedName; status?: string };
    const nameEs = normalize(data.name?.es);
    const nameEn = normalize(data.name?.en);

    const isBaby = isBabyName(nameEs) || isBabyName(nameEn);
    if (!isBaby) {
      skipped += 1;
      continue;
    }

    const nextEs = normalizeEsName(nameEs, nameEn);
    const nextEn = normalizeEnName(nameEn, nextEs);

    batch.update(doc.ref, {
      status: "hidden",
      name: {
        es: nextEs,
        en: nextEn,
      },
    });
    batchCount += 1;
    updated += 1;

    if (batchCount >= batchSize) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Baby products hidden: ${updated}`);
  console.log(`Skipped (non-baby): ${skipped}`);
}

run().catch((error) => {
  console.error("Failed to update baby products:", error);
  process.exit(1);
});
