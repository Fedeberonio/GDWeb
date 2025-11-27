import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

import { getEnv } from "./config/env";

let appInstance: App | undefined;

export function initializeFirebaseAdmin(): App {
  if (appInstance) return appInstance;

  const env = getEnv();

  const existingApp = getApps()[0];
  appInstance =
    existingApp ??
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });

  return appInstance!;
}

export function getAdminAuth() {
  return getAuth(initializeFirebaseAdmin());
}

export function getAdminStorageBucket() {
  return getStorage(initializeFirebaseAdmin()).bucket();
}
