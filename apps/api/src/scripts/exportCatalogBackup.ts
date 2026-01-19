import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";
import type { Box, BoxRule, Combo, Product, ProductCategory } from "../modules/catalog/schemas";

dotenv.config();

type MissingFieldReport = {
  id: string;
  slug?: string;
  name?: string;
  missingFields: string[];
};

type CatalogBackup = {
  metadata: {
    exportedAt: string;
    environment: string;
  };
  categories: ProductCategory[];
  products: Product[];
  boxes: Box[];
  boxRules: BoxRule[];
  combos: Combo[];
};

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isMissingString(value?: string | null): boolean {
  return !value || value.trim().length === 0;
}

function missingLocaleFields(prefix: string, value?: { es?: string; en?: string }) {
  const missing: string[] = [];
  if (isMissingString(value?.es)) missing.push(`${prefix}.es`);
  if (isMissingString(value?.en)) missing.push(`${prefix}.en`);
  return missing;
}

function validateProducts(products: Product[]): MissingFieldReport[] {
  return products
    .map((product) => {
      const missing: string[] = [];
      missing.push(...missingLocaleFields("name", product.name));
      missing.push(...missingLocaleFields("description", product.description));
      missing.push(...missingLocaleFields("unit", product.unit));
      if (!product.price?.amount && product.price?.amount !== 0) missing.push("price.amount");
      if (isMissingString(product.categoryId)) missing.push("categoryId");
      if (isMissingString(product.slug)) missing.push("slug");
      if (isMissingString(product.image)) missing.push("image");
      if (!product.tags || product.tags.length === 0) missing.push("tags");
      if (!product.nutrition?.calories && product.nutrition?.calories !== 0) missing.push("nutrition.calories");
      if (!product.logistics?.weightKg && product.logistics?.weightKg !== 0) missing.push("logistics.weightKg");
      return missing.length
        ? {
            id: product.id,
            slug: product.slug,
            name: product.name?.es ?? product.name?.en ?? "",
            missingFields: missing,
          }
        : null;
    })
    .filter((item): item is MissingFieldReport & { slug: string; name: string } => Boolean(item));
}

function validateBoxes(boxes: Box[]): MissingFieldReport[] {
  return boxes
    .map((box) => {
      const missing: string[] = [];
      missing.push(...missingLocaleFields("name", box.name));
      missing.push(...missingLocaleFields("description", box.description));
      if (!box.price?.amount && box.price?.amount !== 0) missing.push("price.amount");
      if (isMissingString(box.ruleId)) missing.push("ruleId");
      if (isMissingString(box.dimensionsLabel)) missing.push("dimensionsLabel");
      if (isMissingString(box.weightLabel)) missing.push("weightLabel");
      if (isMissingString(box.heroImage)) missing.push("heroImage");
      if (!box.variants || box.variants.length === 0) missing.push("variants");
      box.variants?.forEach((variant, index) => {
        missing.push(...missingLocaleFields(`variants[${index}].name`, variant.name));
        if (variant.description) {
          const variantMissing = missingLocaleFields(`variants[${index}].description`, variant.description);
          missing.push(...variantMissing);
        } else {
          missing.push(`variants[${index}].description`);
        }
      });
      return missing.length
        ? {
            id: box.id,
            slug: box.slug,
            name: box.name?.es ?? box.name?.en ?? "",
            missingFields: missing,
          }
        : null;
    })
    .filter((item): item is MissingFieldReport & { slug: string; name: string } => Boolean(item));
}

function validateBoxRules(rules: BoxRule[]): MissingFieldReport[] {
  return rules
    .map((rule) => {
      const missing: string[] = [];
      if (isMissingString(rule.displayName)) missing.push("displayName");
      if (!rule.slotBudget && rule.slotBudget !== 0) missing.push("slotBudget");
      if (!rule.targetWeightKg && rule.targetWeightKg !== 0) missing.push("targetWeightKg");
      if (!rule.baseContents || rule.baseContents.length === 0) missing.push("baseContents");
      if (!rule.categoryBudget || Object.keys(rule.categoryBudget).length === 0) missing.push("categoryBudget");
      return missing.length
        ? {
            id: rule.id,
            name: rule.displayName ?? "",
            missingFields: missing,
          }
        : null;
    })
    .filter((item): item is MissingFieldReport & { name: string } => Boolean(item));
}

function validateCombos(combos: Combo[]): MissingFieldReport[] {
  return combos
    .map((combo) => {
      const missing: string[] = [];
      missing.push(...missingLocaleFields("name", combo.name));
      missing.push(...missingLocaleFields("salad", combo.salad));
      missing.push(...missingLocaleFields("juice", combo.juice));
      missing.push(...missingLocaleFields("dessert", combo.dessert));
      missing.push(...missingLocaleFields("benefit", combo.benefit));
      missing.push(...missingLocaleFields("benefitDetail", combo.benefitDetail));
      missing.push(...missingLocaleFields("recommendedFor", combo.recommendedFor));
      if (!combo.price && combo.price !== 0) missing.push("price");
      if (!combo.calories && combo.calories !== 0) missing.push("calories");
      if (!combo.protein && combo.protein !== 0) missing.push("protein");
      if (!combo.carbs && combo.carbs !== 0) missing.push("carbs");
      if (!combo.fats && combo.fats !== 0) missing.push("fats");
      if (!combo.fiber && combo.fiber !== 0) missing.push("fiber");
      if (!combo.sugars && combo.sugars !== 0) missing.push("sugars");
      if (isMissingString(combo.image)) missing.push("image");
      if (!combo.ingredients || combo.ingredients.length === 0) missing.push("ingredients");
      return missing.length
        ? {
            id: combo.id,
            name: combo.name?.es ?? combo.name?.en ?? "",
            missingFields: missing,
          }
        : null;
    })
    .filter((item): item is MissingFieldReport & { name: string } => Boolean(item));
}

async function run() {
  const db = getDb();
  const [categoriesSnap, productsSnap, boxesSnap, rulesSnap, combosSnap] = await Promise.all([
    db.collection(catalogCollections.categories).get(),
    db.collection(catalogCollections.products).get(),
    db.collection(catalogCollections.boxes).get(),
    db.collection(catalogCollections.boxRules).get(),
    db.collection(catalogCollections.combos).get(),
  ]);

  const categories = categoriesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ProductCategory[];
  const products = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];
  const boxes = boxesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Box[];
  const boxRules = rulesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as BoxRule[];
  const combos = combosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Combo[];

  const backup: CatalogBackup = {
    metadata: {
      exportedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "unknown",
    },
    categories,
    products,
    boxes,
    boxRules,
    combos,
  };

  const report = {
    exportedAt: backup.metadata.exportedAt,
    categories: categories.length,
    products: {
      total: products.length,
      missing: validateProducts(products),
    },
    boxes: {
      total: boxes.length,
      missing: validateBoxes(boxes),
    },
    boxRules: {
      total: boxRules.length,
      missing: validateBoxRules(boxRules),
    },
    combos: {
      total: combos.length,
      missing: validateCombos(combos),
    },
  };

  const timestamp = backup.metadata.exportedAt.replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "..", "..", "data", "backups");
  ensureDir(backupDir);

  const backupPath = path.join(backupDir, `catalog-backup-${timestamp}.json`);
  const reportPath = path.join(backupDir, `catalog-report-${timestamp}.json`);

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const missingCounts = {
    products: report.products.missing.length,
    boxes: report.boxes.missing.length,
    boxRules: report.boxRules.missing.length,
    combos: report.combos.missing.length,
  };

  console.log("Backup generado:", backupPath);
  console.log("Reporte generado:", reportPath);
  console.log("Resumen de faltantes:", missingCounts);
}

run().catch((error) => {
  console.error("Error generando backup/reporte:", error);
  process.exit(1);
});
