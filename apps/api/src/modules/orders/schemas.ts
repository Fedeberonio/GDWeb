// @ts-nocheck
import { z } from "zod";
import { addressSchema } from "../users/schemas";
import { localizedStringSchema, priceSchema } from "../catalog/schemas";

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const orderItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["product", "box", "addon"]),
  referenceId: z.string().min(1),
  name: localizedStringSchema,
  quantity: z.number().int().positive().default(1),
  unitPrice: priceSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const orderTotalsSchema = z.object({
  subtotal: priceSchema,
  deliveryFee: priceSchema.optional(),
  discounts: priceSchema.optional(),
  total: priceSchema,
});

export const deliveryWindowSchema = z.object({
  day: z.string().min(1),
  slot: z.string().optional(),
});

export const paymentDetailsSchema = z.object({
  method: z.enum(["cash", "transfer", "card", "online"]),
  status: z.enum(["pending", "paid", "refunded", "cancelled"]).default("pending"),
  transactionId: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().optional(),
  guestEmail: z.string().email().optional(),
  items: z.array(orderItemSchema).nonempty(),
  totals: orderTotalsSchema,
  status: orderStatusSchema.default("pending"),
  delivery: z.object({
    address: addressSchema,
    window: deliveryWindowSchema.optional(),
    notes: z.string().optional(),
  }),
  payment: paymentDetailsSchema,
  createdAt: z.union([z.string(), z.date()]).default(new Date().toISOString()),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  whatsappMessageId: z.string().optional(),
});

export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
// @ts-nocheck
