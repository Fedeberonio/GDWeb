"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boxSchema = exports.boxVariantSchema = exports.productSchema = exports.productCategorySchema = exports.priceSchema = exports.localizedStringSchema = exports.localeSchema = void 0;
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
    nutrition: zod_1.z
        .object({
        vegan: zod_1.z.boolean().optional(),
        glutenFree: zod_1.z.boolean().optional(),
        organic: zod_1.z.boolean().optional(),
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
    heroImage: zod_1.z.string().min(1).optional(),
    isFeatured: zod_1.z.boolean().default(true),
    variants: zod_1.z.array(exports.boxVariantSchema),
});
//# sourceMappingURL=schemas.js.map