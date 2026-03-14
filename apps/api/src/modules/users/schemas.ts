import { z } from "zod";
import { localeSchema } from "../catalog/schemas";

export const addressSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  contactName: z.string().min(1),
  phone: z.string().min(5),
  city: z.string().min(1),
  zone: z.string().min(1),
  notes: z.string().optional(),
  isDefault: z.boolean().default(false),
  location: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
});

export const userPreferencesSchema = z.object({
  language: localeSchema.default("es"),
  boxDefaults: z
    .object({
      variant: z.string().optional(),
      likes: z.array(z.string()).default([]),
      dislikes: z.array(z.string()).default([]),
    })
    .optional(),
  favoriteProducts: z.array(z.string()).default([]),
  notifications: z
    .object({
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(true),
      sms: z.boolean().default(false),
    })
    .optional(),
});

export const userProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
  phone: z.string().optional(),
  language: localeSchema.default("es"),
  addresses: z.array(addressSchema).default([]),
  preferences: userPreferencesSchema.optional(),
  lastCartId: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).default(new Date().toISOString()),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type Address = z.infer<typeof addressSchema>;
