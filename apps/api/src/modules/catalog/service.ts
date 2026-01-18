import { z } from "zod";

import { boxes as staticBoxes, productCategories as staticCategories } from "./mock-data";
import {
  getBoxById,
  getBoxRuleById,
  getProductById,
  listAllBoxes,
  listAllProducts,
  listBoxRules,
  listBoxes,
  listCategories,
  listProducts,
  saveBox,
  saveBoxRule,
  saveProduct,
} from "./repository";
import {
  boxSchema,
  boxVariantSchema,
  boxRuleSchema,
  localizedStringSchema,
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
    storage: localizedStringSchema.partial().optional(),
  })
  .partial();

const productUpdateSchema = z
  .object({
    name: localizedStringSchema.partial().optional(),
    description: localizedStringSchema.partial().optional(),
    unit: localizedStringSchema.partial().optional(),
    price: priceSchema.partial().optional(),
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
    name: localizedStringSchema.partial().optional(),
    description: localizedStringSchema.partial().optional(),
    price: priceSchema.partial().optional(),
    heroImage: z.string().min(1).optional(),
    isFeatured: z.boolean().optional(),
    durationDays: z.number().int().positive().optional(),
    variants: z.array(boxVariantSchema).optional(),
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
    name: updates.name ? mergeLocalized(existing.name, updates.name) : existing.name,
    description: updates.description ? mergeLocalized(existing.description, updates.description) : existing.description,
    unit: updates.unit ? mergeLocalized(existing.unit, updates.unit) : existing.unit,
    price: updates.price ? { ...existing.price, ...updates.price } : existing.price,
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
  description: localizedStringSchema.partial().optional(),
  unit: localizedStringSchema.partial().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().min(1).optional(),
  isFeatured: z.boolean().optional(),
  metadata: productSchema.shape.metadata.optional(),
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
  };

  const product = productSchema.parse(productPayload);
  await saveProduct(product);
  await recordCatalogChange("product", product, product, context);
  return product;
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
