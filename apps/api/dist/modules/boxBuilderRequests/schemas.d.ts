import { z } from "zod";
export declare const requestStatusSchema: z.ZodEnum<{
    pending: "pending";
    confirmed: "confirmed";
    cancelled: "cancelled";
}>;
export declare const builderRequestMetricsSchema: z.ZodObject<{
    slotsUsed: z.ZodNumber;
    slotBudget: z.ZodOptional<z.ZodNumber>;
    weightUsedKg: z.ZodNumber;
    targetWeightKg: z.ZodOptional<z.ZodNumber>;
    costEstimate: z.ZodNumber;
    productCount: z.ZodNumber;
}, z.core.$strip>;
export declare const boxBuilderRequestSchema: z.ZodObject<{
    id: z.ZodString;
    boxId: z.ZodString;
    contactName: z.ZodString;
    contactEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contactPhone: z.ZodString;
    deliveryZone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    deliveryDay: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    mix: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        mix: "mix";
        frutas: "frutas";
        vegetales: "vegetales";
    }>>>;
    likes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    dislikes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    selection: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodCoercedNumber<unknown>>>;
    metrics: z.ZodObject<{
        slotsUsed: z.ZodNumber;
        slotBudget: z.ZodOptional<z.ZodNumber>;
        weightUsedKg: z.ZodNumber;
        targetWeightKg: z.ZodOptional<z.ZodNumber>;
        costEstimate: z.ZodNumber;
        productCount: z.ZodNumber;
    }, z.core.$strip>;
    status: z.ZodEnum<{
        pending: "pending";
        confirmed: "confirmed";
        cancelled: "cancelled";
    }>;
    createdAt: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>>;
}, z.core.$strip>;
export type BoxBuilderRequest = z.infer<typeof boxBuilderRequestSchema>;
//# sourceMappingURL=schemas.d.ts.map