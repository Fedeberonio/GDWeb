import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

const JUICE_IMAGE_MAP: Record<string, string> = {
  "pepinada-1-porcion": "/images/products/Pepinada.jpg",
  "china-chinola-1-porcion": "/images/products/china-chinola.jpg",
  "rosa-maravillosa-1-porcion": "/images/products/Rosa Maravillosa.jpg",
  "tropicalote-1-porcion": "/images/products/Tropicalote.jpg",
};

async function run() {
  const db = getDb();
  const collection = db.collection(catalogCollections.products);

  const snapshot = await collection
    .where("slug", "in", Object.keys(JUICE_IMAGE_MAP))
    .get();

  if (snapshot.empty) {
    console.warn("No juice products found to update.");
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { slug?: string };
    const slug = data.slug ?? "";
    const image = JUICE_IMAGE_MAP[slug];
    if (!image) return;
    batch.set(doc.ref, { image }, { merge: true });
  });

  await batch.commit();
  console.log("Juice product images updated.");
}

run().catch((error) => {
  console.error("Failed to update juice images:", error);
  process.exit(1);
});
