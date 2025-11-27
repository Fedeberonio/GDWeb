// @ts-nocheck
import { z } from "zod";

export const requestStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);

export const builderRequestMetricsSchema = z.object({
  slotsUsed: z.number().nonnegative(),
  slotBudget: z.number().nonnegative().optional(),
  weightUsedKg: z.number().nonnegative(),
  targetWeightKg: z.number().nonnegative().optional(),
  costEstimate: z.number().nonnegative(),
  productCount: z.number().int().nonnegative(),
});

export const boxBuilderRequestSchema = z.object({
  id: z.string().min(1),
  boxId: z.string().min(1),
  contactName: z.string().min(3),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().min(7),
  deliveryZone: z.string().nullable().optional(),
  deliveryDay: z.string().nullable().optional(),
  mix: z.enum(["mix", "frutas", "vegetales"]).nullable().optional(),
  likes: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  selection: z.record(z.string(), z.coerce.number().nonnegative()).default({}),
  metrics: builderRequestMetricsSchema,
  status: requestStatusSchema,
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export type BoxBuilderRequest = z.infer<typeof boxBuilderRequestSchema>;
// @ts-nocheck
