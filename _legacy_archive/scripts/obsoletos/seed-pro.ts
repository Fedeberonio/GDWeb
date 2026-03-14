import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { readFile, utils } from "xlsx";

import { getDb } from "../lib/firestore";

dotenv.config();

type ProductRow = {
  SKU?: string;
  Nombre_Producto?: string;
  Nombre_Producto_EN?: string;
  Descripcion_Corta?: string;
  Descripcion_Corta_EN?: string;
  Precio_DOP?: number | string;
  Unidad_Venta?: string;
  Marketing_Tier?: string;
  Duration?: string;
  Unit_Size?: string;
  Categoria?: string;
};

type ComboRow = {
  Combo_ID?: string;
  Nombre_ES?: string;
  Nombre_EN?: string;
  Jugo?: string;
  Precio?: number | string;
  Calorias?: number | string;
  Proteinas_G?: number | string;
  Es_GlutenFree?: boolean | string;
  Beneficio_Principal_ES?: string;
  Beneficio_Principal_EN?: string;
};

type BoxContentRow = {
  Caja_ID?: string;
  Caja_Nombre?: string;
  Variante?: string;
  Producto?: string;
  Cantidad?: number | string;
};

type BusinessRow = {
  Category?: string;
  Metric_Label?: string;
  Value?: number | string;
  Unit?: string;
};

type DocWrite = {
  id: string;
  data: Record<string, unknown>;
};

const repoRoot = path.resolve(__dirname, "../../../..");
const csvRoot = path.join(repoRoot, "legacy");
const csvPaths = {
  products: path.join(csvRoot, "master_products_clean.csv"),
  combos: path.join(csvRoot, "lunch_combos_master.csv"),
  boxContents: path.join(csvRoot, "box_contents_logic.csv"),
  business: path.join(csvRoot, "business_parameters.csv"),
};

function readCsvRows<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing CSV: ${filePath}`);
  }
  const workbook = readFile(filePath, { raw: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return utils.sheet_to_json<T>(sheet, { defval: "", raw: false }) as T[];
}

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return fixEncoding(String(value)).trim();
}

function fixEncoding(value: string): string {
  return value
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‘/g, "Ñ")
    .replace(/Â¿/g, "¿")
    .replace(/Â¡/g, "¡")
    .replace(/Ã\s/g, "í ");
}

function cleanProductName(value: string): string {
  return value
    .replace(/^box\s*\d+\s*/i, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const sanitized = normalized.replace(/[^0-9.,-]/g, "");
    if (!sanitized) return undefined;
    const parsed = Number.parseFloat(sanitized.replace(/,/g, "."));
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "si", "sí", "1", "y"].includes(normalized)) return true;
    if (["false", "no", "0", "n"].includes(normalized)) return false;
  }
  return false;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizeJuiceKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string) {
  const batchSize = 400;
  while (true) {
    const snapshot = await db.collection(collectionPath).limit(batchSize).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function writeCollection(db: FirebaseFirestore.Firestore, collectionPath: string, docs: DocWrite[]) {
  const batchSize = 400;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((doc) => {
      const ref = db.collection(collectionPath).doc(doc.id);
      batch.set(ref, doc.data);
    });
    await batch.commit();
  }
}

function buildProductDocs(rows: ProductRow[]): DocWrite[] {
  const docs: DocWrite[] = [];
  rows.forEach((row) => {
    const sku = normalizeString(row.SKU);
    if (!sku) return;
    const rawNameEs = normalizeString(row.Nombre_Producto);
    const rawNameEn = normalizeString(row.Nombre_Producto_EN);
    const cleanedNameEs = cleanProductName(rawNameEs);
    const cleanedNameEn = cleanProductName(rawNameEn || rawNameEs);
    const imageUrl = `/assets/images/products/${sku}.png`;
    const categoryId = slugify(normalizeString(row.Categoria));
    const data = {
      name: {
        es: cleanedNameEs,
        en: cleanedNameEn,
      },
      description: {
        es: normalizeString(row.Descripcion_Corta),
        en: normalizeString(row.Descripcion_Corta_EN),
      },
      price: toNumber(row.Precio_DOP) ?? 0,
      unit: normalizeString(row.Unidad_Venta),
      attributes: {
        marketingTier: normalizeString(row.Marketing_Tier),
        duration: normalizeString(row.Duration),
        unitSize: normalizeString(row.Unit_Size),
      },
      image_url: imageUrl,
      image: imageUrl,
      categoryId: categoryId || undefined,
      isActive: true,
    };
    docs.push({ id: sku, data });
  });
  return docs;
}

function buildComboDocs(rows: ComboRow[]): DocWrite[] {
  const juiceImageMap: Record<string, string> = {
    "pepinada": "JUGO-PEPINADA",
    "tropicalote": "JUGO-TROPICALOTE",
    "rosa maravillosa": "JUGO-ROSA-MARAVILLOSA",
    "china chinola": "JUGO-CHINA-CHINOLA",
    "zanahoria manzana limon": "JUGO-ZANAHORIA-MANZANA",
  };
  const docs: DocWrite[] = [];
  rows.forEach((row) => {
    const id = normalizeString(row.Combo_ID);
    if (!id) return;
    const juiceKey = normalizeJuiceKey(normalizeString(row.Jugo));
    const juiceImage = juiceImageMap[juiceKey];
    const imageUrl = juiceImage ? `/assets/images/products/${juiceImage}.png` : "";
    const data = {
      name: {
        es: normalizeString(row.Nombre_ES),
        en: normalizeString(row.Nombre_EN),
      },
      price: toNumber(row.Precio) ?? 0,
      nutrition: {
        calories: toNumber(row.Calorias) ?? 0,
        protein: toNumber(row.Proteinas_G) ?? 0,
        isGlutenFree: toBoolean(row.Es_GlutenFree),
      },
      benefits: {
        es: normalizeString(row.Beneficio_Principal_ES),
        en: normalizeString(row.Beneficio_Principal_EN),
      },
      image_url: imageUrl,
      image: imageUrl,
    };
    docs.push({ id, data });
  });
  return docs;
}

function buildBoxDefinitionDocs(rows: BoxContentRow[]): DocWrite[] {
  const boxMap = new Map<string, Map<string, { name: string; items: Array<{ product: string; quantity: number }> }>>();

  rows.forEach((row) => {
    const boxId = normalizeString(row.Caja_ID);
    if (!boxId) return;
    const variantName = normalizeString(row.Variante);
    const productName = normalizeString(row.Producto);
    if (!variantName || !productName) return;
    const quantity = toNumber(row.Cantidad) ?? 0;

    if (!boxMap.has(boxId)) {
      boxMap.set(boxId, new Map());
    }
    const variants = boxMap.get(boxId)!;
    if (!variants.has(variantName)) {
      variants.set(variantName, { name: variantName, items: [] });
    }
    variants.get(variantName)!.items.push({ product: productName, quantity });
  });

  return Array.from(boxMap.entries()).map(([boxId, variants]) => ({
    id: boxId,
    data: {
      variants: Array.from(variants.values()),
    },
  }));
}

function buildBusinessStatsDocs(rows: BusinessRow[]): DocWrite[] {
  const docs: DocWrite[] = [];
  rows.forEach((row) => {
    const category = normalizeString(row.Category);
    const metric = normalizeString(row.Metric_Label);
    if (!category || !metric) return;
    const id = slugify(`${category}-${metric}`);
    const value = toNumber(row.Value);
    const data = {
      Category: category,
      Metric_Label: metric,
      Value: value ?? normalizeString(row.Value),
      Unit: normalizeString(row.Unit),
    };
    docs.push({ id, data });
  });
  return docs;
}

async function run() {
  if (process.env.ALLOW_CSV_SEED !== "true") {
    throw new Error("CSV seed is archived. Set ALLOW_CSV_SEED=true to run.");
  }
  const db = getDb();

  const productRows = readCsvRows<ProductRow>(csvPaths.products);
  const comboRows = readCsvRows<ComboRow>(csvPaths.combos);
  const boxRows = readCsvRows<BoxContentRow>(csvPaths.boxContents);
  const businessRows = readCsvRows<BusinessRow>(csvPaths.business);

  const productDocs = buildProductDocs(productRows);
  const comboDocs = buildComboDocs(comboRows);
  const boxDocs = buildBoxDefinitionDocs(boxRows);
  const businessDocs = buildBusinessStatsDocs(businessRows);

  console.log("Prepared docs:", {
    catalog_products: productDocs.length,
    lunch_combos: comboDocs.length,
    box_definitions: boxDocs.length,
    business_stats: businessDocs.length,
  });

  await deleteCollection(db, "catalog_products");
  await deleteCollection(db, "lunch_combos");
  await deleteCollection(db, "box_definitions");
  await deleteCollection(db, "business_stats");

  await writeCollection(db, "catalog_products", productDocs);
  await writeCollection(db, "lunch_combos", comboDocs);
  await writeCollection(db, "box_definitions", boxDocs);
  await writeCollection(db, "business_stats", businessDocs);

  console.log("Seed completed.");
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
