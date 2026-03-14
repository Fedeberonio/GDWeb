"use client";

import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const AUTH_TIMEOUT_MS = 5000;

export async function getCurrentIdToken(forceRefresh = false): Promise<string> {
  const auth = getFirebaseAuth();

  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    return currentUser.getIdToken(forceRefresh);
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      unsubscribe();
      reject(new Error("Sesión expirada o no iniciada"));
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      window.clearTimeout(timeoutId);
      unsubscribe();
      if (user) {
        resolve(await user.getIdToken(forceRefresh));
      } else {
        reject(new Error("Debes iniciar sesión para continuar"));
      }
    });
  });
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getCurrentIdToken();
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
