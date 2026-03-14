import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

export type ClientEnv = z.infer<typeof envSchema>;

let cachedEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (cachedEnv) return cachedEnv;

  const runtimeEnv = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } satisfies Partial<ClientEnv>;

  const parsed = envSchema.safeParse(runtimeEnv);

  if (!parsed.success) {
    const details = JSON.stringify(parsed.error.flatten().fieldErrors);
    throw new Error(`ENV VALIDATION FAILED: ${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getApiBaseUrl(): string {
  return getClientEnv().NEXT_PUBLIC_API_BASE_URL;
}

const DEFAULT_ADMIN_EMAIL = "greendolioexpress@gmail.com";

export function getAdminAllowedEmails(): string[] {
  const emails = process.env.ADMIN_ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS ?? "";
  const list = emails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Si no hay emails en env, usar el default
  if (list.length === 0) {
    return [DEFAULT_ADMIN_EMAIL.toLowerCase()];
  }

  // Asegurar que el email default siempre esté incluido
  const normalizedDefault = DEFAULT_ADMIN_EMAIL.toLowerCase();
  if (!list.includes(normalizedDefault)) {
    list.push(normalizedDefault);
  }

  return list;
}
