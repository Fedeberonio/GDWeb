import { z } from "zod";
export declare const addressSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    contactName: z.ZodString;
    phone: z.ZodString;
    city: z.ZodString;
    zone: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    location: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const userPreferencesSchema: z.ZodObject<{
    language: z.ZodDefault<z.ZodEnum<{
        es: "es";
        en: "en";
    }>>;
    boxDefaults: z.ZodOptional<z.ZodObject<{
        variant: z.ZodOptional<z.ZodString>;
        likes: z.ZodDefault<z.ZodArray<z.ZodString>>;
        dislikes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    favoriteProducts: z.ZodDefault<z.ZodArray<z.ZodString>>;
    notifications: z.ZodOptional<z.ZodObject<{
        email: z.ZodDefault<z.ZodBoolean>;
        whatsapp: z.ZodDefault<z.ZodBoolean>;
        sms: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const userProfileSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodString;
    photoURL: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodEnum<{
        es: "es";
        en: "en";
    }>>;
    addresses: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        contactName: z.ZodString;
        phone: z.ZodString;
        city: z.ZodString;
        zone: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
        isDefault: z.ZodDefault<z.ZodBoolean>;
        location: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodOptional<z.ZodNumber>;
            longitude: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodDefault<z.ZodEnum<{
            es: "es";
            en: "en";
        }>>;
        boxDefaults: z.ZodOptional<z.ZodObject<{
            variant: z.ZodOptional<z.ZodString>;
            likes: z.ZodDefault<z.ZodArray<z.ZodString>>;
            dislikes: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        favoriteProducts: z.ZodDefault<z.ZodArray<z.ZodString>>;
        notifications: z.ZodOptional<z.ZodObject<{
            email: z.ZodDefault<z.ZodBoolean>;
            whatsapp: z.ZodDefault<z.ZodBoolean>;
            sms: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    lastCartId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>>;
    updatedAt: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>>;
}, z.core.$strip>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type Address = z.infer<typeof addressSchema>;
//# sourceMappingURL=schemas.d.ts.map