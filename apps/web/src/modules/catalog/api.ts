import { headers } from "next/headers";

import { staticBoxes, staticCategories, staticProducts } from "./static-data";
import type { Box, BoxRule, Product, ProductCategory } from "./types";

function getStaticFallback(path: string) {
  switch (path) {
    case "/catalog/categories":
      return staticCategories;
    case "/catalog/boxes":
      return staticBoxes;
    case "/catalog/products":
      return staticProducts;
    default:
      return null;
  }
}

function getEmptyFallback(path: string) {
  return getStaticFallback(path) ? [] : null;
}

function shouldUseStaticFallback() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return (
    process.env.NODE_ENV !== "production" ||
    apiBase === "" ||
    apiBase.includes("localhost") ||
    apiBase.includes("mock")
  );
}

// Función helper para usar rutas locales de Next.js API
async function fetchLocal<T>(path: string): Promise<T> {
  let baseUrl = "http://localhost:3000";

  if (typeof window !== "undefined") {
    baseUrl = window.location.origin;
  } else {
    // En el servidor, intentamos obtener el host real de los headers
    try {
      const headersList = headers();
      const host = headersList.get("host");
      const protocol = headersList.get("x-forwarded-proto") || "http";
      if (host) baseUrl = `${protocol}://${host}`;
    } catch (error) {
      // Fallback si headers() falla (ej. durante build estático)
      // Usamos VERCEL_URL si existe
      if (process.env.VERCEL_URL) baseUrl = `https://${process.env.VERCEL_URL}`;
    }
  }

  const url = `${baseUrl}/api${path}`;

  const allowStaticFallback = shouldUseStaticFallback();
  const fallback = allowStaticFallback ? getStaticFallback(path) : null;
  const emptyFallback = getEmptyFallback(path);

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    if (fallback !== null) {
      console.warn(`Falling back to static catalog data for ${path}.`, error);
      return fallback as T;
    }
    if (emptyFallback !== null) {
      console.warn(`Catalog API unavailable for ${path}. Returning empty data.`, error);
      return emptyFallback as T;
    }
    throw error;
  }
}

export async function fetchProductCategories() {
  return fetchLocal<ProductCategory[]>("/catalog/categories");
}

export async function fetchBoxes() {
  return fetchLocal<Box[]>("/catalog/boxes");
}

export async function fetchProducts() {
  return fetchLocal<Product[]>("/catalog/products");
}

export async function fetchBoxRules() {
  return fetchLocal<BoxRule[]>("/catalog/box-rules");
}
