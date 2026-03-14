// Script para importar contenidos de cajas desde DataNuevaPro/GreenDolio_Contenidos_Cajas_25nov.csv
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { getDb } from "../lib/firestore";

dotenv.config();

interface BoxContentCSV {
  Caja_ID: string;
  Caja_Nombre: string;
  Variante: string; // MIX, FRUTAL, VEGGIE
  Producto: string;
  Cantidad: number;
  Costo_Unitario: number;
  Peso_Unit_Lb: number;
  Costo_Total: number;
  Peso_Total_Lb: number;
}

function parseCSV(filePath: string): BoxContentCSV[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headers = lines[0].split(",");

  const contents: BoxContentCSV[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim() || "";
      row[header.trim()] = value;
    });

    // Convertir números
    row.Cantidad = parseInt(row.Cantidad) || 0;
    row.Costo_Unitario = parseFloat(row.Costo_Unitario) || 0;
    row.Peso_Unit_Lb = parseFloat(row.Peso_Unit_Lb) || 0;
    row.Costo_Total = parseFloat(row.Costo_Total) || 0;
    row.Peso_Total_Lb = parseFloat(row.Peso_Total_Lb) || 0;

    contents.push(row as BoxContentCSV);
  }

  return contents;
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

async function importBoxContents(db: FirebaseFirestore.Firestore, csvPath: string) {
  console.log("📂 Leyendo CSV de contenidos:", csvPath);

  const contents = parseCSV(csvPath);
  console.log(`📊 Encontradas ${contents.length} líneas de contenido`);

  // Agrupar por Caja_ID + Variante
  const groupedByBox = contents.reduce((acc, item) => {
    const key = `${item.Caja_ID}_${item.Variante}`;
    if (!acc[key]) {
      acc[key] = {
        boxId: item.Caja_ID,
        boxName: item.Caja_Nombre,
        variant: item.Variante,
        products: [],
        totalCost: 0,
        totalWeightLb: 0,
      };
    }

    acc[key].products.push({
      productName: item.Producto,
      productSku: generateSlug(item.Producto),
      quantity: item.Cantidad,
      unitCost: item.Costo_Unitario,
      unitWeightLb: item.Peso_Unit_Lb,
      totalCost: item.Costo_Total,
      totalWeightLb: item.Peso_Total_Lb,
    });

    acc[key].totalCost += item.Costo_Total;
    acc[key].totalWeightLb += item.Peso_Total_Lb;

    return acc;
  }, {} as Record<string, any>);

  const boxVariantsRef = db.collection("boxVariants");

  console.log("\n📦 Importando variantes de cajas...");

  let imported = 0;

  for (const [key, data] of Object.entries(groupedByBox)) {
    try {
      const variantDoc = {
        boxId: data.boxId,
        boxName: data.boxName,
        variant: data.variant,
        products: data.products,
        totalCost: data.totalCost,
        totalWeightLb: data.totalWeightLb,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await boxVariantsRef.doc(key).set(variantDoc, { merge: true });

      console.log(`  ✓ ${data.boxName} - ${data.variant} (${data.products.length} productos)`);
      imported++;
    } catch (error) {
      console.error(`  ❌ Error importando ${key}:`, error);
    }
  }

  console.log(`\n✅ Importación de variantes completada:`);
  console.log(`   - Variantes importadas: ${imported}`);
  console.log(`   - Total de líneas procesadas: ${contents.length}`);
}

async function verifyProducts(db: FirebaseFirestore.Firestore, csvPath: string) {
  console.log("\n🔍 Verificando que todos los productos existan en Firestore...");

  const contents = parseCSV(csvPath);
  const productsRef = db.collection("products");

  const uniqueProducts = new Set(contents.map((c) => generateSlug(c.Producto)));
  const missingProducts: string[] = [];

  for (const productSku of uniqueProducts) {
    const doc = await productsRef.doc(productSku).get();
    if (!doc.exists) {
      missingProducts.push(productSku);
    }
  }

  if (missingProducts.length > 0) {
    console.log(`\n⚠️  Productos faltantes en Firestore (${missingProducts.length}):`);
    missingProducts.forEach((slug) => console.log(`   - ${slug}`));
    console.log("\n💡 Estos productos deben ser importados primero desde el CSV de productos.");
  } else {
    console.log("✅ Todos los productos existen en Firestore");
  }
}

async function main() {
  const csvPath = path.resolve(__dirname, "../../../../DataNuevaPro/GreenDolio_Contenidos_Cajas_25nov.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("❌ No se encontró el archivo CSV en:", csvPath);
    process.exit(1);
  }

  const db = getDb();

  console.log("🚀 Iniciando importación de contenidos de cajas...\n");

  // Paso 1: Verificar que productos existan
  await verifyProducts(db, csvPath);

  console.log();

  // Paso 2: Importar contenidos de cajas
  await importBoxContents(db, csvPath);

  console.log("\n🎉 ¡Importación completada exitosamente!");
  console.log("\n📝 Las variantes de cajas están ahora en Firestore:");
  console.log("   - Collection: boxVariants");
  console.log("   - 9 documentos (3 cajas × 3 variantes)");
  console.log("\n💡 Próximo paso: Actualizar el builder de cajas para usar las variantes");

  process.exit(0);
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
