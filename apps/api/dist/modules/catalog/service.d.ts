import { z } from "zod";
import { boxRuleSchema } from "./schemas";
import { type CatalogChangeContext, type CatalogChange } from "./history";
export declare function getCategories(): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    sortOrder: number;
    status: "active" | "inactive";
    description?: {
        es?: string;
        en?: string;
    };
}[]>;
export declare function getProducts(): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    categoryId: string;
    price: {
        amount: number;
        currency: string;
    };
    status: "active" | "inactive" | "coming_soon" | "discontinued";
    tags: string[];
    isFeatured: boolean;
    sku?: string;
    description?: {
        es?: string;
        en?: string;
    };
    unit?: {
        es?: string;
        en?: string;
    };
    salePrice?: {
        amount: number;
        currency: string;
    };
    image?: string;
    metadata?: {
        [x: string]: unknown;
        slotValue?: number;
        wholesaleCost?: number;
    };
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
        calories?: number;
        protein?: number;
        carbs?: number;
        fats?: number;
        fiber?: number;
        sugars?: number;
    };
    logistics?: {
        weightKg?: number;
        dimensionsCm?: {
            length: number;
            width: number;
            height: number;
        };
        storage?: {
            es?: string;
            en?: string;
        };
    };
}[]>;
export declare function getBoxes(): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    price: {
        amount: number;
        currency: string;
    };
    isFeatured: boolean;
    variants: {
        id: string;
        slug: string;
        name: {
            es: string;
            en: string;
        };
        highlights: {
            es: string;
            en: string;
        }[];
        referenceContents: {
            name: {
                es: string;
                en: string;
            };
            productId?: string;
            quantity?: string;
        }[];
        description?: {
            es?: string;
            en?: string;
        };
    }[];
    description?: {
        es?: string;
        en?: string;
    };
    durationDays?: number;
    ruleId?: string;
    dimensionsLabel?: string;
    weightLabel?: string;
    heroImage?: string;
}[]>;
export declare function listProductsForAdmin(): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    categoryId: string;
    price: {
        amount: number;
        currency: string;
    };
    status: "active" | "inactive" | "coming_soon" | "discontinued";
    tags: string[];
    isFeatured: boolean;
    sku?: string;
    description?: {
        es?: string;
        en?: string;
    };
    unit?: {
        es?: string;
        en?: string;
    };
    salePrice?: {
        amount: number;
        currency: string;
    };
    image?: string;
    metadata?: {
        [x: string]: unknown;
        slotValue?: number;
        wholesaleCost?: number;
    };
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
        calories?: number;
        protein?: number;
        carbs?: number;
        fats?: number;
        fiber?: number;
        sugars?: number;
    };
    logistics?: {
        weightKg?: number;
        dimensionsCm?: {
            length: number;
            width: number;
            height: number;
        };
        storage?: {
            es?: string;
            en?: string;
        };
    };
}[]>;
export declare function listBoxesForAdmin(): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    price: {
        amount: number;
        currency: string;
    };
    isFeatured: boolean;
    variants: {
        id: string;
        slug: string;
        name: {
            es: string;
            en: string;
        };
        highlights: {
            es: string;
            en: string;
        }[];
        referenceContents: {
            name: {
                es: string;
                en: string;
            };
            productId?: string;
            quantity?: string;
        }[];
        description?: {
            es?: string;
            en?: string;
        };
    }[];
    description?: {
        es?: string;
        en?: string;
    };
    durationDays?: number;
    ruleId?: string;
    dimensionsLabel?: string;
    weightLabel?: string;
    heroImage?: string;
}[]>;
export declare function listBoxRulesForAdmin(): Promise<{
    id: string;
    displayName: string;
    slotBudget: number;
    targetWeightKg: number;
    categoryBudget: Record<string, {
        min: number;
        max: number;
    }>;
    baseContents: {
        productSlug: string;
        quantity: number;
    }[];
    minMargin?: number;
    variantContents?: {
        mix?: {
            productSlug: string;
            quantity: number;
        }[];
        fruity?: {
            productSlug: string;
            quantity: number;
        }[];
        veggie?: {
            productSlug: string;
            quantity: number;
        }[];
    };
}[]>;
export declare function listCombosForAdmin(): Promise<{
    id: string;
    name: {
        es: string;
        en: string;
    };
    salad: {
        es: string;
        en: string;
    };
    juice: {
        es: string;
        en: string;
    };
    dessert: {
        es: string;
        en: string;
    };
    price: number;
    calories: number;
    protein: number;
    glutenFree: boolean;
    benefit: {
        es: string;
        en: string;
    };
    benefitDetail: {
        es: string;
        en: string;
    };
    recommendedFor: {
        es: string;
        en: string;
    };
    carbs: number;
    fats: number;
    fiber: number;
    sugars: number;
    ingredients: {
        es: string;
        en: string;
    }[];
    status: "active" | "inactive" | "coming_soon";
    isFeatured: boolean;
    cost?: number;
    margin?: number;
    vitaminA?: string;
    vitaminC?: string;
    image?: string;
}[]>;
export declare function getCombos(): Promise<{
    id: string;
    name: {
        es: string;
        en: string;
    };
    salad: {
        es: string;
        en: string;
    };
    juice: {
        es: string;
        en: string;
    };
    dessert: {
        es: string;
        en: string;
    };
    price: number;
    calories: number;
    protein: number;
    glutenFree: boolean;
    benefit: {
        es: string;
        en: string;
    };
    benefitDetail: {
        es: string;
        en: string;
    };
    recommendedFor: {
        es: string;
        en: string;
    };
    carbs: number;
    fats: number;
    fiber: number;
    sugars: number;
    ingredients: {
        es: string;
        en: string;
    }[];
    status: "active" | "inactive" | "coming_soon";
    isFeatured: boolean;
    cost?: number;
    margin?: number;
    vitaminA?: string;
    vitaminC?: string;
    image?: string;
}[]>;
export declare function listBoxRulesPublic(): Promise<{
    id: string;
    displayName: string;
    slotBudget: number;
    targetWeightKg: number;
    categoryBudget: Record<string, {
        min: number;
        max: number;
    }>;
    baseContents: {
        productSlug: string;
        quantity: number;
    }[];
    minMargin?: number;
    variantContents?: {
        mix?: {
            productSlug: string;
            quantity: number;
        }[];
        fruity?: {
            productSlug: string;
            quantity: number;
        }[];
        veggie?: {
            productSlug: string;
            quantity: number;
        }[];
    };
}[]>;
export type ProductMetaSnapshot = {
    slug: string;
    name: string;
    categoryId: string;
    weightKg?: number;
    slotValue?: number;
    wholesaleCost?: number;
    tags: string[];
};
export declare function getProductMetaMap(): Promise<Record<string, ProductMetaSnapshot>>;
export declare function getBoxRulesMap(): Promise<Record<string, z.infer<typeof boxRuleSchema>>>;
export type CatalogHistoryEntry = CatalogChange;
export declare function listCatalogHistoryEntries(limit?: number): Promise<CatalogHistoryEntry[]>;
export declare function updateProductById(id: string, payload: unknown, context?: CatalogChangeContext): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    categoryId: string;
    price: {
        amount: number;
        currency: string;
    };
    status: "active" | "inactive" | "coming_soon" | "discontinued";
    tags: string[];
    isFeatured: boolean;
    sku?: string;
    description?: {
        es?: string;
        en?: string;
    };
    unit?: {
        es?: string;
        en?: string;
    };
    salePrice?: {
        amount: number;
        currency: string;
    };
    image?: string;
    metadata?: {
        [x: string]: unknown;
        slotValue?: number;
        wholesaleCost?: number;
    };
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
        calories?: number;
        protein?: number;
        carbs?: number;
        fats?: number;
        fiber?: number;
        sugars?: number;
    };
    logistics?: {
        weightKg?: number;
        dimensionsCm?: {
            length: number;
            width: number;
            height: number;
        };
        storage?: {
            es?: string;
            en?: string;
        };
    };
}>;
export declare function updateBoxById(id: string, payload: unknown, context?: CatalogChangeContext): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    price: {
        amount: number;
        currency: string;
    };
    isFeatured: boolean;
    variants: {
        id: string;
        slug: string;
        name: {
            es: string;
            en: string;
        };
        highlights: {
            es: string;
            en: string;
        }[];
        referenceContents: {
            name: {
                es: string;
                en: string;
            };
            productId?: string;
            quantity?: string;
        }[];
        description?: {
            es?: string;
            en?: string;
        };
    }[];
    description?: {
        es?: string;
        en?: string;
    };
    durationDays?: number;
    ruleId?: string;
    dimensionsLabel?: string;
    weightLabel?: string;
    heroImage?: string;
}>;
export declare function createProduct(payload: unknown, context?: CatalogChangeContext): Promise<{
    id: string;
    slug: string;
    name: {
        es: string;
        en: string;
    };
    categoryId: string;
    price: {
        amount: number;
        currency: string;
    };
    status: "active" | "inactive" | "coming_soon" | "discontinued";
    tags: string[];
    isFeatured: boolean;
    sku?: string;
    description?: {
        es?: string;
        en?: string;
    };
    unit?: {
        es?: string;
        en?: string;
    };
    salePrice?: {
        amount: number;
        currency: string;
    };
    image?: string;
    metadata?: {
        [x: string]: unknown;
        slotValue?: number;
        wholesaleCost?: number;
    };
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
        calories?: number;
        protein?: number;
        carbs?: number;
        fats?: number;
        fiber?: number;
        sugars?: number;
    };
    logistics?: {
        weightKg?: number;
        dimensionsCm?: {
            length: number;
            width: number;
            height: number;
        };
        storage?: {
            es?: string;
            en?: string;
        };
    };
}>;
export declare function updateComboById(id: string, payload: unknown, context?: CatalogChangeContext): Promise<{
    id: string;
    name: {
        es: string;
        en: string;
    };
    salad: {
        es: string;
        en: string;
    };
    juice: {
        es: string;
        en: string;
    };
    dessert: {
        es: string;
        en: string;
    };
    price: number;
    calories: number;
    protein: number;
    glutenFree: boolean;
    benefit: {
        es: string;
        en: string;
    };
    benefitDetail: {
        es: string;
        en: string;
    };
    recommendedFor: {
        es: string;
        en: string;
    };
    carbs: number;
    fats: number;
    fiber: number;
    sugars: number;
    ingredients: {
        es: string;
        en: string;
    }[];
    status: "active" | "inactive" | "coming_soon";
    isFeatured: boolean;
    cost?: number;
    margin?: number;
    vitaminA?: string;
    vitaminC?: string;
    image?: string;
}>;
export declare function updateBoxRuleById(id: string, payload: unknown, context?: CatalogChangeContext): Promise<{
    id: string;
    displayName: string;
    slotBudget: number;
    targetWeightKg: number;
    categoryBudget: Record<string, {
        min: number;
        max: number;
    }>;
    baseContents: {
        productSlug: string;
        quantity: number;
    }[];
    minMargin?: number;
    variantContents?: {
        mix?: {
            productSlug: string;
            quantity: number;
        }[];
        fruity?: {
            productSlug: string;
            quantity: number;
        }[];
        veggie?: {
            productSlug: string;
            quantity: number;
        }[];
    };
}>;
//# sourceMappingURL=service.d.ts.map