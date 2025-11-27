// @ts-nocheck
import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";

import { createOrder } from "./repository";
import type { OrderItem } from "./schemas";

const boxConfigurationSchema = z.object({
  boxId: z.string().min(1),
  mix: z.enum(["mix", "frutas", "vegetales"]).optional(),
  variant: z.enum(["mix", "fruity", "veggie"]).optional(),
  selectedProducts: z.record(z.string(), z.coerce.number().int().nonnegative()).default({}),
  likes: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
  notes: z.string().optional(),
  deliveryZone: z.string().optional(),
  deliveryDay: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  price: z.object({
    base: z.number().nonnegative(),
    extras: z.number().nonnegative(),
    final: z.number().nonnegative(),
    isACarta: z.boolean(),
  }),
});

const checkoutItemSchema = z.object({
  type: z.enum(["product", "box"]),
  slug: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(), // precio final unitario mostrado al cliente
  image: z.string().optional(),
  configuration: boxConfigurationSchema.optional(),
});

const checkoutPayloadSchema = z.object({
  contactName: z.string().min(2),
  contactPhone: z.string().min(7),
  contactEmail: z.string().email().optional(),
  deliveryZone: z.string().optional(),
  deliveryDay: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(checkoutItemSchema).nonempty(),
});

export function createPublicOrdersRouter() {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const parsed = checkoutPayloadSchema.parse(req.body ?? {});

      const currency = "DOP";
      const items: OrderItem[] = parsed.items.map((item, index) => ({
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

      const order = await createOrder({
        id: nanoid(12),
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Solicitud inválida", details: error.flatten() });
        return;
      }
      next(error);
    }
  });

  return router;
}
// @ts-nocheck
