// @ts-nocheck
import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { boxes, productCategories } from "../modules/catalog/mock-data";
import { catalogCollections } from "../modules/catalog/repository";
import { boxSchema, productCategorySchema } from "../modules/catalog/schemas";

dotenv.config();

async function seedCatalog() {
  const db = getDb();

  const categoryBatch = db.batch();
  productCategories.forEach((category) => {
    const parsed = productCategorySchema.parse(category);
    const ref = db.collection(catalogCollections.categories).doc(parsed.id);
    categoryBatch.set(ref, parsed, { merge: true });
  });
  await categoryBatch.commit();

  const boxBatch = db.batch();
  boxes.forEach((box) => {
    const parsed = boxSchema.parse(box);
    const ref = db.collection(catalogCollections.boxes).doc(parsed.id);
    boxBatch.set(ref, parsed, { merge: true });
  });
  await boxBatch.commit();

  console.log("Catalog seed completed");
}

seedCatalog().catch((error) => {
  console.error("Failed to seed catalog", error);
  process.exit(1);
});
