import type { Box, Product, ProductCategory } from "./schemas";
export declare function listCategories(): Promise<ProductCategory[]>;
export declare function listProducts(): Promise<Product[]>;
export declare function listAllProducts(): Promise<Product[]>;
export declare function getProductById(id: string): Promise<Product | null>;
export declare function saveProduct(product: Product): Promise<void>;
export declare function listBoxes(): Promise<Box[]>;
export declare function listAllBoxes(): Promise<Box[]>;
export declare function getBoxById(id: string): Promise<Box | null>;
export declare function saveBox(box: Box): Promise<void>;
export declare const catalogCollections: {
    categories: string;
    products: string;
    boxes: string;
};
//# sourceMappingURL=repository.d.ts.map