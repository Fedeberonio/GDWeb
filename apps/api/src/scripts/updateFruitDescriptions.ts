import dotenv from "dotenv";

import { getDb } from "../lib/firestore";

dotenv.config();

const FRUIT_DESCRIPTIONS: Record<string, string> = {
  aguacate: "Aguacate criollo maduro, de textura cremosa y sabor suave.",
  banana: "Bananas maduras (guineos), dulces y listas para consumir.",
  fresas: "Fresas frescas y seleccionadas, ideales para postres o meriendas.",
  chinola: "Chinola (fruta de la pasión) aromática para jugos y postres.",
  carambola: "Carambola (fruta estrella) exótica y refrescante.",
  cerezas: "Cerezas locales, dulces y de color rojo intenso.",
  coco: "Coco seco con agua abundante y masa firme.",
  sandia: "Sandía roja jugosa. Perfecta para jugos y refrescarse.",
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksDangling(description: string, name: string): boolean {
  const normalizedDesc = normalize(description);
  const normalizedName = normalize(name);
  const mentionsLimon = normalizedDesc.includes("limon");
  const mentionsPlatano = normalizedDesc.includes("platano");
  const nameHasLimon = normalizedName.includes("limon");
  const nameHasPlatano = normalizedName.includes("platano");
  if (mentionsLimon && !nameHasLimon) return true;
  if (mentionsPlatano && !nameHasPlatano) return true;
  return false;
}

async function run() {
  const db = getDb();
  const snapshot = await db.collection("catalog_products").get();

  let updatedDocs = 0;
  let danglingFixes = 0;

  let batch = db.batch();
  let batchCount = 0;
  const batchSize = 450;

  for (const doc of snapshot.docs) {
    const data = doc.data() as Record<string, any>;
    const nameEs = data?.name?.es;
    const categoryId = (data?.categoryId ?? "") as string;
    if (!nameEs) continue;

    const normalizedName = normalize(nameEs);
    const manualDescription = FRUIT_DESCRIPTIONS[normalizedName];
    const isFruitCategory = normalize(categoryId).includes("frut");

    if (!manualDescription && !isFruitCategory) continue;

    const description = { ...(data.description ?? {}) } as Record<string, string>;
    let shouldUpdate = false;

    if (manualDescription) {
      if (description.es !== manualDescription) {
        description.es = manualDescription;
        shouldUpdate = true;
      }
    } else if (typeof description.es === "string" && looksDangling(description.es, nameEs)) {
      const fallback = `${nameEs} fresca y seleccionada.`;
      if (description.es !== fallback) {
        description.es = fallback;
        shouldUpdate = true;
        danglingFixes += 1;
      }
    }

    if (!shouldUpdate) continue;

    batch.update(doc.ref, { description });
    batchCount += 1;
    updatedDocs += 1;

    if (batchCount >= batchSize) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Updated fruit descriptions: ${updatedDocs} docs`);
  console.log(`Dangling fixes applied: ${danglingFixes} docs`);
}

run().catch((error) => {
  console.error("Failed to update fruit descriptions:", error);
  process.exit(1);
});
