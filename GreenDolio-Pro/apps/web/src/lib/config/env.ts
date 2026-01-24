import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .default("https://api.greendolio.shop/api"),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS: z.string().optional().default(""),
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
    NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS: process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS,
  } satisfies Partial<ClientEnv>;

  const parsed = envSchema.safeParse(runtimeEnv);

  if (!parsed.success) {
    const details = JSON.stringify(parsed.error.flatten().fieldErrors);
    throw new Error(`Client environment variables misconfigured: ${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getApiBaseUrl(): string {
  return getClientEnv().NEXT_PUBLIC_API_BASE_URL;
}

export function getAdminAllowedEmails(): string[] {
  const env = getClientEnv();
  return env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
