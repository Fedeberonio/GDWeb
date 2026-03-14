import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

const descriptionUpdates: Record<string, { es: string; en: string }> = {
  "GD-VEGE-065": {
    es: "Ají morrón fresco y crujiente. Ideal para saltear o ensaladas.",
    en: "Fresh crisp bell pepper. Ideal for sauteing or salads.",
  },
  "GD-VEGE-059": {
    es: "Coliflor blanca fresca. Ideal para hervir, asar o al vapor.",
    en: "Fresh white cauliflower. Ideal for boiling, roasting, or steaming.",
  },
  "GD-VEGE-054": {
    es: "Guineo verde firme. Perfecto para hervir o freír.",
    en: "Firm green banana. Perfect for boiling or frying.",
  },
  "GD-VEGE-050": {
    es: "Lechuga repollada fresca y crujiente. Ideal para ensaladas.",
    en: "Fresh crisp iceberg lettuce. Ideal for salads.",
  },
  "GD-VEGE-047": {
    es: "Lechuga rizada fresca. Textura crujiente para ensaladas.",
    en: "Fresh curly lettuce. Crisp texture for salads.",
  },
  "GD-VEGE-051": {
    es: "Lechuga romana crujiente. Base clásica para ensaladas.",
    en: "Crisp romaine lettuce. Classic salad base.",
  },
  "GD-VEGE-067": {
    es: "Limón fresco y aromático. Ideal para jugos y aderezos.",
    en: "Fresh aromatic lemon. Ideal for juices and dressings.",
  },
  "GD-VEGE-068": {
    es: "Ñame fresco para hervir o hacer puré.",
    en: "Fresh yam for boiling or mashing.",
  },
  "GD-VEGE-045": {
    es: "Papas frescas. Versátiles para hervir, freír u hornear.",
    en: "Fresh potatoes. Versatile for boiling, frying, or baking.",
  },
  "GD-VEGE-053": {
    es: "Pepino fresco y crujiente. Ideal para ensaladas.",
    en: "Fresh crisp cucumber. Ideal for salads.",
  },
  "GD-VEGE-046": {
    es: "Plátano verde firme para tostones o hervidos.",
    en: "Firm green plantain for tostones or boiling.",
  },
  "GD-VEGE-052": {
    es: "Rábano rojo fresco y crujiente. Ideal para ensaladas.",
    en: "Fresh crisp red radish. Ideal for salads.",
  },
  "GD-VEGE-056": {
    es: "Repollo blanco fresco. Ideal para ensaladas o cocinar.",
    en: "Fresh white cabbage. Ideal for salads or cooking.",
  },
  "GD-VEGE-057": {
    es: "Repollo morado fresco. Aporta color y textura.",
    en: "Fresh purple cabbage. Adds color and crunch.",
  },
  "GD-VEGE-044": {
    es: "Tomate bugalú fresco y jugoso. Ideal para ensaladas.",
    en: "Fresh juicy bugalu tomato. Ideal for salads.",
  },
  "GD-VEGE-058": {
    es: "Tomate redondo fresco y jugoso. Ideal para cocinar.",
    en: "Fresh juicy round tomato. Ideal for cooking.",
  },
  "GD-VEGE-055": {
    es: "Yuca fresca para hervir o freír.",
    en: "Fresh cassava for boiling or frying.",
  },
  "GD-VEGE-063": {
    es: "Zanahoria fresca y crujiente. Ideal para ensaladas o guisos.",
    en: "Fresh crisp carrot. Ideal for salads or stews.",
  },
  "GD-VEGE-066": {
    es: "Maíz dulce en mazorca.",
    en: "Sweet corn on the cob.",
  },
  "GD-VEGE-069": {
    es: "Zucchini verde tierno para saltear o asar.",
    en: "Tender green zucchini for sauteing or roasting.",
  },
};

async function run() {
  const snapshot = await getDb().collection(catalogCollections.products).get();
  const batch = getDb().batch();
  let updates = 0;
  const missing = new Set(Object.keys(descriptionUpdates));

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { sku?: string };
    const sku = data.sku;
    if (!sku) return;
    const update = descriptionUpdates[sku];
    if (!update) return;
    missing.delete(sku);

    batch.set(
      doc.ref,
      {
        description: {
          es: update.es,
          en: update.en,
        },
      },
      { merge: true },
    );
    updates += 1;
  });

  if (updates > 0) {
    await batch.commit();
  }

  console.log(`Updated descriptions for ${updates} products.`);
  if (missing.size > 0) {
    console.warn(`Missing SKUs: ${Array.from(missing).join(", ")}`);
  }
}

run().catch((error) => {
  console.error("Failed to update vegetable descriptions:", error);
  process.exit(1);
});
