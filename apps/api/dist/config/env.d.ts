import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    FIREBASE_PROJECT_ID: z.ZodString;
    FIREBASE_CLIENT_EMAIL: z.ZodString;
    FIREBASE_PRIVATE_KEY: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    FIREBASE_STORAGE_BUCKET: z.ZodString;
    ADMIN_ALLOWED_EMAILS: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type AppEnv = z.infer<typeof envSchema>;
export declare function getEnv(): AppEnv;
export declare function getAdminAllowedEmails(): string[];
export {};
//# sourceMappingURL=env.d.ts.map