import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

const categoryUpdates: Record<
  string,
  { nameEn: string; descriptionEn: string }
> = {
  "Productos Caseros": {
    nameEn: "Homemade Products",
    descriptionEn: "Dips & Sauces",
  },
  "Jugos Naturales": {
    nameEn: "Natural Juices",
    descriptionEn: "Detox Juices",
  },
  "Productos de Granja": {
    nameEn: "Farm Products",
    descriptionEn: "Eggs",
  },
  Otros: {
    nameEn: "Others",
    descriptionEn: "Grains & Pantry",
  },
  Frutas: {
    nameEn: "Fruits",
    descriptionEn: "Tropical Fruits",
  },
  Vegetales: {
    nameEn: "Vegetables",
    descriptionEn: "Tomatoes",
  },
  "Hierbas y Especias": {
    nameEn: "Herbs & Spices",
    descriptionEn: "Fresh Herbs",
  },
};

const boxUpdates: Array<{
  nameMatch: string;
  nameEn: string;
  descriptionEn: string;
}> = [
  {
    nameMatch: "Caribbean Fresh Pack",
    nameEn: "Box 1 'Caribbean Fresh Pack' (3 days)",
    descriptionEn:
      "3-day box with a mix of fresh fruits and vegetables. Ideal for couples or solo customers.",
  },
  {
    nameMatch: "Island Weekssential",
    nameEn: "Box 2 'Island Weekssential' (1 week)",
    descriptionEn:
      "Weekly box with a complete variety of fruits and vegetables. Perfect for small families.",
  },
  {
    nameMatch: "Allgreenxclusive",
    nameEn: "Box 3 'Allgreenxclusive' (2 weeks)",
    descriptionEn:
      "Biweekly box with an abundant assortment. Ideal for large families or meal prep.",
  },
];

async function updateAguacateDescription() {
  const snapshot = await getDb()
    .collection(catalogCollections.products)
    .where("slug", "==", "aguacate")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("No product found with slug 'aguacate'.");
  }

  const doc = snapshot.docs[0];
  await doc.ref.set(
    {
      description: {
        es: "Aguacate maduro cremoso. Ideal para guacamole o ensaladas.",
      },
    },
    { merge: true },
  );
}

async function updateCategories() {
  const snapshot = await getDb()
    .collection(catalogCollections.categories)
    .get();

  const batch = getDb().batch();
  let updates = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { name?: { es?: string } };
    const nameEs = data?.name?.es;
    if (!nameEs || !categoryUpdates[nameEs]) return;

    const update = categoryUpdates[nameEs];
    batch.set(
      doc.ref,
      {
        name: { en: update.nameEn },
        description: { en: update.descriptionEn },
      },
      { merge: true },
    );
    updates += 1;
  });

  if (updates > 0) {
    await batch.commit();
  }
}

async function updateBoxes() {
  const snapshot = await getDb().collection(catalogCollections.boxes).get();
  const batch = getDb().batch();
  let updates = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { name?: { es?: string } };
    const nameEs = data?.name?.es ?? "";
    const match = boxUpdates.find((entry) => nameEs.includes(entry.nameMatch));
    if (!match) return;

    batch.set(
      doc.ref,
      {
        name: { en: match.nameEn },
        description: { en: match.descriptionEn },
      },
      { merge: true },
    );
    updates += 1;
  });

  if (updates > 0) {
    await batch.commit();
  }
}

async function run() {
  await updateAguacateDescription();
  await updateCategories();
  await updateBoxes();
  console.log("Catalog content updates applied.");
}

run().catch((error) => {
  console.error("Failed to update catalog content:", error);
  process.exit(1);
});
