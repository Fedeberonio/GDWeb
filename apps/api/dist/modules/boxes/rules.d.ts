export type CategoryBudget = {
    min: number;
    max: number;
};
export type BoxRule = {
    displayName: string;
    slotBudget: number;
    targetWeightKg: number;
    minMargin: number;
    categoryBudget: Record<string, CategoryBudget>;
    baseContents: Array<{
        productSlug: string;
        quantity: number;
    }>;
};
export declare function getBoxRules(): Record<string, BoxRule>;
export declare function getRuleForBox(boxId: string): BoxRule | undefined;
//# sourceMappingURL=rules.d.ts.map