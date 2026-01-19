"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comboSchema = exports.boxRuleSchema = exports.boxSchema = exports.boxVariantSchema = exports.productSchema = exports.productCategorySchema = exports.priceSchema = exports.localizedStringSchema = exports.localeSchema = void 0;
const zod_1 = require("zod");
exports.localeSchema = zod_1.z.enum(["es", "en"]);
exports.localizedStringSchema = zod_1.z.object({
    es: zod_1.z.string().min(1),
    en: zod_1.z.string().min(1),
});
exports.priceSchema = zod_1.z.object({
    amount: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().length(3).default("DOP"),
});
exports.productCategorySchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    name: exports.localizedStringSchema,
    description: exports.localizedStringSchema.partial().optional(),
    sortOrder: zod_1.z.number().int().nonnegative().default(0),
    status: zod_1.z.enum(["active", "inactive"]).default("active"),
});
exports.productSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    sku: zod_1.z.string().optional(),
    name: exports.localizedStringSchema,
    description: exports.localizedStringSchema.partial().optional(),
    unit: exports.localizedStringSchema.partial().optional(),
    categoryId: zod_1.z.string().min(1),
    price: exports.priceSchema,
    salePrice: exports.priceSchema.optional(),
    status: zod_1.z.enum(["active", "inactive", "coming_soon", "discontinued"]).default("active"),
    image: zod_1.z.string().min(1).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isFeatured: zod_1.z.boolean().default(false),
    metadata: zod_1.z
        .object({
        slotValue: zod_1.z.number().int().positive().optional(),
        wholesaleCost: zod_1.z.number().nonnegative().optional(),
    })
        .passthrough()
        .optional(),
    nutrition: zod_1.z
        .object({
        vegan: zod_1.z.boolean().optional(),
        glutenFree: zod_1.z.boolean().optional(),
        organic: zod_1.z.boolean().optional(),
        calories: zod_1.z.number().nonnegative().optional(),
        protein: zod_1.z.number().nonnegative().optional(),
        carbs: zod_1.z.number().nonnegative().optional(),
        fats: zod_1.z.number().nonnegative().optional(),
        fiber: zod_1.z.number().nonnegative().optional(),
        sugars: zod_1.z.number().nonnegative().optional(),
    })
        .optional(),
    logistics: zod_1.z
        .object({
        weightKg: zod_1.z.number().nonnegative().optional(),
        dimensionsCm: zod_1.z
            .object({
            length: zod_1.z.number().nonnegative(),
            width: zod_1.z.number().nonnegative(),
            height: zod_1.z.number().nonnegative(),
        })
            .optional(),
        storage: exports.localizedStringSchema.partial().optional(),
    })
        .optional(),
});
exports.boxVariantSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    name: exports.localizedStringSchema,
    description: exports.localizedStringSchema.partial().optional(),
    highlights: zod_1.z.array(exports.localizedStringSchema).default([]),
    referenceContents: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().optional(),
        name: exports.localizedStringSchema,
        quantity: zod_1.z.string().optional(),
    }))
        .default([]),
});
exports.boxSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    name: exports.localizedStringSchema,
    description: exports.localizedStringSchema.partial().optional(),
    price: exports.priceSchema,
    durationDays: zod_1.z.number().int().positive().optional(),
    ruleId: zod_1.z.string().min(1).optional(),
    dimensionsLabel: zod_1.z.string().min(1).optional(),
    weightLabel: zod_1.z.string().min(1).optional(),
    heroImage: zod_1.z.string().min(1).optional(),
    isFeatured: zod_1.z.boolean().default(true),
    variants: zod_1.z.array(exports.boxVariantSchema),
});
exports.boxRuleSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    displayName: zod_1.z.string().min(1),
    slotBudget: zod_1.z.number().int().positive(),
    targetWeightKg: zod_1.z.number().positive(),
    minMargin: zod_1.z.number().nonnegative().optional(),
    categoryBudget: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        min: zod_1.z.number().int().nonnegative(),
        max: zod_1.z.number().int().nonnegative(),
    })),
    baseContents: zod_1.z.array(zod_1.z.object({
        productSlug: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().positive(),
    })),
    variantContents: zod_1.z
        .object({
        mix: zod_1.z
            .array(zod_1.z.object({
            productSlug: zod_1.z.string().min(1),
            quantity: zod_1.z.number().int().positive(),
        }))
            .optional(),
        fruity: zod_1.z
            .array(zod_1.z.object({
            productSlug: zod_1.z.string().min(1),
            quantity: zod_1.z.number().int().positive(),
        }))
            .optional(),
        veggie: zod_1.z
            .array(zod_1.z.object({
            productSlug: zod_1.z.string().min(1),
            quantity: zod_1.z.number().int().positive(),
        }))
            .optional(),
    })
        .partial()
        .optional(),
});
exports.comboSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: exports.localizedStringSchema,
    salad: exports.localizedStringSchema,
    juice: exports.localizedStringSchema,
    dessert: exports.localizedStringSchema,
    price: zod_1.z.number().nonnegative(),
    cost: zod_1.z.number().nonnegative().optional(),
    margin: zod_1.z.number().nonnegative().optional(),
    calories: zod_1.z.number().nonnegative(),
    protein: zod_1.z.number().nonnegative(),
    glutenFree: zod_1.z.boolean().default(false),
    benefit: exports.localizedStringSchema,
    benefitDetail: exports.localizedStringSchema,
    recommendedFor: exports.localizedStringSchema,
    carbs: zod_1.z.number().nonnegative(),
    fats: zod_1.z.number().nonnegative(),
    fiber: zod_1.z.number().nonnegative(),
    sugars: zod_1.z.number().nonnegative(),
    vitaminA: zod_1.z.string().optional(),
    vitaminC: zod_1.z.string().optional(),
    image: zod_1.z.string().min(1).optional(),
    ingredients: zod_1.z.array(exports.localizedStringSchema).default([]),
    status: zod_1.z.enum(["active", "inactive", "coming_soon"]).default("active"),
    isFeatured: zod_1.z.boolean().default(false),
});
//# sourceMappingURL=schemas.js.map