import type { Firestore } from "firebase-admin/firestore";

import { normalizeCatalogProduct } from "./product-normalization";
import type { Product } from "./types";

const PRODUCT_COLLECTION = "catalog_products";

function isInternalIngredientCatalogItem(product: Product) {
  const productKey = (product.sku ?? product.id ?? "").toUpperCase();
  const categoryId = (product.categoryId ?? "").toLowerCase();
  return categoryId === "ingredientes" || productKey.startsWith("GD-ING-") || productKey.startsWith("GD-INGR-");
}

function isBoxCatalogItem(product: Product) {
  const productKey = (product.sku ?? product.id ?? "").toUpperCase();
  const categoryId = (product.categoryId ?? "").toLowerCase();
  return product.type === "box" || categoryId === "cajas" || productKey.startsWith("GD-CAJA-");
}

type BoxVariantLike = {
  id?: string;
  slug?: string;
  name?: { es?: string; en?: string };
  referenceContents?: Array<{
    productId?: string;
    quantity?: number;
  }>;
};

export async function assertValidBoxReferenceProducts(db: Firestore, variants: BoxVariantLike[]) {
  const productIds = Array.from(
    new Set(
      variants.flatMap((variant) =>
        Array.isArray(variant.referenceContents)
          ? variant.referenceContents
              .map((content) => String(content.productId ?? "").trim().toUpperCase())
              .filter(Boolean)
          : [],
      ),
    ),
  );

  if (productIds.length === 0) return;

  const snapshots = await Promise.all(
    productIds.map((productId) => db.collection(PRODUCT_COLLECTION).doc(productId).get()),
  );

  const productMap = new Map(
    snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => [
        snapshot.id.toUpperCase(),
        normalizeCatalogProduct(snapshot.id, (snapshot.data() ?? {}) as Record<string, unknown>),
      ]),
  );

  const issues: string[] = [];

  variants.forEach((variant, variantIndex) => {
    const variantLabel =
      variant.name?.es ??
      variant.name?.en ??
      variant.slug ??
      variant.id ??
      `variante-${variantIndex + 1}`;

    (variant.referenceContents ?? []).forEach((content) => {
      const productId = String(content.productId ?? "").trim().toUpperCase();
      if (!productId) return;

      const product = productMap.get(productId);
      if (!product) {
        issues.push(`Variante ${variantLabel}: producto ${productId} no existe`);
        return;
      }

      if (isBoxCatalogItem(product)) {
        issues.push(`Variante ${variantLabel}: ${productId} es una caja y no puede ser contenido`);
      }

      if (isInternalIngredientCatalogItem(product)) {
        issues.push(`Variante ${variantLabel}: ${productId} es un ingrediente interno`);
      }

      if (product.status && product.status !== "active" && product.status !== "coming_soon") {
        issues.push(`Variante ${variantLabel}: ${productId} esta ${product.status}`);
      }
    });
  });

  if (issues.length > 0) {
    throw new Error(`Datos de caja inválidos: ${issues.join(" | ")}`);
  }
}
