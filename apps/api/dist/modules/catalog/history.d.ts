import { type Timestamp } from "firebase-admin/firestore";
import type { Box, BoxRule, Combo, Product } from "./schemas";
export type CatalogEntityType = "product" | "box" | "box_rule" | "combo";
export type CatalogChangeContext = {
    actorEmail?: string | null;
    actorUid?: string | null;
};
export declare function recordCatalogChange(entityType: CatalogEntityType, before: Product | Box | BoxRule | Combo, after: Product | Box | BoxRule | Combo, context?: CatalogChangeContext): Promise<void>;
export type CatalogChange = {
    id: string;
    entityType: CatalogEntityType;
    entityId: string;
    actorEmail: string | null;
    actorUid: string | null;
    timestamp: Timestamp | null;
    before: Product | Box | BoxRule | Combo;
    after: Product | Box | BoxRule | Combo;
};
export declare function listCatalogHistory(limit?: number): Promise<CatalogChange[]>;
//# sourceMappingURL=history.d.ts.map