import { z } from "zod";

export const localeSchema = z.enum(["es", "en"]);

export const localizedStringSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

export const priceSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3).default("DOP"),
});

export const productCategorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: localizedStringSchema.partial().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().optional(),
  name: localizedStringSchema,
  description: localizedStringSchema.partial().optional(),
  unit: localizedStringSchema.partial().optional(),
  categoryId: z.string().min(1),
  price: priceSchema,
  salePrice: priceSchema.optional(),
  status: z.enum(["active", "inactive", "coming_soon", "discontinued"]).default("active"),
  image: z.string().min(1).optional(),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  nutrition: z
    .object({
      vegan: z.boolean().optional(),
      glutenFree: z.boolean().optional(),
      organic: z.boolean().optional(),
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
      storage: localizedStringSchema.partial().optional(),
    })
    .optional(),
});

export const boxVariantSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: localizedStringSchema.partial().optional(),
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
  description: localizedStringSchema.partial().optional(),
  price: priceSchema,
  durationDays: z.number().int().positive().optional(),
  heroImage: z.string().min(1).optional(),
  isFeatured: z.boolean().default(true),
  variants: z.array(boxVariantSchema),
});

export type LocaleCode = z.infer<typeof localeSchema>;
export type LocalizedString = z.infer<typeof localizedStringSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type BoxVariant = z.infer<typeof boxVariantSchema>;
export type Box = z.infer<typeof boxSchema>;
