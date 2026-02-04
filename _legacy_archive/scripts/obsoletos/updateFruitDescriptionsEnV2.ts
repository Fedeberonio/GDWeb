import dotenv from "dotenv";

import { getDb } from "../lib/firestore";

dotenv.config();

type FruitUpdate = {
  descriptionEn: string;
  price?: number;
};

const FRUIT_UPDATES: Record<string, FruitUpdate> = {
  "GD-FRUT-024": {
    descriptionEn: "Creamy local avocado, perfect for toast, salads, or a healthy snack.",
  },
  "GD-FRUT-033": {
    descriptionEn: "Sweet and ripe bananas, the perfect natural energy boost.",
  },
  "GD-FRUT-029": {
    descriptionEn: "Fresh, sweet strawberries, perfect for smoothies or healthy desserts.",
  },
  "GD-FRUT-027": {
    descriptionEn: "Tangy and aromatic passion fruit, ideal for refreshing juices.",
  },
  "GD-FRUT-025": {
    descriptionEn: "Exotic starfruit, refreshing, low-calorie, and beautifully decorative.",
  },
  "GD-FRUT-026": {
    descriptionEn: "Zesty local cherries (Acerolas), packed with Vitamin C.",
  },
  "GD-FRUT-028": {
    descriptionEn: "Dry coconut with refreshing water and firm meat, great for cooking.",
  },
  "GD-FRUT-031": {
    descriptionEn: "Sweet and juicy red watermelon, the best way to stay hydrated.",
  },
  "GD-FRUT-030": {
    descriptionEn: "Golden, sweet, and juicy pineapple, rich in vitamins.",
    price: 120,
  },
  "GD-FRUT-032": {
    descriptionEn: "Sweet, seedless mandarin, easy to peel and perfect for snacks.",
  },
  "GD-FRUT-022": {
    descriptionEn: "Fresh and zesty lemons, perfect for juices and dressings.",
  },
  "GD-FRUT-023": {
    descriptionEn: "Sweet ripe plantains, perfect for frying or baking.",
  },
  "GD-FRUT-034": {
    descriptionEn: "Crisp and sweet imported red apple, a classic healthy choice.",
  },
  "GD-FRUT-035": {
    descriptionEn: "Sweet and fragrant cantaloupe melon, perfect for breakfast.",
  },
  "GD-FRUT-036": {
    descriptionEn: "Exotic dragon fruit (Pitahaya) with a mild, refreshing taste.",
  },
  "GD-FRUT-037": {
    descriptionEn: "Sweet, seedless grapes, the ultimate healthy snack.",
  },
  "GD-FRUT-038": {
    descriptionEn: "Sweet local guava, perfect for juices and traditional sweets.",
    price: 45,
  },
  "GD-FRUT-039": {
    descriptionEn: "Juicy, fiberless mango, the king of tropical fruits.",
  },
  "GD-FRUT-040": {
    descriptionEn: "Ripe and sweet papaya, excellent for digestion and smoothies.",
  },
  "GD-FRUT-041": {
    descriptionEn: "Natural tamarind pods, perfect for traditional juices and sauces.",
    price: 60,
  },
};

async function run() {
  const db = getDb();
  let updated = 0;
  const missing: string[] = [];

  let batch = db.batch();
  let batchCount = 0;
  const batchSize = 450;

  for (const [sku, update] of Object.entries(FRUIT_UPDATES)) {
    const ref = db.collection("catalog_products").doc(sku);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      missing.push(sku);
      continue;
    }

    const data = snapshot.data() as Record<string, any>;
    const description = { ...(data.description ?? {}) } as Record<string, string>;
    description.en = update.descriptionEn;

    const payload: Record<string, unknown> = { description };
    if (typeof update.price === "number") {
      payload.price = update.price;
    }

    batch.update(ref, payload);
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

  console.log(`Updated ${updated} fruit records.`);
  if (missing.length > 0) {
    console.log(`Missing SKUs: ${missing.join(", ")}`);
  }
}

run().catch((error) => {
  console.error("Failed to update fruit descriptions (en):", error);
  process.exit(1);
});
