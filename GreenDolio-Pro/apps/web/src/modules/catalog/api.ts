import type { Box, Product, ProductCategory } from "./types";

// Función helper para usar rutas locales de Next.js API
async function fetchLocal<T>(path: string): Promise<T> {
  // En el servidor de Next.js, podemos usar fetch con URL absoluta o relativa
  // Usamos URL absoluta para evitar problemas con baseUrl
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://greendolio.shop";

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
