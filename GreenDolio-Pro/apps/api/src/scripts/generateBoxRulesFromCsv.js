/*
 * Genera boxRules.generated.json a partir de GreenDolio_Contenidos_Cajas_25nov.csv
 * No sobrescribe boxRules.json existente.
 */
const fs = require("fs");
const path = require("path");
const { utils, readFile } = require("xlsx");
const slugify = require("slugify");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../");
const CONTENTS_DEFAULT = path.join(PROJECT_ROOT, "data/GreenDolio_Contenidos_Cajas_25nov.csv");
const BOX_RULES_PATH = path.join(PROJECT_ROOT, "apps/api/src/data/boxRules.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "apps/api/src/data/boxRules.generated.json");
const METADATA_PATH = path.join(PROJECT_ROOT, "apps/api/src/data/productMetadata.json");

const VARIANT_MAP = {
  mix: "mix",
  Mix: "mix",
  MIX: "mix",
  frutal: "fruity",
  FRUTAL: "fruity",
  fruity: "fruity",
  veggee: "veggie",
  veggie: "veggie",
  VEGETAL: "veggie",
  VEGGIE: "veggie",
};

function normalizeSlug(value) {
  return slugify(value, { lower: true, strict: true });
}

function normalizeName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function readContents(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Contents file not found: ${filePath}`);
  }
  const workbook = readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return utils.sheet_to_json(sheet, { defval: "" });
}

function fixEncoding(text) {
  try {
    return Buffer.from(text, "latin1").toString("utf8");
  } catch {
    return text;
  }
}

function run() {
  const fileArg = process.argv[2];
  const contentsPath = fileArg ? path.resolve(process.cwd(), fileArg) : CONTENTS_DEFAULT;
  const contents = readContents(contentsPath);
  const productMetadata = fs.existsSync(METADATA_PATH)
    ? JSON.parse(fs.readFileSync(METADATA_PATH, "utf8"))
    : [];
  const nameToSlug = new Map();
  productMetadata.forEach((p) => {
    if (p.name) {
      nameToSlug.set(normalizeName(p.name), p.slug);
      const fixed = fixEncoding(p.name);
      if (fixed !== p.name) {
        nameToSlug.set(normalizeName(fixed), p.slug);
      }
    }
  });

  const existingRules = fs.existsSync(BOX_RULES_PATH)
    ? JSON.parse(fs.readFileSync(BOX_RULES_PATH, "utf8"))
    : {};

  const nextRules = {};
  const stats = {};

  contents.forEach((row) => {
    const boxId = (row.Caja_ID || row.caja_id || "").toString().trim();
    const variantRaw = (row.Variante || row.variante || "").toString().trim();
    const productNameRaw = (row.Producto || row.producto || "").toString().trim();
    const productName = fixEncoding(productNameRaw);
    const quantity = Number(row.Cantidad || row.cantidad || 1) || 1;

    if (!boxId || !variantRaw || !productName) return;
    const variant = VARIANT_MAP[variantRaw] || "mix";
    const productSlug =
      nameToSlug.get(normalizeName(productName)) ||
      normalizeSlug(productName);

    if (!nextRules[boxId]) {
      const existing = existingRules[boxId] || {};
      nextRules[boxId] = {
        displayName: existing.displayName || boxId,
        slotBudget: existing.slotBudget,
        targetWeightKg: existing.targetWeightKg,
        minMargin: existing.minMargin,
        categoryBudget: existing.categoryBudget,
        baseContents: [],
        variantContents: {},
      };
    }
    if (!nextRules[boxId].variantContents) {
      nextRules[boxId].variantContents = {};
    }
    if (!nextRules[boxId].variantContents[variant]) {
      nextRules[boxId].variantContents[variant] = [];
    }

    nextRules[boxId].variantContents[variant].push({ productSlug, quantity });

    if (!stats[boxId]) stats[boxId] = {};
    stats[boxId][variant] = (stats[boxId][variant] || 0) + 1;
  });

  Object.entries(nextRules).forEach(([_, rule]) => {
    if (rule.variantContents?.mix) {
      rule.baseContents = rule.variantContents.mix;
    } else if (!rule.baseContents || rule.baseContents.length === 0) {
      rule.baseContents = [];
    }
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(nextRules, null, 2));
  console.log(`✅ Generated box rules at ${OUTPUT_PATH}`);
  console.log("Resumen:");
  Object.entries(stats).forEach(([boxId, variants]) => {
    console.log(`  ${boxId}: ${Object.entries(variants)
      .map(([v, count]) => `${v}=${count}`)
      .join(", ")}`);
  });
}

run();
