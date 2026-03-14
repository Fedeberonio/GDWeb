import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const trimString = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const nonNegativeNumberField = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().finite().nonnegative().optional(),
);

const nonNegativeIntegerField = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().nonnegative().optional(),
);

const positiveIntegerField = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional(),
);

const localizedStringSchema = z
  .object({
    es: z.preprocess(trimString, z.string().optional()),
    en: z.preprocess(trimString, z.string().optional()),
  })
  .transform((value) => ({
    es: value.es ?? "",
    en: value.en ?? value.es ?? "",
  }));

const partialLocalizedStringSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z
    .object({
      es: z.preprocess(emptyStringToUndefined, z.string().optional()),
      en: z.preprocess(emptyStringToUndefined, z.string().optional()),
    })
    .transform((value) => ({
      ...(value.es ? { es: value.es } : {}),
      ...(value.en ? { en: value.en } : {}),
    }))
    .optional(),
);

const billOfMaterialsItemSchema = z.object({
  supplyId: z.preprocess(emptyStringToUndefined, z.string().min(1)),
  name: z.preprocess(trimString, z.string().default("")),
  quantity: z.coerce.number().finite().nonnegative(),
});

const recipeIngredientSchema = z
  .object({
    productId: z.preprocess(emptyStringToUndefined, z.string().optional()),
    supplyId: z.preprocess(emptyStringToUndefined, z.string().optional()),
    quantity: z.coerce.number().finite().nonnegative(),
    unit: z.preprocess(trimString, z.string().default("und")),
  })
  .superRefine((value, context) => {
    if (!value.productId && !value.supplyId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada ingrediente debe tener productId o supplyId.",
      });
    }
  });

const presentationSchema = z
  .object({
    benefit: partialLocalizedStringSchema.optional(),
    benefitDetail: partialLocalizedStringSchema.optional(),
    vitamins: z
      .object({
        vitaminA: z.preprocess(emptyStringToUndefined, z.string().optional()),
        vitaminC: z.preprocess(emptyStringToUndefined, z.string().optional()),
      })
      .optional(),
  })
  .optional();

const metadataSchema = z
  .object({
    slotValue: nonNegativeIntegerField,
    wholesaleCost: nonNegativeNumberField,
    stock: nonNegativeIntegerField,
    minStock: nonNegativeIntegerField,
    billOfMaterials: z.array(billOfMaterialsItemSchema).optional(),
  })
  .optional();

const logisticsSchema = z
  .object({
    weightKg: nonNegativeNumberField,
    dimensionsCm: z
      .object({
        length: nonNegativeNumberField,
        width: nonNegativeNumberField,
        height: nonNegativeNumberField,
      })
      .optional(),
    storage: partialLocalizedStringSchema.optional(),
  })
  .optional();

const nutritionSchema = z
  .object({
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    organic: z.boolean().optional(),
    calories: nonNegativeNumberField,
    protein: nonNegativeNumberField,
    carbs: nonNegativeNumberField,
    fats: nonNegativeNumberField,
    fiber: nonNegativeNumberField,
    sugars: nonNegativeNumberField,
    detailDescription: partialLocalizedStringSchema.optional(),
    detailIngredients: z.array(z.preprocess(trimString, z.string())).optional(),
    detailBenefits: z.array(z.preprocess(trimString, z.string())).optional(),
    detailPerfectFor: partialLocalizedStringSchema.optional(),
    detailNote: partialLocalizedStringSchema.optional(),
  })
  .optional();

const productPayloadSchema = z.object({
  sku: z.preprocess(emptyStringToUndefined, z.string().optional()),
  name: localizedStringSchema.optional(),
  description: partialLocalizedStringSchema.optional(),
  unit: z
    .union([z.preprocess(trimString, z.string()), partialLocalizedStringSchema])
    .optional(),
  price: nonNegativeNumberField,
  salePrice: z.union([nonNegativeNumberField, z.null()]).optional(),
  status: z.enum(["active", "inactive", "coming_soon", "discontinued", "hidden"]).optional(),
  isFeatured: z.boolean().optional(),
  categoryId: z.preprocess(emptyStringToUndefined, z.string().optional()),
  type: z.enum(["simple", "box", "salad", "prepared"]).optional(),
  recipe: z
    .union([
      z.null(),
      z.object({
        yields: z.coerce.number().int().positive(),
        ingredients: z.array(recipeIngredientSchema),
      }),
    ])
    .optional(),
  tags: z.array(z.preprocess(trimString, z.string())).optional(),
  image: z.preprocess(emptyStringToUndefined, z.string().optional()),
  metadata: metadataSchema,
  logistics: logisticsSchema,
  nutrition: nutritionSchema,
  presentation: presentationSchema,
});

const boxReferenceContentSchema = z
  .object({
    productId: z.preprocess(emptyStringToUndefined, z.string().optional()),
    name: partialLocalizedStringSchema.optional(),
    quantity: positiveIntegerField,
  })
  .superRefine((value, context) => {
    const hasName = Boolean(value.name?.es || value.name?.en);
    if (!value.productId && !hasName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada contenido de caja debe tener producto o nombre de respaldo.",
      });
    }
  });

const boxVariantSchema = z.object({
  id: z.preprocess(emptyStringToUndefined, z.string().optional()),
  slug: z.preprocess(emptyStringToUndefined, z.string().optional()),
  name: localizedStringSchema,
  description: partialLocalizedStringSchema.optional(),
  referenceContents: z.array(boxReferenceContentSchema).default([]),
});

const boxPayloadSchema = z.object({
  id: z.preprocess(emptyStringToUndefined, z.string().optional()),
  sku: z.preprocess(emptyStringToUndefined, z.string().optional()),
  slug: z.preprocess(emptyStringToUndefined, z.string().optional()),
  name: localizedStringSchema.optional(),
  description: partialLocalizedStringSchema.optional(),
  price: z
    .union([
      nonNegativeNumberField,
      z.object({
        amount: z.coerce.number().finite().nonnegative(),
        currency: z.preprocess(emptyStringToUndefined, z.string().default("DOP")),
      }),
    ])
    .optional(),
  durationDays: nonNegativeIntegerField,
  weightLabel: z.preprocess(emptyStringToUndefined, z.string().optional()),
  dimensionsLabel: z.preprocess(emptyStringToUndefined, z.string().optional()),
  heroImage: z.preprocess(emptyStringToUndefined, z.string().optional()),
  image: z.preprocess(emptyStringToUndefined, z.string().optional()),
  isFeatured: z.boolean().optional(),
  status: z.enum(["active", "inactive", "coming_soon", "discontinued", "hidden"]).optional(),
  ruleId: z.preprocess(emptyStringToUndefined, z.string().optional()),
  variants: z.array(boxVariantSchema).default([]),
  metadata: z
    .object({
      billOfMaterials: z.array(billOfMaterialsItemSchema).optional(),
    })
    .optional(),
});

const boxRulePayloadSchema = z.object({
  displayName: z.preprocess(trimString, z.string()),
  slotBudget: z.coerce.number().int().positive(),
  targetWeightKg: z.coerce.number().finite().positive(),
  minMargin: nonNegativeNumberField,
  categoryBudget: z.record(
    z.string(),
    z.object({
      min: z.coerce.number().finite().nonnegative(),
      max: z.coerce.number().finite().nonnegative(),
    }),
  ),
});

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "payload";
      return `${path}: ${issue.message}`;
    })
    .join(" | ");
}

export function parseAdminProductPayload(payload: unknown) {
  const parsed = productPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Datos de producto inválidos: ${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}

export function parseAdminBoxPayload(payload: unknown) {
  const parsed = boxPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Datos de caja inválidos: ${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}

export function parseAdminBoxRulePayload(payload: unknown) {
  const parsed = boxRulePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Datos de reglas inválidos: ${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}
