import { z } from "zod";
export declare const localeSchema: z.ZodEnum<{
    es: "es";
    en: "en";
}>;
export declare const localizedStringSchema: z.ZodObject<{
    es: z.ZodString;
    en: z.ZodString;
}, z.core.$strip>;
export declare const priceSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const productCategorySchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    description: z.ZodOptional<z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>>;
}, z.core.$strip>;
export declare const productSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    description: z.ZodOptional<z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    unit: z.ZodOptional<z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    categoryId: z.ZodString;
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    salePrice: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        coming_soon: "coming_soon";
        discontinued: "discontinued";
    }>>;
    image: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    nutrition: z.ZodOptional<z.ZodObject<{
        vegan: z.ZodOptional<z.ZodBoolean>;
        glutenFree: z.ZodOptional<z.ZodBoolean>;
        organic: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    logistics: z.ZodOptional<z.ZodObject<{
        weightKg: z.ZodOptional<z.ZodNumber>;
        dimensionsCm: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
        storage: z.ZodOptional<z.ZodObject<{
            es: z.ZodOptional<z.ZodString>;
            en: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const boxVariantSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    description: z.ZodOptional<z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    highlights: z.ZodDefault<z.ZodArray<z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>>>;
    referenceContents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        name: z.ZodObject<{
            es: z.ZodString;
            en: z.ZodString;
        }, z.core.$strip>;
        quantity: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const boxSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    description: z.ZodOptional<z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    durationDays: z.ZodOptional<z.ZodNumber>;
    heroImage: z.ZodOptional<z.ZodString>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        name: z.ZodObject<{
            es: z.ZodString;
            en: z.ZodString;
        }, z.core.$strip>;
        description: z.ZodOptional<z.ZodObject<{
            es: z.ZodOptional<z.ZodString>;
            en: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        highlights: z.ZodDefault<z.ZodArray<z.ZodObject<{
            es: z.ZodString;
            en: z.ZodString;
        }, z.core.$strip>>>;
        referenceContents: z.ZodDefault<z.ZodArray<z.ZodObject<{
            productId: z.ZodOptional<z.ZodString>;
            name: z.ZodObject<{
                es: z.ZodString;
                en: z.ZodString;
            }, z.core.$strip>;
            quantity: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type LocaleCode = z.infer<typeof localeSchema>;
export type LocalizedString = z.infer<typeof localizedStringSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type BoxVariant = z.infer<typeof boxVariantSchema>;
export type Box = z.infer<typeof boxSchema>;
//# sourceMappingURL=schemas.d.ts.map