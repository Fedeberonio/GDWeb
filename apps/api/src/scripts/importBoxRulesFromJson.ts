import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";
import { boxRuleSchema, type BoxRule } from "../modules/catalog/schemas";

dotenv.config();

type RawBoxRule = Omit<BoxRule, "id">;

const RULES_PATH = path.resolve(__dirname, "../data/boxRules.json");

function loadRules() {
  if (!fs.existsSync(RULES_PATH)) {
    throw new Error(`Rules file not found at ${RULES_PATH}`);
  }
  const raw = JSON.parse(fs.readFileSync(RULES_PATH, "utf-8")) as Record<string, RawBoxRule>;
  return Object.entries(raw).map(([id, rule]) => boxRuleSchema.parse({ id, ...rule }));
}

async function importBoxRules() {
  const db = getDb();
  const rules = loadRules();
  const batch = db.batch();

  rules.forEach((rule) => {
    const ref = db.collection(catalogCollections.boxRules).doc(rule.id);
    batch.set(ref, rule, { merge: true });
  });

  await batch.commit();
  console.log(`Imported ${rules.length} box rules into ${catalogCollections.boxRules}.`);
}

importBoxRules().catch((error) => {
  console.error("Failed to import box rules:", error);
  process.exit(1);
});
