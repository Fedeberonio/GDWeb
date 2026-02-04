import fs from "fs";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type SupplyMeta = {
  material?: string;
  dimensions?: string;
  capacity?: string;
};

type Supply = {
  id: string;
  name: string;
  category: string;
  provider?: string;
  unitPrice?: number;
  isReturnable: boolean;
  stock?: number;
  minStockAlert?: number;
  meta: SupplyMeta;
};

type RowValueMap = Record<string, string | undefined>;

const COLLECTION_NAME = "catalog_supplies";
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH ?? path.resolve("service-account.json");
const DEFAULT_INPUT_PATH = path.resolve("GREENDOLIO_CATALOGO_INSUMOS.md");
const BATCH_LIMIT = 450;

const CATEGORY_ALIASES: Record<string, string> = {
  cajas: "packaging",
  caja: "packaging",
  packaging: "packaging",
  empaques: "packaging",
  embalaje: "packaging",
  bolsas: "packaging",
  bolsa: "packaging",
  botellas: "glass",
  botella: "glass",
  frascos: "glass",
  frasco: "glass",
  vidrio: "glass",
  glass: "glass",
  jar: "glass",
  labels: "label",
  label: "label",
  etiqueta: "label",
  etiquetas: "label",
};

const HEADER_ALIASES: Record<string, string> = {
  id: "id",
  codigo: "id",
  code: "id",
  identificador: "id",
  nombre: "name",
  name: "name",
  categoria: "category",
  category: "category",
  material: "material",
  proveedor: "provider",
  provider: "provider",
  precio: "unitPrice",
  preciounit: "unitPrice",
  preciounitario: "unitPrice",
  precioUnitario: "unitPrice",
  unitPrice: "unitPrice",
  price: "unitPrice",
  retornable: "isReturnable",
  returnable: "isReturnable",
  reusable: "isReturnable",
  stock: "stock",
  inventario: "stock",
  minimo: "minStockAlert",
  minStock: "minStockAlert",
  minStockAlert: "minStockAlert",
  dimensiones: "dimensions",
  dimension: "dimensions",
  dimensions: "dimensions",
  tamano: "capacity",
  capacidad: "capacity",
  capacity: "capacity",
};

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[()]/g, "")
    .replace(/[^\w]+/g, "")
    .replace(/_/g, "");
}

function normalizeCategory(value?: string, fallback?: string) {
  const raw = (value || fallback || "").trim();
  if (!raw) return "packaging";
  const key = normalizeKey(raw);
  return CATEGORY_ALIASES[key] ?? raw;
}

function cleanString(value?: string) {
  if (!value) return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function parseNumber(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—") return 0;
  const normalized = trimmed
    .replace(/[\s$RDOP:]/gi, "")
    .replace(/,/g, ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : undefined;
}

function parseBoolean(value?: string, fallback = false) {
  if (!value) return fallback;
  const normalized = normalizeKey(value);
  if (["si", "yes", "true", "y", "retornable", "returnable", "reusable"].includes(normalized)) {
    return true;
  }
  if (["no", "false", "n"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function guessReturnable(name: string, category: string, material?: string) {
  const haystack = `${name} ${category} ${material ?? ""}`.toLowerCase();
  return /botella|frasco|vidrio|glass|jar/.test(haystack);
}

function mapHeaders(headers: string[]) {
  const mapped: string[] = [];
  headers.forEach((header) => {
    const key = normalizeKey(header);
    mapped.push(HEADER_ALIASES[key] ?? header);
  });
  return mapped;
}

function splitMarkdownRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return [];
  const parts = trimmed.split("|").map((part) => part.trim());
  if (parts[0] === "") parts.shift();
  if (parts[parts.length - 1] === "") parts.pop();
  return parts;
}

type ParseContext = {
  categoryHint?: string;
  defaultReturnable?: boolean;
};

function buildSupply(row: RowValueMap, context: ParseContext): Supply | null {
  const id = cleanString(row.id);
  const name = cleanString(row.name);
  if (!id || !name) return null;
  const category = normalizeCategory(row.category, context.categoryHint);
  const material = cleanString(row.material);
  const provider = cleanString(row.provider);
  const unitPrice = parseNumber(row.unitPrice);
  const stock = parseNumber(row.stock);
  const minStockAlert = parseNumber(row.minStockAlert);
  const meta = {
    material,
    dimensions: cleanString(row.dimensions),
    capacity: cleanString(row.capacity),
  };
  const fallbackReturnable =
    context.defaultReturnable !== undefined ? context.defaultReturnable : guessReturnable(name, category, material);
  const isReturnable = parseBoolean(row.isReturnable, fallbackReturnable);

  return {
    id,
    name,
    category,
    provider,
    unitPrice,
    isReturnable,
    stock: stock ?? 0,
    minStockAlert,
    meta,
  };
}

function parseJsonInput(raw: string): Supply[] | null {
  try {
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.supplies)
        ? parsed.supplies
        : null;
    if (!rows) return null;
    const supplies: Supply[] = [];
    rows.forEach((row: Record<string, unknown>) => {
      const supply = buildSupply(
        {
          id: typeof row.id === "string" ? row.id : undefined,
          name: typeof row.name === "string" ? row.name : undefined,
          category: typeof row.category === "string" ? row.category : undefined,
          material: typeof row.material === "string" ? row.material : undefined,
          provider: typeof row.provider === "string" ? row.provider : undefined,
          unitPrice: row.unitPrice !== undefined ? String(row.unitPrice) : undefined,
          isReturnable: row.isReturnable !== undefined ? String(row.isReturnable) : undefined,
          stock: row.stock !== undefined ? String(row.stock) : undefined,
          minStockAlert: row.minStockAlert !== undefined ? String(row.minStockAlert) : undefined,
          dimensions: typeof row?.meta === "object" && row.meta && "dimensions" in row.meta
            ? String((row.meta as Record<string, unknown>).dimensions)
            : undefined,
          capacity: typeof row?.meta === "object" && row.meta && "capacity" in row.meta
            ? String((row.meta as Record<string, unknown>).capacity)
            : undefined,
        },
        {},
      );
      if (supply) supplies.push(supply);
    });
    return supplies;
  } catch {
    return null;
  }
}

function parseMarkdownTables(raw: string): Supply[] {
  const lines = raw.split(/\r?\n/);
  const supplies: Supply[] = [];
  let context: ParseContext = {};
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (line.startsWith("#")) {
      const sectionMatch = line.match(/^#{2,6}\s*(\d+)(?:\.\d+)?\./);
      if (sectionMatch) {
        const sectionNumber = Number(sectionMatch[1]);
        if (sectionNumber === 1) {
          context = { categoryHint: "packaging", defaultReturnable: false };
        } else if (sectionNumber === 2) {
          context = { categoryHint: "glass", defaultReturnable: true };
        } else if (sectionNumber === 3) {
          context = { categoryHint: "caps_lids", defaultReturnable: false };
        } else if (sectionNumber === 6) {
          context = { categoryHint: "label", defaultReturnable: false };
        } else {
          context = { categoryHint: "packaging", defaultReturnable: false };
        }
      }
      index += 1;
      continue;
    }

    const nextLine = lines[index + 1]?.trim() ?? "";
    if (line.includes("|") && nextLine.includes("|") && nextLine.replace(/[^-]/g, "").length >= 3) {
      const headers = mapHeaders(splitMarkdownRow(line));
      index += 2;

      while (index < lines.length && lines[index].includes("|")) {
        const rowValues = splitMarkdownRow(lines[index]);
        if (rowValues.length === 0) {
          index += 1;
          continue;
        }
        const row: RowValueMap = {};
        headers.forEach((header, idx) => {
          row[header] = rowValues[idx];
        });
        const supply = buildSupply(row, context);
        if (supply) supplies.push(supply);
        index += 1;
      }
      continue;
    }

    index += 1;
  }

  return supplies;
}

function parseSupplies(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const jsonSupplies = parseJsonInput(trimmed);
  if (jsonSupplies) return jsonSupplies;

  return parseMarkdownTables(trimmed);
}

function getInputText(inputPath?: string) {
  if (inputPath) {
    return fs.readFileSync(path.resolve(inputPath), "utf8");
  }
  if (process.stdin.isTTY) {
    return fs.readFileSync(DEFAULT_INPUT_PATH, "utf8");
  }
  const stdin = fs.readFileSync(0, "utf8");
  if (!stdin.trim()) {
    return fs.readFileSync(DEFAULT_INPUT_PATH, "utf8");
  }
  return stdin;
}

async function main() {
  const inputPath = process.argv.find((arg) => !arg.startsWith("--") && arg !== process.argv[0] && arg !== process.argv[1]);
  const dryRun = process.argv.includes("--dry-run");
  const raw = getInputText(inputPath);

  if (!raw) {
    console.error("No input provided. Pass a file path or pipe input.");
    process.exit(1);
  }

  const supplies = parseSupplies(raw);
  if (supplies.length === 0) {
    console.error("No supplies parsed from input.");
    process.exit(1);
  }

  const seen = new Set<string>();
  const deduped: Supply[] = [];
  supplies.forEach((supply) => {
    if (seen.has(supply.id)) {
      console.warn(`Duplicate id found, keeping last: ${supply.id}`);
    } else {
      seen.add(supply.id);
    }
    deduped.push(supply);
  });

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Service account not found at ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Dry run: parsed ${deduped.length} supplies.`);
    return;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  let batch = db.batch();
  let batchCount = 0;
  let total = 0;

  for (const supply of deduped) {
    const ref = db.collection(COLLECTION_NAME).doc(supply.id);
    const payload = JSON.parse(JSON.stringify(supply)) as Supply;
    batch.set(ref, payload, { merge: true });
    batchCount += 1;
    total += 1;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Imported ${total} supplies into ${COLLECTION_NAME}.`);
}

main().catch((error) => {
  console.error("Failed to import supplies:", error);
  process.exit(1);
});
