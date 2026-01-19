import type { Box, BoxRule, Product, ProductCategory, Combo } from "./schemas";
export declare function listCategories(): Promise<ProductCategory[]>;
export declare function listProducts(): Promise<Product[]>;
export declare function listAllProducts(): Promise<Product[]>;
export declare function getProductById(id: string): Promise<Product | null>;
export declare function saveProduct(product: Product): Promise<void>;
export declare function listBoxes(): Promise<Box[]>;
export declare function listAllBoxes(): Promise<Box[]>;
export declare function getBoxById(id: string): Promise<Box | null>;
export declare function saveBox(box: Box): Promise<void>;
export declare function listBoxRules(): Promise<BoxRule[]>;
export declare function getBoxRuleById(id: string): Promise<BoxRule | null>;
export declare function saveBoxRule(rule: BoxRule): Promise<void>;
export declare function listCombos(): Promise<Combo[]>;
export declare function listAllCombos(): Promise<Combo[]>;
export declare function getComboById(id: string): Promise<Combo | null>;
export declare function saveCombo(combo: Combo): Promise<void>;
export declare const catalogCollections: {
    categories: string;
    products: string;
    boxes: string;
    boxRules: string;
    combos: string;
};
//# sourceMappingURL=repository.d.ts.map