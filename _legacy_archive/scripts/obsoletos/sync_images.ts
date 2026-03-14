import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { getDb } from "../lib/firestore";

dotenv.config();

const IMAGES_DIR = path.resolve(__dirname, "../../../web/public/assets/images/products");
const IMAGE_PREFIX = "/assets/images/products/";

function listImageSkus(): Set<string> {
  const files = fs.readdirSync(IMAGES_DIR);
  const skus = new Set<string>();
  for (const file of files) {
    if (!file.toLowerCase().endsWith(".png")) continue;
    const sku = file.replace(/\.png$/i, "");
    skus.add(sku);
  }
  return skus;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBaby(value: string): string {
  return normalizeName(value).replace(/\bbaby\b/g, "").replace(/\s+/g, " ").trim();
}

function isBabyValue(value: string): boolean {
  return /\bbaby\b/i.test(value);
}

async function run() {
  if (!fs.existsSync(IMAGES_DIR)) {
    throw new Error(`Images folder not found: ${IMAGES_DIR}`);
  }

  const imageSkus = listImageSkus();
  const snapshot = await getDb().collection("catalog_products").get();

  const parentByName = new Map<string, { sku: string; image?: string }>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Record<string, any>;
    const nameEs = typeof data?.name?.es === "string" ? data.name.es : "";
    const nameEn = typeof data?.name?.en === "string" ? data.name.en : "";
    const slug = typeof data?.slug === "string" ? data.slug : "";
    const tags = Array.isArray(data?.tags) ? data.tags.filter((tag) => typeof tag === "string") : [];
    const isBaby = [nameEs, nameEn, slug, ...tags].some(isBabyValue);
    if (isBaby) return;
    const image = data.image ?? data.image_url;
    if (nameEs) parentByName.set(normalizeName(nameEs), { sku: doc.id, image });
    if (nameEn) parentByName.set(normalizeName(nameEn), { sku: doc.id, image });
  });

  let updated = 0;
  let babyRemapped = 0;
  const missingImages: string[] = [];
  const mismatchedImages: Array<{ sku: string; current?: string }> = [];

  let batch = getDb().batch();
  let batchCount = 0;
  const batchSize = 450;

  for (const doc of snapshot.docs) {
    const sku = doc.id;
    const data = doc.data() as Record<string, any>;
    const nameEs = typeof data?.name?.es === "string" ? data.name.es : "";
    const nameEn = typeof data?.name?.en === "string" ? data.name.en : "";
    const slug = typeof data?.slug === "string" ? data.slug : "";
    const tags = Array.isArray(data?.tags) ? data.tags.filter((tag) => typeof tag === "string") : [];
    const isBaby = [nameEs, nameEn, slug, ...tags].some(isBabyValue);
    const hasImageFile = imageSkus.has(sku);

    if (isBaby) {
      const baseEs = stripBaby(nameEs);
      const baseEn = stripBaby(nameEn);
      const parent =
        (baseEs ? parentByName.get(baseEs) : undefined) ??
        (baseEn ? parentByName.get(baseEn) : undefined);

      if (parent) {
        const parentUrl = parent.image || `${IMAGE_PREFIX}${parent.sku}.png`;
        const current = data.image ?? data.image_url;
        if (current !== parentUrl) {
          mismatchedImages.push({ sku, current });
          batch.update(doc.ref, { image: parentUrl, image_url: parentUrl });
          batchCount += 1;
          updated += 1;
          babyRemapped += 1;
        }
        continue;
      }
    }

    if (!hasImageFile) {
      missingImages.push(sku);
      continue;
    }

    const expectedUrl = `${IMAGE_PREFIX}${sku}.png`;
    const current = data.image ?? data.image_url;
    if (current === expectedUrl) continue;

    mismatchedImages.push({ sku, current });
    batch.update(doc.ref, { image: expectedUrl, image_url: expectedUrl });
    batchCount += 1;
    updated += 1;

    if (batchCount >= batchSize) {
      await batch.commit();
      batch = getDb().batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Updated ${updated} products with image URLs.`);
  console.log(`Baby products remapped to parent image: ${babyRemapped}`);
  if (mismatchedImages.length > 0) {
    console.log("Mismatched image URLs (sample):");
    mismatchedImages.slice(0, 10).forEach((entry) => {
      console.log(`- ${entry.sku}: ${entry.current ?? "(empty)"}`);
    });
  }
  if (missingImages.length > 0) {
    console.log(`Missing image files for ${missingImages.length} SKUs (sample):`);
    missingImages.slice(0, 20).forEach((sku) => console.log(`- ${sku}`));
  }
}

run().catch((error) => {
  console.error("Failed to sync images:", error);
  process.exit(1);
});
