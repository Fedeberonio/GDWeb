"use client";

import { onAuthStateChanged } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase";

import type { ApiErrorResponse, ApiResponse } from "./types";
import { getApiBaseUrl } from "../config/env";

const API_BASE_URL = getApiBaseUrl().replace(/\/$/, "");
const AUTH_INIT_TIMEOUT_MS = 5000;

type FetchOptions = RequestInit & {
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export async function getCurrentIdToken(forceRefresh = false): Promise<string> {
  const auth = getFirebaseAuth();

  if (typeof (auth as { authStateReady?: () => Promise<void> }).authStateReady === "function") {
    await (auth as { authStateReady: () => Promise<void> }).authStateReady();
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    return currentUser.getIdToken(forceRefresh);
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        try {
          resolve(await user.getIdToken(forceRefresh));
        } catch (error) {
          reject(error instanceof Error ? error : new Error("No se pudo obtener el token"));
        }
        return;
      }
      reject(new Error("Debes iniciar sesión para continuar"));
    });

    setTimeout(() => {
      unsubscribe();
      reject(new Error("Sesión expirada o no iniciada"));
    }, AUTH_INIT_TIMEOUT_MS);
  });
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { headers, cache, next, ...rest } = options;
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    cache,
    next,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    let errorBody: ApiErrorResponse | null = null;
    try {
      errorBody = (await response.json()) as ApiErrorResponse;
    } catch {
      // ignore parse error
    }

    const message = errorBody?.error ?? `API request failed with status ${response.status}`;
    throw new Error(message);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}
