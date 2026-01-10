"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicOrdersRouter = createPublicOrdersRouter;
// @ts-nocheck
const express_1 = require("express");
const zod_1 = require("zod");
const nanoid_1 = require("nanoid");
const repository_1 = require("./repository");
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
});
const checkoutPayloadSchema = zod_1.z.object({
    contactName: zod_1.z.string().min(2),
    contactPhone: zod_1.z.string().min(7),
    contactEmail: zod_1.z.string().email().optional(),
    deliveryZone: zod_1.z.string().optional(),
    deliveryDay: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(checkoutItemSchema).nonempty(),
});
function createPublicOrdersRouter() {
    const router = (0, express_1.Router)();
    router.post("/", async (req, res, next) => {
        try {
            const parsed = checkoutPayloadSchema.parse(req.body ?? {});
            const currency = "DOP";
            const items = parsed.items.map((item, index) => ({
                id: `${item.slug}-${index + 1}`,
                type: item.type,
                referenceId: item.slug,
                name: { es: item.name, en: item.name },
                quantity: item.quantity,
                unitPrice: { amount: item.price, currency },
                metadata: item.configuration ? { configuration: item.configuration, image: item.image } : { image: item.image },
            }));
            const subtotal = items.reduce((sum, item) => sum + item.unitPrice.amount * item.quantity, 0);
            const deliveryFee = 0;
            const total = subtotal + deliveryFee;
            const order = await (0, repository_1.createOrder)({
                id: (0, nanoid_1.nanoid)(12),
                items,
                totals: {
                    subtotal: { amount: subtotal, currency },
                    total: { amount: total, currency },
                },
                status: "pending",
                delivery: {
                    address: {
                        id: "checkout",
                        label: parsed.deliveryZone || "por-definir",
                        contactName: parsed.contactName,
                        phone: parsed.contactPhone,
                        city: "RD",
                        zone: parsed.deliveryZone || "por-definir",
                        notes: parsed.notes,
                        isDefault: false,
                    },
                    window: parsed.deliveryDay ? { day: parsed.deliveryDay } : undefined,
                    notes: parsed.notes,
                },
                payment: {
                    method: "cash",
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
// @ts-nocheck
//# sourceMappingURL=public-routes.js.map