import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().transform((key) => key.replace(/\\n/g, "\n")),
  FIREBASE_STORAGE_BUCKET: z.string().min(1),
  ADMIN_ALLOWED_EMAILS: z.string().optional().default(""),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment variables",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment configuration");
  }

cachedEnv = parsed.data;
  return cachedEnv;
}

export function getAdminAllowedEmails(): string[] {
  const env = getEnv();
  return env.ADMIN_ALLOWED_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
