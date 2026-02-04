import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";

import { createOrder } from "./repository";
import type { OrderItem } from "./schemas";

function generateId(length = 12): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, length);
}

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
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const checkoutPayloadSchema = z.object({
  contactName: z.string().min(2),
  contactPhone: z.string().min(7),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
  deliveryZone: z.string().optional(),
  deliveryDay: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash", "transfer", "card", "online"]).optional(),
  items: z.array(checkoutItemSchema).nonempty(),
});

export function createPublicOrdersRouter() {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const parsed = checkoutPayloadSchema.parse(req.body ?? {});

      const currency = "DOP";
      const items: OrderItem[] = parsed.items.map((item, index) => {
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
      const order = await createOrder({
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
