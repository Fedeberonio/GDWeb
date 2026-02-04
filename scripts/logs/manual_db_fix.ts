import dotenv from "dotenv";

import { getDb } from "../lib/firestore";

dotenv.config();

type RepairEntry = {
  sku: string;
  name: string;
  es: string;
  en: string;
  price: number;
};

const FINAL_REPAIR_DATA: RepairEntry[] = [
  // FRUTAS (Alineadas con CSV Maestro)
  { sku: "GD-FRUT-024", name: "Aguacate", es: "Aguacate criollo maduro, cremoso y suave.", en: "Creamy local avocado, perfect for toast or salads.", price: 100 },
  { sku: "GD-FRUT-033", name: "Banana", es: "Guineos maduros dulces, listos para consumir.", en: "Sweet and ripe bananas, perfect energy boost.", price: 15 },
  { sku: "GD-FRUT-029", name: "Fresas", es: "Fresas frescas y dulces, ideales para postres.", en: "Fresh, sweet strawberries for smoothies or snacks.", price: 125 },
  { sku: "GD-FRUT-034", name: "Cerezas", es: "Cerezas locales (acerolas) ricas en Vitamina C.", en: "Local cherries (Acerolas), packed with Vitamin C.", price: 125 },
  { sku: "GD-FRUT-035", name: "Manzana", es: "Manzana roja importada, crujiente y dulce.", en: "Crisp and sweet imported red apple.", price: 85 },
  { sku: "GD-FRUT-031", name: "Coco", es: "Coco seco con agua abundante y masa firme.", en: "Dry coconut with sweet water and firm meat.", price: 75 },
  { sku: "GD-FRUT-036", name: "Sandía", es: "Sandía roja y jugosa, muy refrescante.", en: "Sweet and juicy red watermelon, hydrating.", price: 200 },
  
  { sku: "GD-FRUT-032", name: "Lechosa", es: "Lechosa (Papaya) madura dulce, ideal para digestión.", en: "Ripe and sweet papaya, great for digestion.", price: 75 },
  { sku: "GD-FRUT-041", name: "Uvas moradas", es: "Uvas moradas frescas y jugosas.", en: "Fresh and sweet purple grapes.", price: 225 },

  // VEGETALES (Corrigiendo el desplazamiento)
  { sku: "GD-VEGE-044", name: "Tomate bugalú", es: "Tomate bugalú fresco para salsas.", en: "Fresh plum tomato for sauces.", price: 35 },
  { sku: "GD-VEGE-045", name: "Papas", es: "Papas blancas versátiles.", en: "Versatile white potatoes.", price: 40 },
  { sku: "GD-VEGE-053", name: "Pepino", es: "Pepino verde refrescante.", en: "Refreshing green cucumber.", price: 25 },
  { sku: "GD-VEGE-062", name: "Cebolla", es: "Cebolla roja para cocinar.", en: "Red onion for cooking.", price: 45 },
  { sku: "GD-VEGE-067", name: "Limón", es: "Limón persa o criollo, con abundante jugo.", en: "Fresh and zesty lemons, perfect for juices.", price: 15 },
  { sku: "GD-VEGE-046", name: "Plátano verde", es: "Plátano verde de primera calidad.", en: "Premium quality green plantain.", price: 35 },
];

const TAMARINDO_ENTRY: RepairEntry = {
  sku: "GD-FRUT-044",
  name: "Tamarindo",
  es: "Tamarindo natural para jugos.",
  en: "Natural tamarind for fresh juice.",
  price: 60,
};

function buildPayload(entry: RepairEntry, data: Record<string, any>) {
  const existingName = (data?.name ?? {}) as Record<string, string>;
  const existingDescription = (data?.description ?? {}) as Record<string, string>;
  return {
    name: {
      ...existingName,
      es: entry.name,
    },
    description: {
      ...existingDescription,
      es: entry.es,
      en: entry.en,
    },
    description_en: entry.en,
    price: entry.price,
  };
}

async function updateEntry(entry: RepairEntry) {
  const db = getDb();
  const ref = db.collection("catalog_products").doc(entry.sku);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    console.warn(`⚠️ No encontrado: ${entry.sku}`);
    return false;
  }
  const data = snapshot.data() as Record<string, any>;
  const payload = buildPayload(entry, data);
  await ref.update(payload);
  console.log(`✅ Corregido: ${entry.sku} - ${entry.name}`);
  return true;
}

async function repairTamarindo() {
  const db = getDb();
  const byEs = await db.collection("catalog_products").where("name.es", "==", "Tamarindo").get();
  if (!byEs.empty) {
    const doc = byEs.docs[0];
    const payload = buildPayload({ ...TAMARINDO_ENTRY, sku: doc.id }, doc.data() as Record<string, any>);
    await doc.ref.update(payload);
    console.log(`✅ Corregido: ${doc.id} - Tamarindo`);
    return;
  }

  const byEn = await db.collection("catalog_products").where("name.en", "==", "Tamarind").get();
  if (!byEn.empty) {
    const doc = byEn.docs[0];
    const payload = buildPayload({ ...TAMARINDO_ENTRY, sku: doc.id }, doc.data() as Record<string, any>);
    await doc.ref.update(payload);
    console.log(`✅ Corregido: ${doc.id} - Tamarindo`);
    return;
  }

  const ref = db.collection("catalog_products").doc(TAMARINDO_ENTRY.sku);
  const payload = buildPayload(TAMARINDO_ENTRY, {});
  await ref.set(payload, { merge: true });
  console.log(`✅ Creado: ${TAMARINDO_ENTRY.sku} - Tamarindo`);
}

async function run() {
  let updated = 0;
  for (const entry of FINAL_REPAIR_DATA) {
    const didUpdate = await updateEntry(entry);
    if (didUpdate) updated += 1;
  }

  await repairTamarindo();

  console.log(`Listo. Total actualizados: ${updated}`);
}

run().catch((error) => {
  console.error("Error en manual_db_fix:", error);
  process.exit(1);
});
