"use client";

import { getFirebaseAuth } from "@/lib/firebase";

export async function getCurrentIdToken(forceRefresh = false): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Debes iniciar sesión para continuar");
  }
  return user.getIdToken(forceRefresh);
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
