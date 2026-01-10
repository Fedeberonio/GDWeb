import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getStorage, type FirebaseStorage } from "firebase/storage";

import { getClientEnv } from "../config/env";

let clientApp: FirebaseApp | undefined;
let storageInstance: FirebaseStorage | undefined;

function getFirebaseConfig() {
  const env = getClientEnv();
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (clientApp) return clientApp;
  if (getApps().length) {
    clientApp = getApps()[0];
  } else {
    const firebaseConfig = getFirebaseConfig();
    clientApp = initializeApp(firebaseConfig);
  }
  return clientApp;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export const googleAuthProvider = new GoogleAuthProvider();

export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  const isSupported = await isAnalyticsSupported();
  return isSupported ? getAnalytics(getFirebaseApp()) : null;
}

export function getFirebaseStorage() {
  if (storageInstance) return storageInstance;
  storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}
