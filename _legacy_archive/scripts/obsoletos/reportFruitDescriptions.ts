import dotenv from "dotenv";
import path from "path";
import XLSX from "xlsx";

import { getDb } from "../lib/firestore";

dotenv.config();

type CSVRow = {
  SKU: string;
  Nombre_Producto: string;
  Categoria: string;
  Descripcion_Corta: string;
  Precio_DOP: string | number;
};

const TARGET_NAMES = ["Aguacate", "Banana", "Fresas"];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(value: string | number): number | null {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

async function run() {
  const csvPath = path.resolve(__dirname, "../../../../legacy/master_products_clean.csv");
  const workbook = XLSX.readFile(csvPath, { raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<CSVRow>(sheet, { defval: "" });

  const normalizedTargets = new Map(
    TARGET_NAMES.map((name) => [normalize(name), name]),
  );

  const matches = rows
    .map((row) => ({
      row,
      normalized: normalize(row.Nombre_Producto || ""),
    }))
    .filter(({ normalized }) => normalizedTargets.has(normalized));

  const db = getDb();

  console.log("Validation report (CSV vs Firestore):");
  for (const match of matches) {
    const row = match.row;
    const sku = row.SKU?.trim();
    if (!sku) {
      console.log(`- ${row.Nombre_Producto}: SKU missing in CSV`);
      continue;
    }

    const doc = await db.collection("catalog_products").doc(sku).get();
    if (!doc.exists) {
      console.log(`- ${row.Nombre_Producto}: Firestore doc not found for SKU ${sku}`);
      continue;
    }

    const data = doc.data() as Record<string, any>;
    const csvDescription = row.Descripcion_Corta || "";
    const csvPrice = parsePrice(row.Precio_DOP);
    const fsDescription = data.description ?? "";
    const fsPrice = data.price ?? null;
    const fsName = data.name ?? "";

    console.log(`\nSKU: ${sku}`);
    console.log(`CSV name: ${row.Nombre_Producto}`);
    console.log(`CSV description: ${csvDescription}`);
    console.log(`CSV price: ${csvPrice ?? "N/A"}`);
    console.log(`FS name: ${typeof fsName === "object" ? JSON.stringify(fsName) : fsName}`);
    console.log(`FS description: ${typeof fsDescription === "object" ? JSON.stringify(fsDescription) : fsDescription}`);
    console.log(`FS price: ${fsPrice ?? "N/A"}`);
  }

  if (matches.length === 0) {
    console.log("No CSV matches found for target names.");
  }
}

run().catch((error) => {
  console.error("Failed to generate validation report:", error);
  process.exit(1);
});
