import { headers } from "next/headers";
import type { Box, Product, ProductCategory } from "./types";

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

  const response = await fetch(url, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
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
