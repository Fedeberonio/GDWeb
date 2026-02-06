import path from "path";
import fs from "fs/promises";

import { initializeFirebaseAdmin } from "../firebaseAdmin";
import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

const PROJECT_ROOT = path.resolve(__dirname, "../../../");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "backups", "firestore", "catalog");
const TIMESTAMP = new Date().toISOString().replace(/[^\d]/g, "_");

type CollectionConfig = {
  key: keyof typeof catalogCollections;
  requiredFields: string[];
};

const COLLECTIONS: CollectionConfig[] = [
  {
    key: "categories",
    requiredFields: ["slug", "name.es", "name.en", "description.es", "description.en"],
  },
  {
    key: "products",
    requiredFields: ["slug", "name.es", "price.amount", "categoryId"],
  },
  {
    key: "boxes",
    requiredFields: ["slug", "name.es", "price.amount", "ruleId"],
  },
  {
    key: "boxRules",
    requiredFields: ["id", "name.es", "baseContents"],
  },
  {
    key: "combos",
    requiredFields: ["name.es", "price"],
  },
];

function resolveFieldValue(data: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, data as unknown);
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && value && Object.keys(value).length === 0) return true;
  return false;
}

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log("🔥 Running Firestore backup + validation");
  initializeFirebaseAdmin();
  const db = getDb();

  await ensureOutputDir();

  const validationResults: Array<{ collection: string; count: number; missingEntries: Array<{ id: string; missingFields: string[] }> }> = [];

  for (const collectionConfig of COLLECTIONS) {
    const collectionName = catalogCollections[collectionConfig.key];
    const snapshot = await db.collection(collectionName).get();
    const docs: Record<string, unknown>[] = [];
    const missingEntries: Array<{ id: string; missingFields: string[] }> = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      docs.push({ id: doc.id, ...data });

      const missingFields = collectionConfig.requiredFields.filter((field) => {
        const value = resolveFieldValue(data as Record<string, unknown>, field);
        return isEmptyValue(value);
      });
      if (missingFields.length > 0) {
        missingEntries.push({ id: doc.id, missingFields });
      }
    });

    const fileName = `${collectionName}-${TIMESTAMP}.json`;
    await fs.writeFile(path.join(OUTPUT_DIR, fileName), JSON.stringify(docs, null, 2), "utf-8");

    validationResults.push({
      collection: collectionName,
      count: docs.length,
      missingEntries,
    });
  }

  for (const result of validationResults) {
    console.log(`\n📦 ${result.collection}: exported ${result.count} documents`);
    if (result.missingEntries.length === 0) {
      console.log("   ✅ No missing required fields");
    } else {
      console.log(`   ⚠️ ${result.missingEntries.length} documents missing required fields:`);
      result.missingEntries.slice(0, 10).forEach(({ id, missingFields }) => {
        console.log(`     - ${id}: ${missingFields.join(", ")}`);
      });
      if (result.missingEntries.length > 10) {
        console.log(`     ...and ${result.missingEntries.length - 10} more`);
      }
    }
  }

  console.log(`\n✅ Firestore backup written under ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error("❌ Firestore backup failed:", error);
  process.exit(1);
});
