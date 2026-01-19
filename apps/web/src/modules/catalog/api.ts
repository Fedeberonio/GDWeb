import { getApiBaseUrl } from "@/lib/config/env";
import type { Box, BoxRule, Product, ProductCategory } from "./types";

const DEFAULT_REVALIDATE_SECONDS = 30;

type CatalogRequestInit = RequestInit & {
  next?: {
    revalidate?: number | false;
  };
};

async function fetchRemote<T>(path: string): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    console.warn("Catalog API base URL is not configured.");
    return [] as unknown as T;
  }

  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(
      url,
      {
        cache: "force-cache",
        next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
      } satisfies CatalogRequestInit,
    );

    if (!response.ok) {
      console.warn(`Catalog API error for ${path}: ${response.status}`);
      return [] as unknown as T;
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.warn(`Catalog API failed for ${path}`, error);
    return [] as unknown as T;
  }
}

export async function fetchProductCategories() {
  return fetchRemote<ProductCategory[]>("/catalog/categories");
}

export async function fetchBoxes() {
  return fetchRemote<Box[]>("/catalog/boxes");
}

export async function fetchProducts() {
  return fetchRemote<Product[]>("/catalog/products");
}

export async function fetchBoxRules() {
  return fetchRemote<BoxRule[]>("/catalog/box-rules");
}
