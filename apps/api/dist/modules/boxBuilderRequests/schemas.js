"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boxBuilderRequestSchema = exports.builderRequestMetricsSchema = exports.requestStatusSchema = void 0;
// @ts-nocheck
const zod_1 = require("zod");
exports.requestStatusSchema = zod_1.z.enum(["pending", "confirmed", "cancelled"]);
exports.builderRequestMetricsSchema = zod_1.z.object({
    slotsUsed: zod_1.z.number().nonnegative(),
    slotBudget: zod_1.z.number().nonnegative().optional(),
    weightUsedKg: zod_1.z.number().nonnegative(),
    targetWeightKg: zod_1.z.number().nonnegative().optional(),
    costEstimate: zod_1.z.number().nonnegative(),
    productCount: zod_1.z.number().int().nonnegative(),
});
exports.boxBuilderRequestSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    boxId: zod_1.z.string().min(1),
    contactName: zod_1.z.string().min(3),
    contactEmail: zod_1.z.string().email().nullable().optional(),
    contactPhone: zod_1.z.string().min(7),
    deliveryZone: zod_1.z.string().nullable().optional(),
    deliveryDay: zod_1.z.string().nullable().optional(),
    mix: zod_1.z.enum(["mix", "frutas", "vegetales"]).nullable().optional(),
    likes: zod_1.z.array(zod_1.z.string()).default([]),
    dislikes: zod_1.z.array(zod_1.z.string()).default([]),
    notes: zod_1.z.string().optional().nullable(),
    selection: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number().nonnegative()).default({}),
    metrics: exports.builderRequestMetricsSchema,
    status: exports.requestStatusSchema,
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
});
// @ts-nocheck
//# sourceMappingURL=schemas.js.map