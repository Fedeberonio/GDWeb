import dotenv from "dotenv";

import { getDb } from "../lib/firestore";

dotenv.config();

const FRUIT_DESCRIPTIONS_EN: Record<string, string> = {
  "GD-FRUT-024": "Ripe local avocado, with a creamy texture and mild flavor, perfect for any dish.",
  "GD-FRUT-033": "Premium ripe bananas, sweet and ready to eat, a perfect source of natural energy.",
  "GD-FRUT-029": "Fresh and sweet strawberries, ideal for snacks, desserts, or healthy smoothies.",
  "GD-FRUT-027": "Aromatic passion fruit (Chinola), perfect for refreshing juices and gourmet desserts.",
  "GD-FRUT-025": "Exotic starfruit (Carambola), refreshing, low in calories, and beautifully decorative.",
  "GD-FRUT-026": "Local cherries (Acerolas), extremely rich in Vitamin C with a vibrant and tangy flavor.",
  "GD-FRUT-028": "Dry coconut with plenty of water and firm meat, ideal for cooking, baking, or healthy fats.",
  "GD-FRUT-031": "Juicy and sweet red watermelon, the ultimate choice for natural hydration.",
  "GD-FRUT-030": "Mature golden pineapple, extremely juicy, sweet, and packed with vitamins.",
  "GD-FRUT-032": "Sweet and juicy mandarin, easy to peel and perfect for a healthy on-the-go snack.",
  "GD-FRUT-022": "Fresh Persian or local lemon, with abundant juice, ideal for dressings, teas, and beverages.",
  "GD-FRUT-023": "Premium quality green plantain, essential for traditional dishes like mangú or tostones.",
};

async function run() {
  const db = getDb();
  let updated = 0;

  let batch = db.batch();
  let batchCount = 0;
  const batchSize = 450;

  for (const [sku, descriptionEn] of Object.entries(FRUIT_DESCRIPTIONS_EN)) {
    const ref = db.collection("catalog_products").doc(sku);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      console.warn(`Missing SKU: ${sku}`);
      continue;
    }
    const data = snapshot.data() as Record<string, any>;
    const description = { ...(data.description ?? {}) } as Record<string, string>;
    if (description.en === descriptionEn) continue;
    description.en = descriptionEn;

    batch.update(ref, { description });
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

  console.log(`Updated ${updated} fruit descriptions (en).`);
}

run().catch((error) => {
  console.error("Failed to update fruit descriptions (en):", error);
  process.exit(1);
});
