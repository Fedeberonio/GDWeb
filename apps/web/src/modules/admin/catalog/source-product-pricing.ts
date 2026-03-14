import { adminFetch } from "@/modules/admin/api/client";
import type { Product } from "@/modules/catalog/types";

type SourceProductPricingPatch = {
  wholesaleCost?: number;
  price?: number;
  salePrice?: number | null;
};

export function getEffectiveSaleSourceField(product: Product): "price" | "salePrice" {
  return typeof product.salePrice === "number" && Number.isFinite(product.salePrice) ? "salePrice" : "price";
}

export function getEffectiveSaleSourceLabel(product: Product): string {
  return getEffectiveSaleSourceField(product) === "salePrice" ? "precio promocional" : "precio regular";
}

export function replaceCatalogProduct(products: Product[], updatedProduct: Product): Product[] {
  const updatedSku = updatedProduct.sku ?? updatedProduct.id;

  return products.map((product) => {
    const productSku = product.sku ?? product.id;
    if (product.id === updatedProduct.id || productSku === updatedSku) {
      return updatedProduct;
    }
    return product;
  });
}

export async function persistSourceProductPricing(
  product: Product,
  patch: SourceProductPricingPatch,
): Promise<Product> {
  const payload: Record<string, unknown> = {};

  if (patch.price !== undefined) {
    payload.price = patch.price;
  }

  if ("salePrice" in patch) {
    payload.salePrice = patch.salePrice ?? null;
  }

  if (patch.wholesaleCost !== undefined) {
    payload.metadata = {
      ...(product.metadata ?? {}),
      wholesaleCost: patch.wholesaleCost,
    };
  }

  const response = await adminFetch(`/api/admin/catalog/products/${encodeURIComponent(product.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "No se pudo actualizar el producto fuente.");
  }

  const json = await response.json();
  return json.data as Product;
}

export async function persistSourceProductEffectiveSalePrice(
  product: Product,
  nextSalePrice: number,
): Promise<Product> {
  const saleField = getEffectiveSaleSourceField(product);
  return persistSourceProductPricing(
    product,
    saleField === "salePrice" ? { salePrice: nextSalePrice } : { price: nextSalePrice },
  );
}
