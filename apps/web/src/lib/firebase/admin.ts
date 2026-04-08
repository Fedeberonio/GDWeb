import fs from "fs";
import path from "path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

const BLOCKED_FIREBASE_PROJECT_IDS = new Set(["greendolio-tienda"]);

function assertFirebaseProjectAllowed(projectId: string | undefined) {
  const normalized = String(projectId ?? "").trim();
  if (!normalized) return;

  // Prevent accidental writes to the legacy production project unless explicitly allowed.
  const allowProd = String(process.env.ALLOW_PROD_FIREBASE ?? "").trim() === "1";
  if (!allowProd && BLOCKED_FIREBASE_PROJECT_IDS.has(normalized)) {
    throw new Error(
      `Refusing to use Firebase project "${normalized}". Set ALLOW_PROD_FIREBASE=1 to override (dangerous).`,
    );
  }
}

function loadServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inlineJson) {
    const parsed = JSON.parse(inlineJson) as Record<string, string>;
    return assertProjectAlignment(parsed);
  }

  const candidates = [
    path.join(process.cwd(), "service-account.json"),
    path.join(process.cwd(), "apps/web/service-account.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const parsed = JSON.parse(fs.readFileSync(candidate, "utf8")) as Record<string, string>;
      return assertProjectAlignment(parsed);
    }
  }

  throw new Error("Missing Firebase service account credentials");
}

function assertProjectAlignment(serviceAccount: Record<string, string>) {
  const expectedProjectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!expectedProjectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID/NEXT_PUBLIC_FIREBASE_PROJECT_ID for admin alignment");
  }

  const serviceProjectId = serviceAccount.project_id;
  if (serviceProjectId && serviceProjectId !== expectedProjectId) {
    throw new Error(
      `Firebase service account project_id (${serviceProjectId}) does not match expected (${expectedProjectId})`,
    );
  }

  assertFirebaseProjectAllowed(serviceProjectId ?? expectedProjectId);
  return serviceAccount;
}

export function getAdminFirestore() {
  if (!adminApp) {
    const serviceAccount = loadServiceAccount();
    adminApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore(adminApp);
}

export function getAdminAuth() {
  if (!adminApp) {
    const serviceAccount = loadServiceAccount();
    adminApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  }
  return getAuth(adminApp);
}
