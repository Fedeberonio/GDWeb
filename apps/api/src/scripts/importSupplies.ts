import fs from "fs/promises";
import path from "path";

import { initializeFirebaseAdmin } from "../firebaseAdmin";
import { getDb } from "../lib/firestore";

const SUPPLIES_MD_PATH = path.resolve(__dirname, "../../../GREENDOLIO_CATALOGO_INSUMOS.md");

type SupplyCategory = "Packaging" | "Glass" | "Labels" | "Other";

type Supply = {
  id: string;
  name: string;
  category: SupplyCategory;
  supplier?: string;
  unitPrice?: number;
  currency?: string;
  stock: number;
  minStock: number;
  isReturnable: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
};

// Parsear el archivo markdown y extraer insumos
function parseSuppliesFromMarkdown(content: string): Supply[] {
  const supplies: Supply[] = [];
  const lines = content.split("\n");

  let currentCategory: SupplyCategory = "Other";
  let inTable = false;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar categorías
    if (line.startsWith("## 1. CAJAS") || line.includes("CAJAS Y EMPAQUES")) {
      currentCategory = "Packaging";
      continue;
    }
    if (line.startsWith("## 2. BOTELLAS") || line.includes("BOTELLAS Y FRASCOS")) {
      currentCategory = "Glass";
      continue;
    }
    if (line.startsWith("## 6. ETIQUETAS") || line.includes("ETIQUETAS")) {
      currentCategory = "Labels";
      continue;
    }

    // Detectar inicio de tabla
    if (line.startsWith("| ID |")) {
      inTable = true;
      headers = line
        .split("|")
        .map((h) => h.trim())
        .filter(Boolean);
      continue;
    }

    // Procesar filas de tabla
    if (inTable && line.startsWith("|") && !line.startsWith("|---")) {
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);

      if (cells.length < 2) continue;

      const id = cells[0];
      if (!id || id === "ID") continue; // Skip header

      const name = cells[1] || "";
      const supplier = cells.find((c, idx) => headers[idx]?.toLowerCase().includes("proveedor")) || "";
      const priceStr =
        cells.find((c, idx) => headers[idx]?.toLowerCase().includes("precio")) || "";
      const retornableStr =
        cells.find((c, idx) => headers[idx]?.toLowerCase().includes("retornable")) || "";

      // Extraer precio
      let unitPrice: number | undefined;
      const priceMatch = priceStr.match(/DOP\s*(\d+(?:\.\d+)?)/i) || priceStr.match(/(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        unitPrice = parseFloat(priceMatch[1]);
      }

      // Determinar si es retornable
      const isReturnable =
        retornableStr.toLowerCase().includes("sí") ||
        retornableStr.toLowerCase().includes("si") ||
        retornableStr.toLowerCase().includes("yes") ||
        id.toLowerCase().includes("botella") ||
        id.toLowerCase().includes("frasco");

      // Stock inicial: 0 (se actualizará manualmente)
      const minStock = isReturnable ? 10 : 20; // Mínimo más bajo para retornables

      supplies.push({
        id: id.trim(),
        name: name.trim(),
        category: currentCategory,
        supplier: supplier.trim() || undefined,
        unitPrice,
        currency: unitPrice ? "DOP" : undefined,
        stock: 0,
        minStock,
        isReturnable,
        notes: cells[cells.length - 1] || undefined,
      });
    }

    // Detectar fin de tabla (línea vacía o nueva sección)
    if (inTable && (line === "" || line.startsWith("##") || line.startsWith("---"))) {
      inTable = false;
      headers = [];
    }
  }

  return supplies;
}

async function importSupplies() {
  console.log("📦 Importando insumos desde GREENDOLIO_CATALOGO_INSUMOS.md");

  initializeFirebaseAdmin();
  const db = getDb();

  try {
    // Leer archivo markdown
    const content = await fs.readFile(SUPPLIES_MD_PATH, "utf-8");

    // Parsear insumos
    const supplies = parseSuppliesFromMarkdown(content);

    console.log(`\n✅ Parseados ${supplies.length} insumos`);

    // Agrupar por categoría para logging
    const byCategory = supplies.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {} as Record<SupplyCategory, number>);

    console.log("\n📊 Distribución por categoría:");
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

    // Escribir a Firestore
    const batch = db.batch();
    const batchSize = 450;
    let batchCount = 0;

    for (const supply of supplies) {
      const ref = db.collection("catalog_supplies").doc(supply.id);
      batch.set(ref, {
        ...supply,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      batchCount++;

      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`   ✅ Batch de ${batchCount} insumos guardado`);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Batch final de ${batchCount} insumos guardado`);
    }

    console.log(`\n✅ Importación completada: ${supplies.length} insumos en catalog_supplies`);
  } catch (error) {
    console.error("❌ Error importando insumos:", error);
    throw error;
  }
}

if (require.main === module) {
  importSupplies()
    .then(() => {
      console.log("\n✅ Script completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error fatal:", error);
      process.exit(1);
    });
}

export { importSupplies };
