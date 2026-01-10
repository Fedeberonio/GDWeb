// @ts-nocheck
import fs from "fs";
import path from "path";
import slugify from "slugify";
import xlsx from "xlsx";

const PROJECT_ROOT = path.resolve(__dirname, "../../../../");
const DEFAULT_INPUT = path.join(PROJECT_ROOT, "data/GreenDolio_Productos_25nov.csv");
const DEFAULT_FILE_TYPE = "csv";
const OUTPUT_PATH = path.join(PROJECT_ROOT, "apps/api/src/data/productMetadata.json");

const headerMap: Record<string, keyof ProductRow> = {
  slug: "slug",
  codigo: "slug",
  id: "slug",
  sku: "slug",
  producto: "name",
  nombre: "name",
  nombre_producto: "name",
  categoria: "category",
  tipo: "category",
  peso: "weightKg",
  pesokg: "weightKg",
  "peso(kg)": "weightKg",
  peso_en_libras: "weightKg",
  peso_en_lb: "weightKg",
  pesoaproximado: "weightKg",
  peso_aproximado: "weightKg",
  costo: "wholesaleCost",
  costo_unitario: "wholesaleCost",
  precio_compra: "wholesaleCost",
  slots: "slotValue",
};

type ProductRow = {
  slug?: string;
  name?: string;
  category?: string;
  weightKg?: number;
  wholesaleCost?: number;
  slotValue?: number;
  tags?: string[];
};

type ProductMetadata = Required<ProductRow>;

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/\s|\(|\)|\/|-/g, "");
}

function normalizeSlug(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return slugify(value, { lower: true, strict: true });
}

function parseWeight(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    // intentamos capturar "7.7 lb" o "3.5 kg"
    const lbMatch = lower.match(/([\d.,]+)/)?.[1];
    const hasLb = lower.includes("lb");
    const hasKg = lower.includes("kg");
    if (lbMatch) {
      const numeric = Number(lbMatch.replace(",", "."));
      if (!Number.isFinite(numeric)) return undefined;
      if (hasKg) return numeric; // ya viene en kg
      if (hasLb) return Number((numeric * 0.453592).toFixed(3));
      return numeric; // sin unidad, lo tomamos directo
    }
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readRows(inputFile: string, _fileType: "csv" | "xlsx") {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  // xlsx.readFile puede leer tanto XLSX como CSV directamente
  const workbook = xlsx.readFile(inputFile);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

function mapRow(rawRow: Record<string, unknown>): ProductMetadata {
  const normalizedEntries = Object.entries(rawRow).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[normalizeHeader(key)] = value;
    return acc;
  }, {});

  const row: ProductRow = {};
  for (const [header, value] of Object.entries(normalizedEntries)) {
    const mappedKey = headerMap[header];
    if (!mappedKey) continue;
    if (mappedKey === "slug") {
      row.slug = typeof value === "string" ? normalizeSlug(value) : undefined;
    } else if (mappedKey === "name" || mappedKey === "category") {
      row[mappedKey] = typeof value === "string" ? value.trim() : undefined;
    } else if (mappedKey === "weightKg") {
      row.weightKg = parseWeight(value) ?? parseNumber(value);
    } else if (mappedKey === "wholesaleCost" || mappedKey === "slotValue") {
      row[mappedKey] = parseNumber(value);
    }
  }

  if (!row.slug && row.name) {
    row.slug = normalizeSlug(row.name);
  }

  if (!row.slug || !row.name) {
    throw new Error(`Missing slug or name in row: ${JSON.stringify(rawRow)}`);
  }

  const isBaby =
    row.slug.includes("baby") || (row.name && row.name.toLowerCase().includes("baby"));
  const tags = isBaby ? ["baby-only"] : [];
  const weightKg = row.weightKg ?? (isBaby ? 0.25 : 0.5);
  const slotValue = row.slotValue ?? 1; // Simplificar slots para evitar sobre-restricciones en swaps

  return {
    slug: row.slug,
    name: row.name,
    category: row.category ?? "otros",
    weightKg,
    wholesaleCost: row.wholesaleCost ?? 0,
    slotValue,
    // Nota: añadimos tags para uso interno (ej. filtrar baby en front)
    tags,
  };
}

function run() {
  const input = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
  const fileTypeArg = process.argv[3] ? process.argv[3].toLowerCase() : DEFAULT_FILE_TYPE;
  if (fileTypeArg !== "csv" && fileTypeArg !== "xlsx") {
    throw new Error("File type must be 'csv' or 'xlsx'");
  }
  console.log(`📥 Reading products from ${input} (${fileTypeArg.toUpperCase()})`);
  const rows = readRows(input, fileTypeArg as "csv" | "xlsx");
  const metadata = rows.map(mapRow);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(metadata, null, 2));
  console.log(`✅ Exported ${metadata.length} products to ${OUTPUT_PATH}`);
}

run();
// @ts-nocheck
