import admin from "firebase-admin";

import serviceAccount from "../service-account.json";
import { compareCanonicalCatalogProducts, dedupeCatalogProducts, normalizeCatalogSearch } from "../src/modules/catalog/product-canonical";
import { normalizeCatalogProduct } from "../src/modules/catalog/product-normalization";
import type { Box, Product } from "../src/modules/catalog/types";

type FirestoreRecord = Record<string, unknown>;

type PriceEntry = {
  label: string;
  nameEs: string;
  nameEn: string;
  price: number;
  boxId?: string;
};

type SearchableProduct = {
  product: Product;
  exactTerms: Set<string>;
  fuzzyTerms: string[];
};

const PRICE_ENTRIES: PriceEntry[] = [
  { label: "BOX 1", nameEs: "Caribbean Fresh Pack", nameEn: "Caribbean Fresh Pack", price: 650, boxId: "GD-CAJA-001" },
  { label: "BOX 2", nameEs: "Island Weekssential", nameEn: "Island Weekssential", price: 990, boxId: "GD-CAJA-002" },
  { label: "BOX 3", nameEs: "Allgreenxclusive", nameEn: "Allgreenxclusive", price: 1990, boxId: "GD-CAJA-003" },
  { label: "Baba Ganoush", nameEs: "Baba Ganoush", nameEn: "Baba Ganoush", price: 500 },
  { label: "Hummus", nameEs: "Hummus", nameEn: "Hummus", price: 500 },
  { label: "Guacamole", nameEs: "Guacamole", nameEn: "Guacamole", price: 500 },
  { label: "Chimi Churri", nameEs: "Chimi Churri", nameEn: "Chimichurri", price: 350 },
  { label: "Pepinada", nameEs: "Pepinada", nameEn: "Pepinada", price: 175 },
  { label: "Tropicalote", nameEs: "Tropicalote", nameEn: "Tropicalote", price: 175 },
  { label: "Rosa Maravillosa", nameEs: "Rosa Maravillosa", nameEn: "Wonderful Rose", price: 175 },
  { label: "China Chinola", nameEs: "China Chinola", nameEn: "China Chinola", price: 175 },
  { label: "Melomania", nameEs: "Melomania", nameEn: "Melon Mania", price: 250 },
  { label: "Sandia mania", nameEs: "Sandia mania", nameEn: "Watermelon Mania", price: 250 },
  { label: "Huevos Blancos", nameEs: "Huevos Blancos", nameEn: "White Eggs", price: 150 },
  { label: "Huevos de color", nameEs: "Huevos de color", nameEn: "Colored Eggs", price: 190 },
  { label: "Huevos de campo orgánicos", nameEs: "Huevos de campo orgánicos", nameEn: "Organic Free-range Eggs", price: 380 },
  { label: "Miel pura de abejas", nameEs: "Miel pura de abejas", nameEn: "Pure Honey", price: 250 },
  { label: "Miel de abejas orgánica con panal", nameEs: "Miel de abejas orgánica con panal", nameEn: "Organic Honey with Comb", price: 500 },
  { label: "Aceite de oliva sabor ajo", nameEs: "Aceite de oliva sabor ajo", nameEn: "Garlic Flavored Olive Oil", price: 390 },
  { label: "Aceite de oliva extra virgen importado", nameEs: "Aceite de oliva extra virgen importado", nameEn: "Imported Extra Virgin Olive Oil", price: 2900 },
  { label: "Quinoa", nameEs: "Quinoa", nameEn: "Quinoa", price: 450 },
  { label: "Arroz blanco", nameEs: "Arroz blanco", nameEn: "White Rice", price: 125 },
  { label: "Arroz integral", nameEs: "Arroz integral", nameEn: "Brown Rice", price: 125 },
  { label: "Lentejas", nameEs: "Lentejas", nameEn: "Lentils", price: 175 },
  { label: "Habichuelas rojas", nameEs: "Habichuelas rojas", nameEn: "Red Beans", price: 150 },
  { label: "Habichuelas negras", nameEs: "Habichuelas negras", nameEn: "Black Beans", price: 150 },
  { label: "Habichuelas blancas", nameEs: "Habichuelas blancas", nameEn: "White Beans", price: 150 },
  { label: "Aguacates", nameEs: "Aguacates", nameEn: "Avocados", price: 100 },
  { label: "Mandarinas", nameEs: "Mandarinas", nameEn: "Tangerines", price: 85 },
  { label: "Chinola", nameEs: "Chinola", nameEn: "Passion Fruit", price: 45 },
  { label: "Platano maduro", nameEs: "Platano maduro", nameEn: "Ripe Plantain", price: 60 },
  { label: "Piña", nameEs: "Piña", nameEn: "Pineapple", price: 120 },
  { label: "Fresas", nameEs: "Fresas", nameEn: "Strawberries", price: 250 },
  { label: "Mango", nameEs: "Mango", nameEn: "Mango", price: 75 },
  { label: "Coco", nameEs: "Coco", nameEn: "Coconut", price: 120 },
  { label: "Lechosa", nameEs: "Lechosa", nameEn: "Papaya", price: 120 },
  { label: "Banana", nameEs: "Banana", nameEn: "Banana", price: 35 },
  { label: "Manzanas", nameEs: "Manzanas", nameEn: "Apples", price: 110 },
  { label: "Sandía", nameEs: "Sandía", nameEn: "Watermelon", price: 400 },
  { label: "Melón", nameEs: "Melón", nameEn: "Melon", price: 200 },
  { label: "Melón frances", nameEs: "Melón frances", nameEn: "French Melon", price: 230 },
  { label: "Pitahaya", nameEs: "Pitahaya", nameEn: "Dragon Fruit", price: 90 },
  { label: "Uvas blancas", nameEs: "Uvas blancas", nameEn: "White Grapes", price: 275 },
  { label: "Uvas moradas", nameEs: "Uvas moradas", nameEn: "Purple Grapes", price: 225 },
  { label: "Naranjas", nameEs: "Naranjas", nameEn: "Oranges", price: 80 },
  { label: "Carambola", nameEs: "Carambola", nameEn: "Star Fruit", price: 80 },
  { label: "Tomate bugalú", nameEs: "Tomate bugalú", nameEn: "Bugalu Tomato", price: 35 },
  { label: "Papas", nameEs: "Papas", nameEn: "Potatoes", price: 40 },
  { label: "Plátano verde", nameEs: "Plátano verde", nameEn: "Green Plantain", price: 80 },
  { label: "Lechuga rizada", nameEs: "Lechuga rizada", nameEn: "Curly Lettuce", price: 75 },
  { label: "Calabaza", nameEs: "Calabaza", nameEn: "Pumpkin", price: 300 },
  { label: "Berenjena", nameEs: "Berenjena", nameEn: "Eggplant", price: 70 },
  { label: "Lechuga repollada", nameEs: "Lechuga repollada", nameEn: "Iceberg Lettuce", price: 75 },
  { label: "Lechuga romana", nameEs: "Lechuga romana", nameEn: "Romaine Lettuce", price: 85 },
  { label: "Rabano", nameEs: "Rabano", nameEn: "Radish", price: 85 },
  { label: "Pepino", nameEs: "Pepino", nameEn: "Cucumber", price: 70 },
  { label: "Guineo verde", nameEs: "Guineo verde", nameEn: "Green Banana", price: 15 },
  { label: "Yuca", nameEs: "Yuca", nameEn: "Cassava", price: 45 },
  { label: "Repollo blanco", nameEs: "Repollo blanco", nameEn: "White Cabbage", price: 150 },
  { label: "Repollo morado", nameEs: "Repollo morado", nameEn: "Red cabbage", price: 140 },
  { label: "Tomate redondo", nameEs: "Tomate redondo", nameEn: "Round Tomato", price: 50 },
  { label: "Coliflor", nameEs: "Coliflor", nameEn: "Cauliflower", price: 275 },
  { label: "Bróccoli", nameEs: "Bróccoli", nameEn: "Broccoli", price: 150 },
  { label: "Ajo", nameEs: "Ajo", nameEn: "Garlic", price: 45 },
  { label: "Cebolla morada", nameEs: "Cebolla morada", nameEn: "Red Onion", price: 85 },
  { label: "Cebolla amarilla", nameEs: "Cebolla amarilla", nameEn: "Yellow Onion", price: 85 },
  { label: "Zanahoria", nameEs: "Zanahoria", nameEn: "Carrot", price: 75 },
  { label: "Batata", nameEs: "Batata", nameEn: "Sweet Potato", price: 75 },
  { label: "Ají morrón", nameEs: "Ají morrón", nameEn: "Bell Pepper", price: 130 },
  { label: "Maíz", nameEs: "Maíz", nameEn: "Corn", price: 50 },
  { label: "Limón", nameEs: "Limón", nameEn: "Lemon", price: 35 },
  { label: "Ñame", nameEs: "Ñame", nameEn: "Yam", price: 100 },
  { label: "Zucchini", nameEs: "Zucchini", nameEn: "Zucchini", price: 60 },
  { label: "Cilantro", nameEs: "Cilantro", nameEn: "Cilantro", price: 150 },
  { label: "Genjibre", nameEs: "Genjibre", nameEn: "Ginger", price: 65 },
  { label: "Orégano", nameEs: "Orégano", nameEn: "Oregano", price: 75 },
  { label: "Perejil", nameEs: "Perejil", nameEn: "Parsley", price: 150 },
  { label: "Romero", nameEs: "Romero", nameEn: "Rosemary", price: 100 },
  { label: "Apio", nameEs: "Apio", nameEn: "Celery", price: 90 },
];

const MANUAL_ALIASES: Record<string, string[]> = {
  "Chimi Churri": ["Chimichurri"],
  "Wonderful Rose": ["Rosa Maravillosa"],
  "Melomania": ["Melon Mania"],
  "Sandia mania": ["Sandia Mania", "Watermelon Mania"],
  "Huevos de campo orgánicos": ["Huevos de campo organicos", "Organic Free-range Eggs"],
  "Miel de abejas orgánica con panal": ["Miel de abejas organica con panal", "Organic Honey with Comb"],
  "Platano maduro": ["Plátano maduro"],
  "Aguacates": ["Aguacate", "Avocados"],
  "Mandarinas": ["Mandarina", "Tangerines"],
  "Fresas": ["Fresa", "Strawberries"],
  "Manzanas": ["Manzana", "Apples"],
  "Naranjas": ["Naranja", "Oranges"],
  "Papas": ["Papa", "Potatoes"],
  "Rabano": ["Rábano", "Radish"],
  "Bróccoli": ["Broccoli", "Brócoli"],
  "Genjibre": ["Jengibre", "Ginger"],
};

const MANUAL_PRODUCT_IDS: Record<string, string> = {
  "Habichuelas negras": "GD-OTRO-023",
  "Habichuelas blancas": "GD-OTRO-023",
  "Piña": "GD-FRUT-028",
  "Cebolla amarilla": "GD-VEGE-062",
};

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

function isBoxCatalogItem(product: Product) {
  const sku = (product.sku ?? product.id ?? "").toUpperCase();
  const categoryId = (product.categoryId ?? "").toLowerCase();
  return product.type === "box" || categoryId === "cajas" || sku.startsWith("GD-CAJA-");
}

function isInternalIngredientCatalogItem(product: Product) {
  const sku = (product.sku ?? product.id ?? "").toUpperCase();
  const categoryId = (product.categoryId ?? "").toLowerCase();
  return categoryId === "ingredientes" || sku.startsWith("GD-ING-") || sku.startsWith("GD-INGR-");
}

function buildSearchableProducts(products: Product[]): SearchableProduct[] {
  return dedupeCatalogProducts(products)
    .filter((product) => !isBoxCatalogItem(product))
    .filter((product) => !isInternalIngredientCatalogItem(product))
    .map((product) => {
      const exactTerms = new Set(
        [product.name.es, product.name.en, product.slug, product.sku, product.id]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .map(normalizeCatalogSearch),
      );

      const fuzzyTerms = Array.from(exactTerms);
      return { product, exactTerms, fuzzyTerms };
    })
    .sort((left, right) => compareCanonicalCatalogProducts(left.product, right.product));
}

function getEntrySearchTerms(entry: PriceEntry) {
  return Array.from(
    new Set(
      [
        entry.label,
        entry.nameEs,
        entry.nameEn,
        ...(MANUAL_ALIASES[entry.label] ?? []),
        ...(MANUAL_ALIASES[entry.nameEs] ?? []),
        ...(MANUAL_ALIASES[entry.nameEn] ?? []),
      ]
        .filter(Boolean)
        .map(normalizeCatalogSearch),
    ),
  );
}

function resolveProductEntry(entry: PriceEntry, searchableProducts: SearchableProduct[]) {
  const manualProductId = MANUAL_PRODUCT_IDS[entry.label] ?? MANUAL_PRODUCT_IDS[entry.nameEs] ?? MANUAL_PRODUCT_IDS[entry.nameEn];
  if (manualProductId) {
    const manualProduct = searchableProducts.find(({ product }) => product.id === manualProductId);
    if (manualProduct) {
      return {
        product: manualProduct.product,
        strategy: "manual-id" as const,
        candidates: [manualProduct.product],
      };
    }
  }

  const searchTerms = getEntrySearchTerms(entry);

  const exactMatches = searchableProducts.filter(({ exactTerms }) =>
    searchTerms.some((term) => exactTerms.has(term)),
  );

  if (exactMatches.length === 1) {
    return { product: exactMatches[0].product, strategy: "exact" as const, candidates: exactMatches.map(({ product }) => product) };
  }

  if (exactMatches.length > 1) {
    return { product: null, strategy: "ambiguous-exact" as const, candidates: exactMatches.map(({ product }) => product) };
  }

  const containsMatches = searchableProducts.filter(({ fuzzyTerms }) =>
    searchTerms.some((term) => fuzzyTerms.some((field) => field.includes(term) || term.includes(field))),
  );

  if (containsMatches.length === 1) {
    return { product: containsMatches[0].product, strategy: "contains" as const, candidates: containsMatches.map(({ product }) => product) };
  }

  if (containsMatches.length > 1) {
    return { product: null, strategy: "ambiguous-contains" as const, candidates: containsMatches.map(({ product }) => product) };
  }

  return { product: null, strategy: "missing" as const, candidates: [] as Product[] };
}

function formatProductRef(product: Product) {
  return `${product.id} | ${product.name.es || product.name.en || product.id} | ${product.categoryId ?? "sin-categoria"} | status ${product.status ?? "legacy"} | price ${product.price} | sale ${product.salePrice ?? "null"}`;
}

async function flushBatch(batch: FirebaseFirestore.WriteBatch, writes: number) {
  if (writes === 0) return;
  await batch.commit();
}

async function main() {
  const productSnapshot = await db.collection("catalog_products").get();
  const rawProducts = productSnapshot.docs.map((doc) =>
    normalizeCatalogProduct(doc.id, (doc.data() ?? {}) as FirestoreRecord),
  );
  const searchableProducts = buildSearchableProducts(rawProducts);
  const productById = new Map(productSnapshot.docs.map((doc) => [doc.id, (doc.data() ?? {}) as FirestoreRecord]));

  const boxSnapshot = await db.collection("catalog_boxes").get();
  const boxById = new Map(
    boxSnapshot.docs.map((doc) => [doc.id, { id: doc.id, ...(doc.data() ?? {}) } as unknown as Box & FirestoreRecord]),
  );

  const unresolved: Array<{ entry: PriceEntry; strategy: string; candidates: Product[] }> = [];
  const productUpdates: Array<{ entry: PriceEntry; product: Product }> = [];
  const boxUpdates: Array<{ entry: PriceEntry; boxId: string }> = [];

  for (const entry of PRICE_ENTRIES) {
    if (entry.boxId) {
      if (!boxById.has(entry.boxId)) {
        unresolved.push({ entry, strategy: "missing-box", candidates: [] });
        continue;
      }
      boxUpdates.push({ entry, boxId: entry.boxId });
      continue;
    }

    const resolution = resolveProductEntry(entry, searchableProducts);
    if (!resolution.product) {
      unresolved.push({ entry, strategy: resolution.strategy, candidates: resolution.candidates });
      continue;
    }

    productUpdates.push({ entry, product: resolution.product });
  }

  if (unresolved.length > 0) {
    console.log("No se aplicaron cambios. Hay entradas sin resolver:\n");
    unresolved.forEach(({ entry, strategy, candidates }) => {
      console.log(`- ${entry.label} -> ${strategy}`);
      candidates.slice(0, 5).forEach((candidate) => {
        console.log(`    ${formatProductRef(candidate)}`);
      });
    });
    process.exitCode = 1;
    return;
  }

  const updatePreview = [
    ...boxUpdates.map(({ entry, boxId }) => `BOX ${boxId} => ${entry.price}`),
    ...productUpdates.map(({ entry, product }) => `${product.id} (${product.name.es || product.name.en}) => ${entry.price}`),
  ];

  console.log(`Entradas resueltas: ${updatePreview.length}`);
  updatePreview.slice(0, 20).forEach((line) => console.log(`- ${line}`));
  if (updatePreview.length > 20) {
    console.log(`... y ${updatePreview.length - 20} cambios mas`);
  }

  if (!shouldWrite) {
    console.log("\nDry-run completado. Ejecuta con --write para aplicar.");
    return;
  }

  let batch = db.batch();
  let writes = 0;
  let committedWrites = 0;

  const commitIfNeeded = async () => {
    if (writes >= 400) {
      await flushBatch(batch, writes);
      committedWrites += writes;
      batch = db.batch();
      writes = 0;
    }
  };

  for (const { entry, boxId } of boxUpdates) {
    const catalogBoxRef = db.collection("catalog_boxes").doc(boxId);
    const mirrorRef = db.collection("catalog_products").doc(boxId);
    const currentMirror = productById.get(boxId) ?? {};

    batch.set(
      catalogBoxRef,
      {
        price: { amount: entry.price, currency: "DOP" },
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    writes += 1;

    batch.set(
      mirrorRef,
      {
        price: entry.price,
        salePrice: null,
        updatedAt: new Date().toISOString(),
        sku: typeof currentMirror.sku === "string" ? currentMirror.sku : boxId,
        id: boxId,
      },
      { merge: true },
    );
    writes += 1;
    await commitIfNeeded();
  }

  for (const { entry, product } of productUpdates) {
    const productRef = db.collection("catalog_products").doc(product.id);
    batch.set(
      productRef,
      {
        price: entry.price,
        salePrice: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    writes += 1;
    await commitIfNeeded();
  }

  await flushBatch(batch, writes);
  committedWrites += writes;

  console.log(`\nCambios aplicados: ${committedWrites}`);
}

main().catch((error) => {
  console.error("Error aplicando precios de venta:", error);
  process.exitCode = 1;
});
