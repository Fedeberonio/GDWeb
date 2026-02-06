import { z } from "zod";
export declare const localeSchema: z.ZodEnum<{
    es: "es";
    en: "en";
}>;
export declare const localizedStringSchema: z.ZodObject<{
    es: z.ZodString;
    en: z.ZodString;
}, z.core.$strip>;
export declare const optionalLocalizedStringSchema: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
    es: z.ZodOptional<z.ZodString>;
    en: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>>;
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
    description: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
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
    description: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    unit: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
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
        hidden: "hidden";
    }>>;
    image: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodObject<{
        slotValue: z.ZodOptional<z.ZodNumber>;
        wholesaleCost: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>>;
    nutrition: z.ZodOptional<z.ZodObject<{
        vegan: z.ZodOptional<z.ZodBoolean>;
        glutenFree: z.ZodOptional<z.ZodBoolean>;
        organic: z.ZodOptional<z.ZodBoolean>;
        calories: z.ZodOptional<z.ZodNumber>;
        protein: z.ZodOptional<z.ZodNumber>;
        carbs: z.ZodOptional<z.ZodNumber>;
        fats: z.ZodOptional<z.ZodNumber>;
        fiber: z.ZodOptional<z.ZodNumber>;
        sugars: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    logistics: z.ZodOptional<z.ZodObject<{
        weightKg: z.ZodOptional<z.ZodNumber>;
        dimensionsCm: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
        storage: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
            es: z.ZodOptional<z.ZodString>;
            en: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const boxVariantSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    description: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
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
    description: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        es: z.ZodOptional<z.ZodString>;
        en: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    durationDays: z.ZodOptional<z.ZodNumber>;
    ruleId: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    dimensionsLabel: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    weightLabel: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    heroImage: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        name: z.ZodObject<{
            es: z.ZodString;
            en: z.ZodString;
        }, z.core.$strip>;
        description: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
            es: z.ZodOptional<z.ZodString>;
            en: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
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
export declare const boxRuleSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    slotBudget: z.ZodNumber;
    targetWeightKg: z.ZodNumber;
    minMargin: z.ZodOptional<z.ZodNumber>;
    categoryBudget: z.ZodRecord<z.ZodString, z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
    }, z.core.$strip>>;
    baseContents: z.ZodArray<z.ZodObject<{
        productSku: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    variantContents: z.ZodOptional<z.ZodObject<{
        mix: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            productSku: z.ZodString;
            quantity: z.ZodNumber;
        }, z.core.$strip>>>>;
        fruity: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            productSku: z.ZodString;
            quantity: z.ZodNumber;
        }, z.core.$strip>>>>;
        veggie: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            productSku: z.ZodString;
            quantity: z.ZodNumber;
        }, z.core.$strip>>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const comboSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    salad: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    juice: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    dessert: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    price: z.ZodNumber;
    cost: z.ZodOptional<z.ZodNumber>;
    margin: z.ZodOptional<z.ZodNumber>;
    calories: z.ZodNumber;
    protein: z.ZodNumber;
    glutenFree: z.ZodDefault<z.ZodBoolean>;
    benefit: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    benefitDetail: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    recommendedFor: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    carbs: z.ZodNumber;
    fats: z.ZodNumber;
    fiber: z.ZodNumber;
    sugars: z.ZodNumber;
    vitaminA: z.ZodOptional<z.ZodString>;
    vitaminC: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    ingredients: z.ZodDefault<z.ZodArray<z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>>>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        coming_soon: "coming_soon";
    }>>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const supplySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodString;
    provider: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    unitPrice: z.ZodOptional<z.ZodNumber>;
    isReturnable: z.ZodBoolean;
    stock: z.ZodOptional<z.ZodNumber>;
    minStockAlert: z.ZodOptional<z.ZodNumber>;
    meta: z.ZodDefault<z.ZodObject<{
        material: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
        dimensions: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
        capacity: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"">]>, z.ZodTransform<string, string>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type LocaleCode = z.infer<typeof localeSchema>;
export type LocalizedString = z.infer<typeof localizedStringSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type BoxVariant = z.infer<typeof boxVariantSchema>;
export type Box = z.infer<typeof boxSchema>;
export type BoxRule = z.infer<typeof boxRuleSchema>;
export type Combo = z.infer<typeof comboSchema>;
export type Supply = z.infer<typeof supplySchema>;
//# sourceMappingURL=schemas.d.ts.map