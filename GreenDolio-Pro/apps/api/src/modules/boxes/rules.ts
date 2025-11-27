import fs from "fs";
import path from "path";

export type CategoryBudget = {
  min: number;
  max: number;
};

export type BoxRule = {
  displayName: string;
  slotBudget: number;
  targetWeightKg: number;
  minMargin: number;
  categoryBudget: Record<string, CategoryBudget>;
  baseContents: Array<{ productSlug: string; quantity: number }>;
};

const rulesPath = path.join(process.cwd(), "src", "data", "boxRules.json");

let cachedRules: Record<string, BoxRule> | null = null;

export function getBoxRules(): Record<string, BoxRule> {
  if (cachedRules) {
    return cachedRules;
  }

  const file = fs.readFileSync(rulesPath, "utf-8");
  cachedRules = JSON.parse(file) as Record<string, BoxRule>;
  return cachedRules;
}

export function getRuleForBox(boxId: string): BoxRule | undefined {
  const rules = getBoxRules();
  return rules[boxId];
}
// @ts-nocheck
