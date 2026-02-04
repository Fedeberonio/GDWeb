import { z } from "zod";

import { boxes as staticBoxes, productCategories as staticCategories } from "./mock-data";
import {
  getBoxById,
  getBoxRuleById,
  getProductById,
  getComboById,
  listAllBoxes,
  listAllProducts,
  listAllCombos,
  listBoxRules,
  listBoxes,
  listCategories,
  listProducts,
  listCombos,
  saveBox,
  saveBoxRule,
  saveProduct,
  saveCombo,
} from "./repository";
import {
  boxSchema,
  boxVariantSchema,
  boxRuleSchema,
  comboSchema,
  localizedStringSchema,
  optionalLocalizedStringSchema,
  priceSchema,
  productCategorySchema,
  productSchema,
} from "./schemas";
import { listCatalogHistory, recordCatalogChange, type CatalogChangeContext, type CatalogChange } from "./history";
import slugify from "slugify";

const useFirestore = process.env.NODE_ENV !== "test";

export async function getCategories() {
  if (!useFirestore) {
    return staticCategories.map((category) => productCategorySchema.parse(category));
  }

  const categories = await listCategories();
  return categories.map((category) => productCategorySchema.parse(category));
}

export async function getProducts() {
  if (!useFirestore) {
    return [];
  }

  const products = await listProducts();
  return products.map((product) => productSchema.parse(product));
}

export async function getBoxes() {
  if (!useFirestore) {
    return staticBoxes.map((box) => boxSchema.parse(box));
  }

  const boxes = await listBoxes();
  return boxes.map((box) => boxSchema.parse(box));
}

const nutritionUpdateSchema = z
  .object({
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    organic: z.boolean().optional(),
    calories: z.number().nonnegative().optional(),
    protein: z.number().nonnegative().optional(),
    carbs: z.number().nonnegative().optional(),
    fats: z.number().nonnegative().optional(),
    fiber: z.number().nonnegative().optional(),
    sugars: z.number().nonnegative().optional(),
  })
  .partial();

const logisticsUpdateSchema = z
  .object({
    weightKg: z.number().nonnegative().optional(),
    dimensionsCm: z
      .object({
        length: z.number().nonnegative(),
        width: z.number().nonnegative(),
        height: z.number().nonnegative(),
        })
      .optional(),
    storage: optionalLocalizedStringSchema,
  })
  .partial();

const productUpdateSchema = z
  .object({
    sku: z.string().optional().nullable(),
    name: optionalLocalizedStringSchema,
    description: optionalLocalizedStringSchema,
    unit: optionalLocalizedStringSchema,
    price: priceSchema.partial().optional(),
    salePrice: priceSchema.partial().optional().nullable(),
    status: productSchema.shape.status.optional(),
    image: z.union([z.string().min(1), z.literal(""), z.undefined()]).transform((val) => (val === "" ? undefined : val)),
    tags: z.array(z.string()).optional(),
    isFeatured: z.boolean().optional(),
    nutrition: nutritionUpdateSchema.optional(),
    logistics: logisticsUpdateSchema.optional(),
    categoryId: z.string().min(1).optional(),
    metadata: productSchema.shape.metadata.optional(),
  })
  .partial();

const boxUpdateSchema = z
  .object({
    name: optionalLocalizedStringSchema,
    description: optionalLocalizedStringSchema,
    price: priceSchema.partial().optional(),
    ruleId: z.string().min(1).optional(),
    dimensionsLabel: z.string().min(1).optional(),
    weightLabel: z.string().min(1).optional(),
    heroImage: z.string().min(1).optional(),
    isFeatured: z.boolean().optional(),
    durationDays: z.number().int().positive().optional(),
    variants: z.array(boxVariantSchema).optional(),
  })
  .partial();

const comboUpdateSchema = z
  .object({
    name: optionalLocalizedStringSchema,
    salad: optionalLocalizedStringSchema,
    juice: optionalLocalizedStringSchema,
    dessert: optionalLocalizedStringSchema,
    price: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    margin: z.number().nonnegative().optional(),
    calories: z.number().nonnegative().optional(),
    protein: z.number().nonnegative().optional(),
    glutenFree: z.boolean().optional(),
    benefit: optionalLocalizedStringSchema,
    benefitDetail: optionalLocalizedStringSchema,
    recommendedFor: optionalLocalizedStringSchema,
    carbs: z.number().nonnegative().optional(),
    fats: z.number().nonnegative().optional(),
    fiber: z.number().nonnegative().optional(),
    sugars: z.number().nonnegative().optional(),
    vitaminA: z.string().optional(),
    vitaminC: z.string().optional(),
    image: z.union([z.string().min(1), z.literal(""), z.undefined()]).transform((val) => (val === "" ? undefined : val)),
    ingredients: z.array(localizedStringSchema).optional(),
    status: comboSchema.shape.status.optional(),
    isFeatured: z.boolean().optional(),
  })
  .partial();

function mergeLocalized(base: Record<string, string> | undefined, update?: Partial<Record<string, string>>) {
  if (!update) return base;
  return { ...(base ?? {}), ...update } as Record<string, string>;
}

function mergeMetadata(
  base: NonNullable<z.infer<typeof productSchema>["metadata"]> | undefined,
  update?: z.infer<typeof productUpdateSchema>["metadata"],
) {
  if (!update) return base;
  return {
    ...(base ?? {}),
    ...update,
  };
}

function mergeProduct(existing: z.infer<typeof productSchema>, updates: z.infer<typeof productUpdateSchema>) {
  const merged = {
    ...existing,
    sku: updates.sku !== undefined ? (updates.sku === null ? undefined : updates.sku) : existing.sku,
    name: updates.name ? mergeLocalized(existing.name, updates.name) : existing.name,
    description: updates.description ? mergeLocalized(existing.description, updates.description) : existing.description,
    unit: updates.unit ? mergeLocalized(existing.unit, updates.unit) : existing.unit,
    price: updates.price ? { ...existing.price, ...updates.price } : existing.price,
    salePrice: updates.salePrice !== undefined 
      ? (updates.salePrice === null ? undefined : { ...(existing.salePrice ?? existing.price), ...updates.salePrice })
      : existing.salePrice,
    tags: updates.tags !== undefined ? updates.tags : existing.tags,
    image: updates.image !== undefined ? updates.image : existing.image,
    status: updates.status !== undefined ? updates.status : existing.status,
    isFeatured: updates.isFeatured !== undefined ? updates.isFeatured : existing.isFeatured,
    categoryId: updates.categoryId !== undefined ? updates.categoryId : existing.categoryId,
    nutrition: updates.nutrition
      ? {
          ...(existing.nutrition ?? {}),
          ...updates.nutrition,
        }
      : existing.nutrition,
    logistics: updates.logistics
      ? {
          ...(existing.logistics ?? {}),
          ...updates.logistics,
          storage: updates.logistics.storage
            ? mergeLocalized(existing.logistics?.storage, updates.logistics.storage)
            : existing.logistics?.storage,
          dimensionsCm: updates.logistics.dimensionsCm ?? existing.logistics?.dimensionsCm,
        }
      : existing.logistics,
    metadata: mergeMetadata(existing.metadata, updates.metadata),
  } satisfies Record<string, unknown>;

  return productSchema.parse(merged);
}

function mergeBox(existing: z.infer<typeof boxSchema>, updates: z.infer<typeof boxUpdateSchema>) {
  const merged = {
    ...existing,
    ...updates,
    name: updates.name ? mergeLocalized(existing.name, updates.name) : existing.name,
    description: updates.description
      ? mergeLocalized(existing.description, updates.description)
      : existing.description,
    price: updates.price ? { ...existing.price, ...updates.price } : existing.price,
    heroImage: updates.heroImage ?? existing.heroImage,
    variants: updates.variants ?? existing.variants,
  } satisfies Record<string, unknown>;

  return boxSchema.parse(merged);
}

function mergeCombo(existing: z.infer<typeof comboSchema>, updates: z.infer<typeof comboUpdateSchema>) {
  const merged = {
    ...existing,
    ...updates,
    name: updates.name ? mergeLocalized(existing.name, updates.name) : existing.name,
    salad: updates.salad ? mergeLocalized(existing.salad, updates.salad) : existing.salad,
    juice: updates.juice ? mergeLocalized(existing.juice, updates.juice) : existing.juice,
    dessert: updates.dessert ? mergeLocalized(existing.dessert, updates.dessert) : existing.dessert,
    benefit: updates.benefit ? mergeLocalized(existing.benefit, updates.benefit) : existing.benefit,
    benefitDetail: updates.benefitDetail
      ? mergeLocalized(existing.benefitDetail, updates.benefitDetail)
      : existing.benefitDetail,
    recommendedFor: updates.recommendedFor
      ? mergeLocalized(existing.recommendedFor, updates.recommendedFor)
      : existing.recommendedFor,
    ingredients: updates.ingredients ?? existing.ingredients,
    image: updates.image ?? existing.image,
    status: updates.status ?? existing.status,
    isFeatured: updates.isFeatured ?? existing.isFeatured,
  } satisfies Record<string, unknown>;

  return comboSchema.parse(merged);
}

export async function listProductsForAdmin() {
  const products = await listAllProducts();
  return products.map((product) => productSchema.parse(product));
}

export async function listBoxesForAdmin() {
  const boxes = await listAllBoxes();
  return boxes.map((box) => boxSchema.parse(box));
}

export async function listBoxRulesForAdmin() {
  const rules = await listBoxRules();
  return rules.map((rule) => boxRuleSchema.parse(rule));
}

export async function listCombosForAdmin() {
  const combos = await listAllCombos();
  return combos.map((combo) => comboSchema.parse(combo));
}

export async function getCombos() {
  const combos = await listCombos();
  return combos.map((combo) => comboSchema.parse(combo));
}

export async function listBoxRulesPublic() {
  const rules = await listBoxRules();
  return rules.map((rule) => boxRuleSchema.parse(rule));
}

export type ProductMetaSnapshot = {
  slug: string;
  name: string;
  categoryId: string;
  weightKg?: number;
  slotValue?: number;
  wholesaleCost?: number;
  tags: string[];
};

export async function getProductMetaMap(): Promise<Record<string, ProductMetaSnapshot>> {
  const products = await listAllProducts();
  return products.reduce<Record<string, ProductMetaSnapshot>>((acc, product) => {
    const parsed = productSchema.parse(product);
    acc[parsed.slug] = {
      slug: parsed.slug,
      name: parsed.name.es,
      categoryId: parsed.categoryId,
      weightKg: parsed.logistics?.weightKg,
      slotValue: parsed.metadata?.slotValue,
      wholesaleCost: parsed.metadata?.wholesaleCost,
      tags: parsed.tags,
    };
    return acc;
  }, {});
}

export async function getBoxRulesMap(): Promise<Record<string, z.infer<typeof boxRuleSchema>>> {
  const rules = await listBoxRules();
  return rules.reduce<Record<string, z.infer<typeof boxRuleSchema>>>((acc, rule) => {
    const parsed = boxRuleSchema.parse(rule);
    acc[parsed.id] = parsed;
    return acc;
  }, {});
}

export type CatalogHistoryEntry = CatalogChange;

export async function listCatalogHistoryEntries(limit = 100): Promise<CatalogHistoryEntry[]> {
  const entries = await listCatalogHistory(limit);

  return entries.map((entry) => {
    const parser =
      entry.entityType === "product"
        ? productSchema
        : entry.entityType === "box_rule"
          ? boxRuleSchema
          : boxSchema;
    return {
      ...entry,
      before: parser.parse(entry.before),
      after: parser.parse(entry.after),
    };
  });
}

export async function updateProductById(id: string, payload: unknown, context: CatalogChangeContext = {}) {
  console.log(`[updateProductById] Looking for product with ID: ${id}`);
  const existing = await getProductById(id);
  if (!existing) {
    console.warn(`[updateProductById] Product not found when updating`, { id });
    return null;
  }
  console.log(`[updateProductById] Product found: ${existing.name.es} (ID: ${existing.id})`);

  const parsedExisting = productSchema.parse(existing);
  const updates = productUpdateSchema.parse(payload);
  const merged = mergeProduct(parsedExisting, updates);
  await saveProduct(merged);
  await recordCatalogChange("product", parsedExisting, merged, context);
  return merged;
}

export async function updateBoxById(id: string, payload: unknown, context: CatalogChangeContext = {}) {
  const existing = await getBoxById(id);
  if (!existing) {
    return null;
  }

  const parsedExisting = boxSchema.parse(existing);
  const updates = boxUpdateSchema.parse(payload);
  const merged = mergeBox(parsedExisting, updates);
  await saveBox(merged);
  await recordCatalogChange("box", parsedExisting, merged, context);
  return merged;
}

const productCreationSchema = z.object({
  slug: z.string().min(1).optional(),
  id: z.string().min(1).optional(),
  name: localizedStringSchema,
  categoryId: z.string().min(1),
  price: priceSchema,
  status: productSchema.shape.status.optional(),
  description: optionalLocalizedStringSchema,
  unit: optionalLocalizedStringSchema,
  tags: z.array(z.string()).optional(),
  image: z.string().min(1).optional(),
  isFeatured: z.boolean().optional(),
  metadata: productSchema.shape.metadata.optional(),
  nutrition: productSchema.shape.nutrition.optional(),
  logistics: productSchema.shape.logistics.optional(),
});

export async function createProduct(payload: unknown, context: CatalogChangeContext = {}) {
  const parsed = productCreationSchema.parse(payload);
  const generatedSlug = slugify(parsed.name.es, { lower: true, strict: true });
  const slug = parsed.slug?.trim() || generatedSlug;
  const id = parsed.id?.trim() || slug;

  const productPayload = {
    id,
    slug,
    name: parsed.name,
    categoryId: parsed.categoryId,
    price: parsed.price,
    status: parsed.status ?? "active",
    description: parsed.description,
    unit: parsed.unit,
    tags: parsed.tags ?? [],
    isFeatured: parsed.isFeatured ?? false,
    image: parsed.image,
    sku: parsed.slug,
    metadata: parsed.metadata,
    nutrition: parsed.nutrition,
    logistics: parsed.logistics,
  };

  const product = productSchema.parse(productPayload);
  await saveProduct(product);
  await recordCatalogChange("product", product, product, context);
  return product;
}

export async function updateComboById(id: string, payload: unknown, context: CatalogChangeContext = {}) {
  const existing = await getComboById(id);
  if (!existing) {
    return null;
  }

  const parsedExisting = comboSchema.parse(existing);
  const updates = comboUpdateSchema.parse(payload);
  const merged = mergeCombo(parsedExisting, updates);
  await saveCombo(merged);
  await recordCatalogChange("combo", parsedExisting, merged, context);
  return merged;
}

const boxRuleUpdateSchema = boxRuleSchema.partial().extend({
  id: z.string().min(1),
});

export async function updateBoxRuleById(id: string, payload: unknown, context: CatalogChangeContext = {}) {
  const existing = await getBoxRuleById(id);
  const parsedExisting = existing ? boxRuleSchema.parse(existing) : null;
  const updates = boxRuleUpdateSchema.parse({ ...(payload as Record<string, unknown>), id });
  const merged = boxRuleSchema.parse({
    ...(parsedExisting ?? {}),
    ...updates,
    id,
  });

  await saveBoxRule(merged);
  if (parsedExisting) {
    await recordCatalogChange("box_rule", parsedExisting, merged, context);
  } else {
    await recordCatalogChange("box_rule", merged, merged, context);
  }
  return merged;
}
// @ts-nocheck
