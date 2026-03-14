import { buildLocalizedValue } from "./localization";
import type { LocalizedString, Product, ProductType } from "./types";

const PRODUCT_STATUSES = ["active", "inactive", "coming_soon", "discontinued", "hidden"] as const;
const PRODUCT_TYPES = ["simple", "box", "salad", "prepared"] as const;

type ProductStatus = (typeof PRODUCT_STATUSES)[number];

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readLegacyField(data: Record<string, unknown>, field: string, suffixes: string[]): string | undefined {
  for (const suffix of suffixes) {
    const candidate = normalizeString(data[`${field}${suffix}`]);
    if (candidate) return candidate;
  }
  return undefined;
}

function buildOptionalLocalizedField(
  data: Record<string, unknown>,
  field: string,
): LocalizedString | undefined {
  const fallbackEs = readLegacyField(data, field, ["_es", "Es"]);
  const fallbackEn = readLegacyField(data, field, ["_en", "En"]);
  const localized = buildLocalizedValue(
    data[field] as Record<string, string> | string | undefined,
    fallbackEs,
    fallbackEn,
  );

  if (!localized.es && !localized.en) return undefined;
  return localized;
}

function buildProductUnit(data: Record<string, unknown>): Product["unit"] {
  const rawUnit = data.unit;
  const fallbackEs = readLegacyField(data, "unit", ["_es", "Es"]);
  const fallbackEn = readLegacyField(data, "unit", ["_en", "En"]);

  if (typeof rawUnit === "string") {
    return rawUnit;
  }

  if (rawUnit && typeof rawUnit === "object") {
    const localized = buildLocalizedValue(
      rawUnit as Record<string, string>,
      fallbackEs,
      fallbackEn,
    );
    return localized.es || localized.en ? localized : undefined;
  }

  if (fallbackEs || fallbackEn) {
    const localized = buildLocalizedValue(undefined, fallbackEs, fallbackEn);
    return localized.es || localized.en ? localized : undefined;
  }

  return undefined;
}

function hasRecipeIngredients(data: Record<string, unknown>) {
  const recipe = data.recipe as { ingredients?: unknown } | undefined;
  return Array.isArray(recipe?.ingredients) && recipe.ingredients.length > 0;
}

function hasBillOfMaterials(data: Record<string, unknown>) {
  const metadata = data.metadata as { billOfMaterials?: unknown } | undefined;
  return Array.isArray(metadata?.billOfMaterials) && metadata.billOfMaterials.length > 0;
}

export function resolveCatalogProductKey(docId: string, data: Record<string, unknown>) {
  return normalizeString(data.sku) ?? docId;
}

export function inferCatalogProductType(
  data: Record<string, unknown>,
  docId: string,
): ProductType {
  const rawType = normalizeString(data.type)?.toLowerCase();

  if (rawType === "combo") return "prepared";
  if (rawType === "product") return "simple";
  if (rawType && PRODUCT_TYPES.includes(rawType as ProductType)) {
    return rawType as ProductType;
  }

  const categoryId = normalizeString(data.categoryId)?.toLowerCase() ?? "";
  const sku = resolveCatalogProductKey(docId, data).toUpperCase();

  if (categoryId === "cajas" || sku.startsWith("GD-CAJA-")) {
    return "box";
  }

  if (categoryId.includes("ensalada") || sku.startsWith("GD-ENSA-")) {
    return "prepared";
  }

  if (categoryId === "productos-caseros" || hasRecipeIngredients(data) || hasBillOfMaterials(data)) {
    return "prepared";
  }

  return "simple";
}

export function inferCatalogProductStatus(
  data: Record<string, unknown>,
  docId: string,
): ProductStatus {
  const rawStatus = normalizeString(data.status)?.toLowerCase();
  if (rawStatus && PRODUCT_STATUSES.includes(rawStatus as ProductStatus)) {
    return rawStatus as ProductStatus;
  }

  if (typeof data.isActive === "boolean") {
    return data.isActive ? "active" : "inactive";
  }

  const type = inferCatalogProductType(data, docId);
  if (type === "box" && (normalizeNumber(data.price) ?? 0) > 0) {
    return "active";
  }

  return "inactive";
}

export function normalizeCatalogProduct(
  docId: string,
  data: Record<string, unknown>,
): Product {
  const sku = resolveCatalogProductKey(docId, data);
  const type = inferCatalogProductType(data, sku);
  const status = inferCatalogProductStatus(data, sku);
  const name = buildLocalizedValue(
    data.name as Record<string, string> | string | undefined,
    readLegacyField(data, "name", ["_es", "Es"]) ?? sku,
    readLegacyField(data, "name", ["_en", "En"]) ?? readLegacyField(data, "name", ["_es", "Es"]) ?? sku,
  );
  const description = buildOptionalLocalizedField(data, "description");
  const unit = buildProductUnit(data);
  const image =
    normalizeString(data.image) ??
    normalizeString((data as { image_url?: unknown }).image_url) ??
    `/assets/images/products/${sku}.png`;
  const price = normalizeNumber(data.price) ?? 0;
  const salePrice = normalizeNumber(data.salePrice);

  return {
    ...(data as Product),
    id: docId,
    sku,
    slug: normalizeString(data.slug) ?? sku.toLowerCase(),
    name,
    description,
    unit,
    image,
    categoryId: normalizeString(data.categoryId),
    type,
    status,
    isActive:
      typeof data.isActive === "boolean"
        ? data.isActive
        : status === "active" || status === "coming_soon",
    price,
    salePrice,
  };
}

export function matchesCatalogProductType(product: Product, requestedType?: string | null) {
  const normalizedType = normalizeString(requestedType)?.toLowerCase();
  if (!normalizedType) return true;

  if (normalizedType === "product") {
    return product.type !== "box";
  }

  if (normalizedType === "prepared") {
    return product.type === "prepared" || product.type === "salad";
  }

  if (normalizedType === "salad") {
    return product.type === "salad";
  }

  return product.type === normalizedType;
}
