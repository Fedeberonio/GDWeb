// Script para importar catálogo desde DataNuevaPro/GreenDolio_Productos_25nov.csv
// NO reemplaza el script existente, es complementario
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import type { Firestore } from "firebase-admin/firestore";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

const YES_VALUES = new Set(["si", "sí", "yes", "true", "1", "Sí"]);

interface CSVProduct {
  SKU: string;
  Nombre_Producto: string;
  Categoria: string;
  Subcategoria: string;
  Precio_DOP: number;
  Precio_Compra: number;
  Peso_En_Libras: number;
  Descripcion_Corta: string;
  URL_Imagen: string;
  Tags: string;
  Destacado_Web: string;
  Activo: string;
  Organico: string;
  Apto_Vegano: string;
  Libre_Gluten: string;
  Unidad_Venta: string;
  Almacenamiento: string;
  Vida_Util: string;
  Ingredientes: string;
  Valor_Nutricional: string;
}

function toNumber(value: string): number {
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCSV(filePath: string): CSVProduct[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headers = lines[0].split(",");

  const products: CSVProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });

    const product: CSVProduct = {
      SKU: row.SKU ?? "",
      Nombre_Producto: row.Nombre_Producto ?? "",
      Categoria: row.Categoria ?? "",
      Subcategoria: row.Subcategoria ?? "",
      Precio_DOP: toNumber(row.Precio_DOP ?? ""),
      Precio_Compra: toNumber(row.Precio_Compra ?? ""),
      Peso_En_Libras: toNumber(row.Peso_En_Libras ?? ""),
      Descripcion_Corta: row.Descripcion_Corta ?? "",
      URL_Imagen: row.URL_Imagen ?? "",
      Tags: row.Tags ?? "",
      Destacado_Web: row.Destacado_Web ?? "",
      Activo: row.Activo ?? "",
      Organico: row.Organico ?? "",
      Apto_Vegano: row.Apto_Vegano ?? "",
      Libre_Gluten: row.Libre_Gluten ?? "",
      Unidad_Venta: row.Unidad_Venta ?? "",
      Almacenamiento: row.Almacenamiento ?? "",
      Vida_Util: row.Vida_Util ?? "",
      Ingredientes: row.Ingredientes ?? "",
      Valor_Nutricional: row.Valor_Nutricional ?? "",
    };

    products.push(product);
  }

  return products;
}

function toBoolean(value: string): boolean {
  return YES_VALUES.has(value.trim().toLowerCase());
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function translateToEnglish(spanishName: string): string {
  // Traducciones básicas - mejorar según necesidad
  const translations: Record<string, string> = {
    // Cajas
    "Box 1 'Caribbean Fresh Pack' (3 días)": "Box 1 'Caribbean Fresh Pack' (3 days)",
    "Box 2 'Island Weekssential' (1 semana)": "Box 2 'Island Weekssential' (1 week)",
    "Box 3 'Allgreenxclusive' (2 semanas)": "Box 3 'Allgreenxclusive' (2 weeks)",

    // Productos caseros
    "Baba Ganoush": "Baba Ganoush",
    "Hummus": "Hummus",
    "Guacamole": "Guacamole",
    "Chimichurri": "Chimichurri",

    // Jugos
    "Pepinada": "Cucumber Juice",
    "Tropicalote": "Tropical Mix",
    "Rosa Maravillosa": "Wonderful Pink",
    "China Chinola": "Orange Passion Fruit",

    // Huevos
    "Huevos Blancos": "White Eggs",
    "Huevos de color": "Brown Eggs",
    "Huevos de campo orgánicos": "Organic Free-Range Eggs",

    // Miel
    "Miel pura de abejas": "Pure Bee Honey",
    "Miel orgánica con panal": "Organic Honey with Honeycomb",

    // Frutas
    "Aguacate": "Avocado",
    "Mandarina": "Tangerine",
    "Chinola": "Passion Fruit",
    "Plátano maduro": "Ripe Plantain",
    "Piña pequeña": "Small Pineapple",
    "Fresas": "Strawberries",
    "Mango": "Mango",
    "Coco": "Coconut",
    "Lechosa": "Papaya",
    "Banana": "Banana",
    "Cerezas": "Cherries",
    "Manzana": "Apple",
    "Sandía": "Watermelon",
    "Melón": "Melon",
    "Melón francés": "Cantaloupe",
    "Pitahaya": "Dragon Fruit",
    "Uvas blancas": "White Grapes",
    "Uvas moradas": "Purple Grapes",
    "Naranja": "Orange",
    "Carambola": "Star Fruit",

    // Vegetales
    "Tomate bugalú": "Cherry Tomato",
    "Papas": "Potatoes",
    "Plátano verde": "Green Plantain",
    "Lechuga rizada": "Curly Lettuce",
    "Calabaza": "Pumpkin",
    "Berenjena": "Eggplant",
  };

  return translations[spanishName] || spanishName;
}

function mapCategoryToId(categoria: string): string {
  const categoryMap: Record<string, string> = {
    "Cajas": "cajas",
    "Ensaladas": "ensaladas",
    "Jugos": "jugos",
    "Jugos Naturales": "jugos",
    "Productos Caseros": "otros",
    "Legumbres": "otros",
    "Productos de Granja": "productos-de-granja",
    "Otros": "otros",
    "Frutas": "frutas",
    "Vegetales": "vegetales",
    "Hierbas": "hierbas-y-especias",
    "Hierbas y Especias": "hierbas-y-especias",
  };

  return categoryMap[categoria] || generateSlug(categoria);
}

async function createCategories(db: Firestore) {
  const categoriesRef = db.collection(catalogCollections.categories);

  const categories = [
    {
      id: "cajas",
      slug: "cajas",
      name: { es: "Cajas", en: "Boxes" },
      description: { es: "Cajas pre-armadas para 3 días, 1 semana o 2 semanas", en: "Pre-built boxes for 3 days, 1 week or 2 weeks" },
      sortOrder: 1,
      status: "active" as const,
    },
    {
      id: "ensaladas",
      slug: "ensaladas",
      name: { es: "Ensaladas", en: "Salads" },
      description: { es: "Ensaladas listas para disfrutar", en: "Ready-to-eat salads" },
      sortOrder: 2,
      status: "active" as const,
    },
    {
      id: "jugos",
      slug: "jugos",
      name: { es: "Jugos", en: "Juices" },
      description: { es: "Jugos naturales recién preparados", en: "Freshly prepared natural juices" },
      sortOrder: 3,
      status: "active" as const,
    },
    {
      id: "productos-de-granja",
      slug: "productos-de-granja",
      name: { es: "Productos de Granja", en: "Farm Products" },
      description: { es: "Huevos y miel de productores locales", en: "Eggs and honey from local producers" },
      sortOrder: 4,
      status: "active" as const,
    },
    {
      id: "frutas",
      slug: "frutas",
      name: { es: "Frutas", en: "Fruits" },
      description: { es: "Frutas frescas de temporada", en: "Fresh seasonal fruits" },
      sortOrder: 5,
      status: "active" as const,
    },
    {
      id: "vegetales",
      slug: "vegetales",
      name: { es: "Vegetales", en: "Vegetables" },
      description: { es: "Vegetales frescos del día", en: "Fresh vegetables of the day" },
      sortOrder: 6,
      status: "active" as const,
    },
    {
      id: "hierbas-y-especias",
      slug: "hierbas-y-especias",
      name: { es: "Hierbas y Especias", en: "Herbs and Spices" },
      description: { es: "Hierbas frescas y especias aromáticas", en: "Fresh herbs and aromatic spices" },
      sortOrder: 7,
      status: "active" as const,
    },
    {
      id: "otros",
      slug: "otros",
      name: { es: "Otros", en: "Others" },
      description: { es: "Aceites, granos y productos de despensa", en: "Oils, grains and pantry products" },
      sortOrder: 8,
      status: "active" as const,
    },
  ];

  console.log("📦 Creando/actualizando categorías...");
  for (const category of categories) {
    await categoriesRef.doc(category.id).set(category, { merge: true });
    console.log(`  ✓ ${category.name.es} (${category.id})`);
  }
}

async function importProducts(db: Firestore, csvPath: string) {
  console.log("📂 Leyendo CSV:", csvPath);

  const products = parseCSV(csvPath);
  console.log(`📊 Encontrados ${products.length} productos en CSV`);

  const productsRef = db.collection(catalogCollections.products);
  const boxesRef = db.collection(catalogCollections.boxes);

  let imported = 0;
  let skipped = 0;

  for (const csvProduct of products) {
    try {
      if (!csvProduct.SKU || !csvProduct.Nombre_Producto) {
        console.log(`  ⚠️  Saltando fila sin SKU o nombre`);
        skipped++;
        continue;
      }

      const slug = generateSlug(csvProduct.Nombre_Producto);
      const categoryId = mapCategoryToId(csvProduct.Categoria);
      const isActive = toBoolean(csvProduct.Activo);

      // Separar cajas de productos regulares
      const isBox = csvProduct.Categoria === "Cajas";

      const baseData = {
        slug,
        sku: csvProduct.SKU,
        name: {
          es: csvProduct.Nombre_Producto,
          en: translateToEnglish(csvProduct.Nombre_Producto),
        },
        description: {
          es: csvProduct.Descripcion_Corta || "",
          en: translateToEnglish(csvProduct.Descripcion_Corta || ""),
        },
        categoryId,
        price: {
          amount: parseFloat(csvProduct.Precio_DOP.toString()) || 0,
          currency: "DOP",
        },
        status: isActive ? ("active" as const) : ("inactive" as const),
        image: csvProduct.URL_Imagen || "",
        tags: csvProduct.Tags ? csvProduct.Tags.split(",").map((t: string) => t.trim()) : [],
        isFeatured: toBoolean(csvProduct.Destacado_Web),
        nutrition: {
          vegan: toBoolean(csvProduct.Apto_Vegano),
          glutenFree: toBoolean(csvProduct.Libre_Gluten),
          organic: toBoolean(csvProduct.Organico),
        },
        logistics: {
          weightKg: csvProduct.Peso_En_Libras ? parseFloat(csvProduct.Peso_En_Libras.toString()) * 0.453592 : undefined,
          storage: csvProduct.Almacenamiento ? { es: csvProduct.Almacenamiento } : undefined,
        },
        // Campos adicionales para cálculo de swaps
        metadata: {
          weightLb: parseFloat(csvProduct.Peso_En_Libras?.toString() || "0"),
          wholesaleCost: parseFloat(csvProduct.Precio_Compra?.toString() || "0"),
          costPerLb: parseFloat(csvProduct.Precio_Compra?.toString() || "0") / parseFloat(csvProduct.Peso_En_Libras?.toString() || "1"),
          unit: csvProduct.Unidad_Venta || "unidad",
        },
      };

      if (isBox) {
        // Guardar como Box
        const boxData = {
          ...baseData,
          id: csvProduct.SKU,
          variants: ["MIX", "FRUTAL", "VEGGIE"], // Las variantes se importarán después
        };

        await boxesRef.doc(csvProduct.SKU).set(boxData, { merge: true });
        console.log(`  ✓ Caja: ${csvProduct.Nombre_Producto} (${csvProduct.SKU})`);
      } else {
        // Guardar como Product
        const productData = {
          ...baseData,
          id: csvProduct.SKU,
          unit: csvProduct.Unidad_Venta ? { es: csvProduct.Unidad_Venta } : undefined,
        };

        await productsRef.doc(csvProduct.SKU).set(productData, { merge: true });
        console.log(`  ✓ Producto: ${csvProduct.Nombre_Producto} (${csvProduct.SKU})`);
      }

      imported++;
    } catch (error) {
      console.error(`  ❌ Error importando ${csvProduct.Nombre_Producto}:`, error);
      skipped++;
    }
  }

  console.log(`\n✅ Importación completada:`);
  console.log(`   - Importados: ${imported}`);
  console.log(`   - Omitidos: ${skipped}`);
}

async function main() {
  const csvPath = path.resolve(__dirname, "../../../../DataNuevaPro/GreenDolio_Productos_25nov.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("❌ No se encontró el archivo CSV en:", csvPath);
    process.exit(1);
  }

  const db = getDb();

  console.log("🚀 Iniciando importación desde CSV nuevo...\n");

  // Paso 1: Crear/actualizar categorías
  await createCategories(db);

  console.log();

  // Paso 2: Importar productos
  await importProducts(db, csvPath);

  console.log("\n🎉 ¡Importación completada exitosamente!");
  console.log("\n📝 Siguiente paso: Ejecutar importación de contenidos de cajas");
  console.log("   npm --workspace apps/api run import:box-contents");

  process.exit(0);
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
