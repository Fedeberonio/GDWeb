import { z } from "zod";

export const localeSchema = z.enum(["es", "en"]);

export const localizedStringSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

const optionalLocalizedStringPreprocess = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const localized = value as Record<string, unknown>;
  const cleaned: Record<string, string> = {};
  const es = typeof localized.es === "string" ? localized.es.trim() : "";
  const en = typeof localized.en === "string" ? localized.en.trim() : "";
  if (es) cleaned.es = es;
  if (en) cleaned.en = en;
  return Object.keys(cleaned).length ? cleaned : undefined;
};

export const optionalLocalizedStringSchema = z
  .preprocess(optionalLocalizedStringPreprocess, localizedStringSchema.partial())
  .optional();

const optionalNonEmptyStringSchema = z
  .union([z.string().min(1), z.literal("")])
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const priceSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3).default("DOP"),
});

export const productCategorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: optionalLocalizedStringSchema,
  sortOrder: z.number().int().nonnegative().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().optional(),
  name: localizedStringSchema,
  description: optionalLocalizedStringSchema,
  unit: optionalLocalizedStringSchema,
  categoryId: z.string().min(1),
  price: priceSchema,
  salePrice: priceSchema.optional(),
  status: z.enum(["active", "inactive", "coming_soon", "discontinued", "hidden"]).default("active"),
  image: optionalNonEmptyStringSchema,
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  metadata: z
    .object({
      slotValue: z.number().int().positive().optional(),
      wholesaleCost: z.number().nonnegative().optional(),
    })
    .passthrough()
    .optional(),
  nutrition: z
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
    .optional(),
  logistics: z
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
    .optional(),
});

export const boxVariantSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: optionalLocalizedStringSchema,
  highlights: z.array(localizedStringSchema).default([]),
  referenceContents: z
    .array(
      z.object({
        productId: z.string().optional(),
        name: localizedStringSchema,
        quantity: z.string().optional(),
      })
    )
    .default([]),
});

export const boxSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: optionalLocalizedStringSchema,
  price: priceSchema,
  durationDays: z.number().int().positive().optional(),
  ruleId: optionalNonEmptyStringSchema,
  dimensionsLabel: optionalNonEmptyStringSchema,
  weightLabel: optionalNonEmptyStringSchema,
  heroImage: optionalNonEmptyStringSchema,
  isFeatured: z.boolean().default(true),
  variants: z.array(boxVariantSchema),
});

export const boxRuleSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  slotBudget: z.number().int().positive(),
  targetWeightKg: z.number().positive(),
  minMargin: z.number().nonnegative().optional(),
  categoryBudget: z.record(
    z.string(),
    z.object({
      min: z.number().int().nonnegative(),
      max: z.number().int().nonnegative(),
    }),
  ),
  baseContents: z.array(
    z.object({
      productSku: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ),
  variantContents: z
    .object({
      mix: z
        .array(
          z.object({
            productSku: z.string().min(1),
            quantity: z.number().int().positive(),
          }),
        )
        .optional(),
      fruity: z
        .array(
          z.object({
            productSku: z.string().min(1),
            quantity: z.number().int().positive(),
          }),
        )
        .optional(),
      veggie: z
        .array(
          z.object({
            productSku: z.string().min(1),
            quantity: z.number().int().positive(),
          }),
        )
        .optional(),
    })
    .partial()
    .optional(),
});

export const comboSchema = z.object({
  id: z.string().min(1),
  name: localizedStringSchema,
  salad: localizedStringSchema,
  juice: localizedStringSchema,
  dessert: localizedStringSchema,
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().optional(),
  margin: z.number().nonnegative().optional(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  glutenFree: z.boolean().default(false),
  benefit: localizedStringSchema,
  benefitDetail: localizedStringSchema,
  recommendedFor: localizedStringSchema,
  carbs: z.number().nonnegative(),
  fats: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
  sugars: z.number().nonnegative(),
  vitaminA: z.string().optional(),
  vitaminC: z.string().optional(),
  image: optionalNonEmptyStringSchema,
  ingredients: z.array(localizedStringSchema).default([]),
  status: z.enum(["active", "inactive", "coming_soon"]).default("active"),
  isFeatured: z.boolean().default(false),
});

export const supplySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  provider: optionalNonEmptyStringSchema,
  unitPrice: z.number().nonnegative().optional(),
  isReturnable: z.boolean(),
  stock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  meta: z
    .object({
      material: optionalNonEmptyStringSchema,
      dimensions: optionalNonEmptyStringSchema,
      capacity: optionalNonEmptyStringSchema,
    })
    .default({}),
});

export type LocaleCode = z.infer<typeof localeSchema>;
export type LocalizedString = z.infer<typeof localizedStringSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type BoxVariant = z.infer<typeof boxVariantSchema>;
export type Box = z.infer<typeof boxSchema>;
export type BoxRule = z.infer<typeof boxRuleSchema>;
export type Combo = z.infer<typeof comboSchema>;
export type Supply = z.infer<typeof supplySchema>;
