"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderSchema = exports.paymentDetailsSchema = exports.deliveryWindowSchema = exports.orderTotalsSchema = exports.orderItemSchema = exports.orderStatusSchema = void 0;
// @ts-nocheck
const zod_1 = require("zod");
const schemas_1 = require("../users/schemas");
const schemas_2 = require("../catalog/schemas");
exports.orderStatusSchema = zod_1.z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "in_transit",
    "delivered",
    "cancelled",
]);
exports.orderItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: zod_1.z.enum(["product", "box", "addon"]),
    referenceId: zod_1.z.string().min(1),
    name: schemas_2.localizedStringSchema,
    quantity: zod_1.z.number().int().positive().default(1),
    unitPrice: schemas_2.priceSchema,
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.orderTotalsSchema = zod_1.z.object({
    subtotal: schemas_2.priceSchema,
    deliveryFee: schemas_2.priceSchema.optional(),
    discounts: schemas_2.priceSchema.optional(),
    total: schemas_2.priceSchema,
});
exports.deliveryWindowSchema = zod_1.z.object({
    day: zod_1.z.string().min(1),
    slot: zod_1.z.string().optional(),
});
exports.paymentDetailsSchema = zod_1.z.object({
    method: zod_1.z.enum(["cash", "transfer", "card", "online"]),
    status: zod_1.z.enum(["pending", "paid", "refunded", "cancelled"]).default("pending"),
    transactionId: zod_1.z.string().optional(),
});
exports.orderSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    userId: zod_1.z.string().optional(),
    guestEmail: zod_1.z.string().email().optional(),
    items: zod_1.z.array(exports.orderItemSchema).nonempty(),
    totals: exports.orderTotalsSchema,
    status: exports.orderStatusSchema.default("pending"),
    delivery: zod_1.z.object({
        address: schemas_1.addressSchema,
        window: exports.deliveryWindowSchema.optional(),
        notes: zod_1.z.string().optional(),
    }),
    payment: exports.paymentDetailsSchema,
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).default(new Date().toISOString()),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
    whatsappMessageId: zod_1.z.string().optional(),
});
// @ts-nocheck
//# sourceMappingURL=schemas.js.map