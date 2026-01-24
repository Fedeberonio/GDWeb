import type { Box, Product, ProductCategory } from "./types";
import { MOCK_BOXES, MOCK_CATEGORIES, MOCK_PRODUCTS } from "./mock-data";

// Función helper para usar rutas locales de Next.js API
async function fetchLocal<T>(path: string, fallback: T): Promise<T> {
  // En el servidor de Next.js, podemos usar fetch con URL absoluta o relativa
  // Usamos URL absoluta para evitar problemas con baseUrl
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://greendolio.shop";

  const url = `${baseUrl}/api${path}`;

  try {
    const response = await fetch(url, {
      cache: "force-cache",
      next: { revalidate: 60 } // Revalidate every minute
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${path}: ${response.statusText}`);
      return fallback;
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return fallback;
  }
}

export async function fetchProductCategories() {
  return fetchLocal<ProductCategory[]>("/catalog/categories", MOCK_CATEGORIES);
}

export async function fetchBoxes() {
  return fetchLocal<Box[]>("/catalog/boxes", MOCK_BOXES);
}

export async function fetchProducts() {
  return fetchLocal<Product[]>("/catalog/products", MOCK_PRODUCTS);
}
