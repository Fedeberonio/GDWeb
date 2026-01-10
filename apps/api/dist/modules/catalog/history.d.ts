import { type Timestamp } from "firebase-admin/firestore";
import type { Box, Product } from "./schemas";
export type CatalogEntityType = "product" | "box";
export type CatalogChangeContext = {
    actorEmail?: string | null;
    actorUid?: string | null;
};
export declare function recordCatalogChange(entityType: CatalogEntityType, before: Product | Box, after: Product | Box, context?: CatalogChangeContext): Promise<void>;
export type CatalogChange = {
    id: string;
    entityType: CatalogEntityType;
    entityId: string;
    actorEmail: string | null;
    actorUid: string | null;
    timestamp: Timestamp | null;
    before: Product | Box;
    after: Product | Box;
};
export declare function listCatalogHistory(limit?: number): Promise<CatalogChange[]>;
//# sourceMappingURL=history.d.ts.map