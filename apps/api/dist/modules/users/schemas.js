"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProfileSchema = exports.userPreferencesSchema = exports.addressSchema = void 0;
const zod_1 = require("zod");
const schemas_1 = require("../catalog/schemas");
exports.addressSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    contactName: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(5),
    city: zod_1.z.string().min(1),
    zone: zod_1.z.string().min(1),
    notes: zod_1.z.string().optional(),
    isDefault: zod_1.z.boolean().default(false),
    location: zod_1.z
        .object({
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
    })
        .optional(),
});
exports.userPreferencesSchema = zod_1.z.object({
    language: schemas_1.localeSchema.default("es"),
    boxDefaults: zod_1.z
        .object({
        variant: zod_1.z.string().optional(),
        likes: zod_1.z.array(zod_1.z.string()).default([]),
        dislikes: zod_1.z.array(zod_1.z.string()).default([]),
    })
        .optional(),
    favoriteProducts: zod_1.z.array(zod_1.z.string()).default([]),
    notifications: zod_1.z
        .object({
        email: zod_1.z.boolean().default(true),
        whatsapp: zod_1.z.boolean().default(true),
        sms: zod_1.z.boolean().default(false),
    })
        .optional(),
});
exports.userProfileSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().min(1),
    photoURL: zod_1.z.string().url().optional(),
    phone: zod_1.z.string().optional(),
    language: schemas_1.localeSchema.default("es"),
    addresses: zod_1.z.array(exports.addressSchema).default([]),
    preferences: exports.userPreferencesSchema.optional(),
    lastCartId: zod_1.z.string().optional(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).default(new Date().toISOString()),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
});
//# sourceMappingURL=schemas.js.map