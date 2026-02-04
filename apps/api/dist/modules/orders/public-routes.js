"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicOrdersRouter = createPublicOrdersRouter;
const express_1 = require("express");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const repository_1 = require("./repository");
function generateId(length = 12) {
    return crypto_1.default.randomUUID().replace(/-/g, "").slice(0, length);
}
const boxConfigurationSchema = zod_1.z.object({
    boxId: zod_1.z.string().min(1),
    mix: zod_1.z.enum(["mix", "frutas", "vegetales"]).optional(),
    variant: zod_1.z.enum(["mix", "fruity", "veggie"]).optional(),
    selectedProducts: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number().int().nonnegative()).default({}),
    likes: zod_1.z.array(zod_1.z.string()).default([]),
    dislikes: zod_1.z.array(zod_1.z.string()).default([]),
    notes: zod_1.z.string().optional(),
    deliveryZone: zod_1.z.string().optional(),
    deliveryDay: zod_1.z.string().optional(),
    contactName: zod_1.z.string().optional(),
    contactPhone: zod_1.z.string().optional(),
    contactEmail: zod_1.z.string().email().optional(),
    price: zod_1.z.object({
        base: zod_1.z.number().nonnegative(),
        extras: zod_1.z.number().nonnegative(),
        final: zod_1.z.number().nonnegative(),
        isACarta: zod_1.z.boolean(),
    }),
});
const checkoutItemSchema = zod_1.z.object({
    type: zod_1.z.enum(["product", "box"]),
    slug: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().positive(),
    price: zod_1.z.number().nonnegative(), // precio final unitario mostrado al cliente
    image: zod_1.z.string().optional(),
    configuration: boxConfigurationSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
const checkoutPayloadSchema = zod_1.z.object({
    contactName: zod_1.z.string().min(2),
    contactPhone: zod_1.z.string().min(7),
    contactEmail: zod_1.z.string().email().optional(),
    address: zod_1.z.string().optional(),
    deliveryZone: zod_1.z.string().optional(),
    deliveryDay: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.enum(["cash", "transfer", "card", "online"]).optional(),
    items: zod_1.z.array(checkoutItemSchema).nonempty(),
});
function createPublicOrdersRouter() {
    const router = (0, express_1.Router)();
    router.post("/", async (req, res, next) => {
        try {
            const parsed = checkoutPayloadSchema.parse(req.body ?? {});
            const currency = "DOP";
            const items = parsed.items.map((item, index) => {
                const metadata = {
                    ...(item.metadata ?? {}),
                    ...(item.configuration ? { configuration: item.configuration } : {}),
                    ...(item.image ? { image: item.image } : {}),
                };
                return {
                    id: `${item.slug}-${index + 1}`,
                    type: item.type,
                    referenceId: item.slug,
                    name: { es: item.name, en: item.name },
                    quantity: item.quantity,
                    unitPrice: { amount: item.price, currency },
                    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                };
            });
            const subtotal = items.reduce((sum, item) => sum + item.unitPrice.amount * item.quantity, 0);
            const deliveryFee = 0;
            const total = subtotal + deliveryFee;
            const addressLabel = parsed.address || parsed.deliveryZone || "por-definir";
            const order = await (0, repository_1.createOrder)({
                id: generateId(12),
                items,
                totals: {
                    subtotal: { amount: subtotal, currency },
                    total: { amount: total, currency },
                },
                status: "pending",
                delivery: {
                    address: {
                        id: "checkout",
                        label: addressLabel,
                        contactName: parsed.contactName,
                        phone: parsed.contactPhone,
                        city: "RD",
                        zone: parsed.deliveryZone || addressLabel,
                        notes: parsed.notes,
                        isDefault: false,
                    },
                    window: parsed.deliveryDay ? { day: parsed.deliveryDay } : undefined,
                    notes: parsed.notes,
                },
                payment: {
                    method: parsed.paymentMethod ?? "cash",
                    status: "pending",
                },
                guestEmail: parsed.contactEmail,
            });
            res.status(201).json({ data: order });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: "Solicitud inválida", details: error.flatten() });
                return;
            }
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=public-routes.js.map