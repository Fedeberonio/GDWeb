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
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
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
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
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
    heroImage?: string;
}[]>;
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
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
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
    nutrition?: {
        vegan?: boolean;
        glutenFree?: boolean;
        organic?: boolean;
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
//# sourceMappingURL=service.d.ts.map