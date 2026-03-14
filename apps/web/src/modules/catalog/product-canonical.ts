import type { Product } from "./types";

export function normalizeCatalogSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getCatalogDuplicateKey(product: Product): string {
  return normalizeCatalogSearch(product.name.es || product.name.en || product.sku || product.id);
}

function getProductStatusRank(product: Product): number {
  switch (product.status) {
    case "active":
      return 5;
    case "coming_soon":
      return 4;
    case "inactive":
      return 3;
    case "hidden":
      return 2;
    case "discontinued":
      return 1;
    default:
      return product.isActive ? 4 : 0;
  }
}

function getProductSkuFamilyRank(product: Product): number {
  const sku = String(product.sku ?? product.id ?? "").trim().toUpperCase();
  const categoryId = String(product.categoryId ?? "").trim().toLowerCase();
  const normalizedTags = Array.isArray(product.tags)
    ? product.tags.map((tag) => normalizeCatalogSearch(tag))
    : [];

  if (sku.startsWith("GD-INGR-") || categoryId === "ingredientes" || normalizedTags.includes("ingrediente")) {
    return 0;
  }

  if (sku.startsWith("GD-ING-")) {
    return 1;
  }

  if (
    sku.startsWith("GD-VEGE-") ||
    sku.startsWith("GD-FRUT-") ||
    sku.startsWith("GD-HIER-") ||
    sku.startsWith("GD-OTRO-") ||
    sku.startsWith("GD-LEGU-") ||
    sku.startsWith("GD-JUGO-") ||
    sku.startsWith("GD-SALA-") ||
    sku.startsWith("GD-CASE-") ||
    sku.startsWith("GD-CAJA-")
  ) {
    return 3;
  }

  return 2;
}

function getProductCommercialRank(product: Product): number {
  const price = Number(product.salePrice ?? product.price ?? 0);
  if (Number.isFinite(price) && price > 1) return 2;
  if (Number.isFinite(price) && price > 0) return 1;
  return 0;
}

function getProductMetadataRank(product: Product): number {
  let score = 0;
  if (typeof product.image === "string" && product.image.trim()) score += 1;
  if (typeof product.categoryId === "string" && product.categoryId.trim()) score += 1;
  if (product.isFeatured) score += 1;
  return score;
}

export function compareCanonicalCatalogProducts(left: Product, right: Product): number {
  const deltas = [
    getProductStatusRank(right) - getProductStatusRank(left),
    getProductSkuFamilyRank(right) - getProductSkuFamilyRank(left),
    getProductCommercialRank(right) - getProductCommercialRank(left),
    getProductMetadataRank(right) - getProductMetadataRank(left),
  ];

  for (const delta of deltas) {
    if (delta !== 0) return delta;
  }

  const leftName = left.name.es || left.name.en || left.id;
  const rightName = right.name.es || right.name.en || right.id;
  const byName = leftName.localeCompare(rightName, "es");
  if (byName !== 0) return byName;

  const leftSku = String(left.sku ?? left.id ?? "").toUpperCase();
  const rightSku = String(right.sku ?? right.id ?? "").toUpperCase();
  return leftSku.localeCompare(rightSku, "es");
}

export function dedupeCatalogProducts(products: Product[]): Product[] {
  const canonicalIds = new Map<string, string>();

  products.forEach((product) => {
    const key = getCatalogDuplicateKey(product);
    const currentId = canonicalIds.get(key);

    if (!currentId) {
      canonicalIds.set(key, product.id);
      return;
    }

    const currentProduct = products.find((entry) => entry.id === currentId);
    if (!currentProduct) {
      canonicalIds.set(key, product.id);
      return;
    }

    if (compareCanonicalCatalogProducts(product, currentProduct) < 0) {
      canonicalIds.set(key, product.id);
    }
  });

  const selectedIds = new Set(canonicalIds.values());
  const seenDuplicateKeys = new Set<string>();

  return products.filter((product) => {
    const key = getCatalogDuplicateKey(product);
    if (!selectedIds.has(product.id) || seenDuplicateKeys.has(key)) {
      return false;
    }
    seenDuplicateKeys.add(key);
    return true;
  });
}

export function buildCanonicalProductLookup(products: Product[]): Map<string, Product> {
  const lookup = new Map<string, Product>();
  const duplicates = new Map<string, Product[]>();

  products.forEach((product) => {
    const duplicateKey = getCatalogDuplicateKey(product);
    duplicates.set(duplicateKey, [...(duplicates.get(duplicateKey) ?? []), product]);
  });

  duplicates.forEach((group) => {
    const canonicalProduct = [...group].sort(compareCanonicalCatalogProducts)[0];
    if (!canonicalProduct) return;

    group.forEach((product) => {
      [product.sku, product.id, product.slug].forEach((value) => {
        const key = typeof value === "string" ? normalizeCatalogSearch(value) : "";
        if (key) {
          lookup.set(key, canonicalProduct);
        }
      });
    });

    [canonicalProduct.name.es, canonicalProduct.name.en].forEach((value) => {
      const key = typeof value === "string" ? normalizeCatalogSearch(value) : "";
      if (key) {
        lookup.set(key, canonicalProduct);
      }
    });
  });

  return lookup;
}
