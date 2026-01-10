"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
exports.getAdminAllowedEmails = getAdminAllowedEmails;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().default(5000),
    FIREBASE_PROJECT_ID: zod_1.z.string().min(1),
    FIREBASE_CLIENT_EMAIL: zod_1.z.string().email(),
    FIREBASE_PRIVATE_KEY: zod_1.z.string().transform((key) => key.replace(/\\n/g, "\n")),
    FIREBASE_STORAGE_BUCKET: zod_1.z.string().min(1),
    ADMIN_ALLOWED_EMAILS: zod_1.z.string().optional().default(""),
});
let cachedEnv = null;
function getEnv() {
    if (cachedEnv)
        return cachedEnv;
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
        throw new Error("Invalid environment configuration");
    }
    cachedEnv = parsed.data;
    return cachedEnv;
}
function getAdminAllowedEmails() {
    const env = getEnv();
    return env.ADMIN_ALLOWED_EMAILS.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
}
//# sourceMappingURL=env.js.map