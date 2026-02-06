import dotenv from "dotenv";

import { getDb } from "../lib/firestore";

dotenv.config();

function cleanProductName(value: string): string {
  return value
    .replace(/^box\s*\d+\s*/i, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function cleanCollection(collectionPath: string) {
  const db = getDb();
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log(`No docs found in ${collectionPath}`);
    return;
  }

  let updated = 0;
  let scanned = 0;

  for (const doc of snapshot.docs) {
    scanned += 1;
    const data = doc.data() as {
      name?: { es?: string; en?: string };
    };

    const nameEs = data.name?.es ?? "";
    const nameEn = data.name?.en ?? "";
    if (!nameEs && !nameEn) continue;

    const cleanedEs = nameEs ? cleanProductName(nameEs) : "";
    const cleanedEn = nameEn ? cleanProductName(nameEn) : cleanedEs;

    if (cleanedEs === nameEs && cleanedEn === nameEn) continue;

    await doc.ref.set(
      {
        name: {
          es: cleanedEs,
          en: cleanedEn,
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updated += 1;
  }

  console.log(`Cleaned ${collectionPath}: ${updated}/${scanned} updated`);
}

async function run() {
  await cleanCollection("catalog_products");
  await cleanCollection("catalog_boxes");
  console.log("Name cleanup completed.");
}

run().catch((error) => {
  console.error("Name cleanup failed:", error);
  process.exit(1);
});
