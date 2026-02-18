import type { Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import type { OrderItem } from "@/modules/orders/types";

const COLLECTIONS = {
  orders: "orders",
  products: "catalog_products",
  boxes: "catalog_boxes",
  categories: "catalog_categories",
} as const;

type SourceType = "box" | "prepared" | "direct";

type ShoppingListItem = {
  id: string;
  name: string;
  estimated_price: number;
  quantity: number;
  unit: string;
  category: string;
  source_type: SourceType;
  box_id?: string;
  box_name?: string;
  box_variant?: string;
  box_instance_key?: string;
  box_instance_label?: string;
  box_unit_price?: number;
  prepared_product?: string;
  prepared_product_id?: string;
};

type BoxVariant = {
  id?: string;
  slug?: string;
  name?: unknown;
  referenceContents?: Array<{
    productId?: string;
    quantity?: number | string;
    name?: unknown;
  }>;
};

type BoxDoc = {
  id?: string;
  name?: unknown;
  variants?: BoxVariant[];
};

type ProductDoc = {
  id?: string;
  type?: string;
  name?: unknown;
  price?: number;
  salePrice?: number;
  unit?: unknown;
  categoryId?: string;
  recipe?: {
    ingredients?: Array<{
      productId?: string;
      quantity?: number | string;
      unit?: unknown;
      name?: unknown;
    }>;
  };
};

type CategoryDoc = {
  id?: string;
  name?: unknown;
};

function normalizeVariantKey(value?: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("mix")) return "mix";
  if (normalized.includes("frut")) return "fruity";
  if (normalized.includes("veggie") || normalized.includes("veg")) return "veggie";
  return normalized;
}

function resolveLocalizedString(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.es === "string") return record.es;
    if (typeof record.en === "string") return record.en;
  }
  return "";
}

function resolveUnit(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.es === "string") return record.es;
    if (typeof record.en === "string") return record.en;
  }
  return undefined;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickVariant(variants: BoxVariant[], variantKey?: string | null) {
  if (!variants.length) return null;
  if (variantKey) {
    const direct = variants.find((variant) => variant.slug === variantKey || variant.id === variantKey);
    if (direct) return direct;
    const normalized = normalizeVariantKey(variantKey);
    if (normalized) {
      const normalizedVariant = variants.find((variant) => {
        const candidate = normalizeVariantKey(variant.slug ?? variant.id ?? null);
        return candidate === normalized;
      });
      if (normalizedVariant) return normalizedVariant;
    }
  }
  const mixVariant = variants.find((variant) => normalizeVariantKey(variant.slug ?? variant.id ?? null) === "mix");
  return mixVariant ?? variants[0];
}

async function buildShoppingList(db: Firestore, rawItems: OrderItem[]): Promise<ShoppingListItem[]> {
  const items = Array.isArray(rawItems) ? rawItems : [];

  const aggregated = new Map<
    string,
      {
        id: string;
        source_type: SourceType;
        box_id?: string;
        box_name?: string;
        box_variant?: string;
        box_instance_key?: string;
        box_instance_label?: string;
        box_unit_price?: number;
        prepared_product?: string;
        prepared_product_id?: string;
        quantity: number;
        fallbackName?: string;
      fallbackUnit?: string;
      fallbackPrice?: number;
      fallbackCategory?: string;
    }
  >();

  const buildAggregationKey = (
    productId: string,
    source: {
      source_type: SourceType;
      box_id?: string;
      box_name?: string;
      box_variant?: string;
      box_instance_key?: string;
      box_unit_price?: number;
      prepared_product?: string;
      prepared_product_id?: string;
    },
  ) => {
    if (source.source_type === "box") {
      return `box|${productId}|${source.box_id ?? ""}|${source.box_name ?? ""}|${source.box_variant ?? ""}|${source.box_instance_key ?? ""}`;
    }
    if (source.source_type === "prepared") {
      return `prepared|${productId}|${source.prepared_product_id ?? ""}|${source.prepared_product ?? ""}`;
    }
    return `direct|${productId}`;
  };

  const ensureEntry = (
    key: string,
    productId: string,
    source: {
      source_type: SourceType;
      box_id?: string;
      box_name?: string;
      box_variant?: string;
      box_instance_key?: string;
      box_instance_label?: string;
      box_unit_price?: number;
      prepared_product?: string;
      prepared_product_id?: string;
    },
  ) => {
    if (!aggregated.has(key)) {
      aggregated.set(key, {
        id: productId,
          source_type: source.source_type,
          box_id: source.box_id,
          box_name: source.box_name,
          box_variant: source.box_variant,
          box_instance_key: source.box_instance_key,
          box_instance_label: source.box_instance_label,
          box_unit_price: source.box_unit_price,
          prepared_product: source.prepared_product,
          prepared_product_id: source.prepared_product_id,
          quantity: 0,
      });
    }
    return aggregated.get(key)!;
  };

  const addProduct = (
    productId: string,
    quantity: number,
      source: {
        source_type: SourceType;
        box_id?: string;
        box_name?: string;
        box_variant?: string;
        box_instance_key?: string;
        box_instance_label?: string;
        box_unit_price?: number;
        prepared_product?: string;
        prepared_product_id?: string;
      },
    fallback?: { name?: string; unit?: string; price?: number; category?: string },
  ) => {
    const normalizedProductId = String(productId || "").trim();
    if (!normalizedProductId) return;
    const key = buildAggregationKey(normalizedProductId, source);
    const entry = ensureEntry(key, normalizedProductId, source);
    entry.quantity += quantity;
    if (fallback?.name && !entry.fallbackName) entry.fallbackName = fallback.name;
    if (fallback?.unit && !entry.fallbackUnit) entry.fallbackUnit = fallback.unit;
    if (typeof fallback?.price === "number" && entry.fallbackPrice === undefined) {
      entry.fallbackPrice = fallback.price;
    }
    if (fallback?.category && !entry.fallbackCategory) entry.fallbackCategory = fallback.category;
  };

  const productCache = new Map<string, { id: string; data: ProductDoc } | null>();
  const fetchProductDoc = async (productId: string): Promise<{ id: string; data: ProductDoc } | null> => {
    const normalizedProductId = String(productId || "").trim();
    if (!normalizedProductId) return null;
    if (productCache.has(normalizedProductId)) {
      return productCache.get(normalizedProductId) ?? null;
    }

    const idCandidates = Array.from(
      new Set([normalizedProductId, normalizedProductId.toUpperCase(), normalizedProductId.toLowerCase()]),
    );
    for (const candidateId of idCandidates) {
      const byIdSnap = await db.collection(COLLECTIONS.products).doc(candidateId).get();
      if (byIdSnap.exists) {
        const resolved = { id: byIdSnap.id, data: byIdSnap.data() as ProductDoc };
        productCache.set(normalizedProductId, resolved);
        return resolved;
      }
    }

    const upper = normalizedProductId.toUpperCase();
    const bySkuSnap = await db.collection(COLLECTIONS.products).where("sku", "==", upper).limit(1).get();
    if (!bySkuSnap.empty) {
      const docSnap = bySkuSnap.docs[0];
      const resolved = { id: docSnap.id, data: docSnap.data() as ProductDoc };
      productCache.set(normalizedProductId, resolved);
      return resolved;
    }

    const byInnerIdSnap = await db.collection(COLLECTIONS.products).where("id", "==", upper).limit(1).get();
    if (!byInnerIdSnap.empty) {
      const docSnap = byInnerIdSnap.docs[0];
      const resolved = { id: docSnap.id, data: docSnap.data() as ProductDoc };
      productCache.set(normalizedProductId, resolved);
      return resolved;
    }

    productCache.set(normalizedProductId, null);
    return null;
  };

  for (const item of items) {
    const itemQuantity = Math.max(0, toNumber((item as any)?.quantity, 0));
    if (!itemQuantity) continue;

    if (item.type === "box") {
      const metadata =
        (item as any)?.metadata && typeof (item as any).metadata === "object"
          ? ((item as any).metadata as Record<string, unknown>)
          : {};
      const configuration =
        metadata.configuration && typeof metadata.configuration === "object"
          ? (metadata.configuration as Record<string, unknown>)
          : {};
      const boxId = ((item as any).productId || (item as any).metadata?.boxId || (item as any).id)
        ?.toString()
        .toUpperCase()
        .trim();
      const boxUnitPrice = toNumber((item as any)?.unitPrice?.amount ?? (item as any)?.unitPrice, 0);
      const rawVariantKey =
        (typeof metadata.variant === "string" && metadata.variant) ||
        (typeof configuration.variant === "string" && configuration.variant) ||
        (typeof metadata.variantKey === "string" && metadata.variantKey) ||
        null;
      const fallbackVariantName =
        normalizeVariantKey(rawVariantKey) ||
        (typeof rawVariantKey === "string" && rawVariantKey.trim()) ||
        "mix";
      const boxItemKeyBase = String((item as any).id || (item as any).referenceId || boxId).trim() || boxId;
      const boxUnits = Math.max(1, Math.round(itemQuantity));

      if (!boxId) continue;

      const boxSnap = await db.collection(COLLECTIONS.boxes).doc(String(boxId)).get();
      if (!boxSnap.exists) {
        const fallbackName = resolveLocalizedString((item as any).name);
        for (let unitIndex = 0; unitIndex < boxUnits; unitIndex += 1) {
          const instanceNumber = unitIndex + 1;
          const instanceKey = `${boxItemKeyBase}::${instanceNumber}`;
          addProduct(
            String(boxId),
            1,
            {
              source_type: "box",
              box_id: String(boxId),
              box_name: fallbackName || String(boxId),
              box_variant: fallbackVariantName,
              box_instance_key: instanceKey,
              box_instance_label: `#${instanceNumber}`,
              box_unit_price: boxUnitPrice,
            },
            {
              name: fallbackName || String(boxId),
              price: toNumber((item as any)?.unitPrice?.amount ?? (item as any)?.unitPrice, 0),
              unit: (item as any)?.metadata?.unit,
              category: "box",
            },
          );
        }
        continue;
      }

      const boxData = boxSnap.data() as BoxDoc;
      const variants = Array.isArray(boxData?.variants) ? boxData.variants : [];
      const variant = pickVariant(variants, typeof rawVariantKey === "string" ? rawVariantKey : null);
      const contents = Array.isArray(variant?.referenceContents) ? variant?.referenceContents : [];
      const boxName = resolveLocalizedString(boxData?.name) || resolveLocalizedString((item as any).name) || String(boxId);
      const variantName =
        resolveLocalizedString(variant?.name) || normalizeVariantKey(variant?.slug ?? variant?.id ?? rawVariantKey) || "mix";
      if (!contents.length) {
        for (let unitIndex = 0; unitIndex < boxUnits; unitIndex += 1) {
          const instanceNumber = unitIndex + 1;
          const instanceKey = `${boxItemKeyBase}::${instanceNumber}`;
          addProduct(
            String(boxId),
            1,
            {
              source_type: "box",
              box_id: String(boxId),
              box_name: boxName,
              box_variant: variantName,
              box_instance_key: instanceKey,
              box_instance_label: `#${instanceNumber}`,
              box_unit_price: boxUnitPrice,
            },
            {
              name: boxName,
              price: toNumber((item as any)?.unitPrice?.amount ?? (item as any)?.unitPrice, 0),
              unit: (item as any)?.metadata?.unit,
              category: "box",
            },
          );
        }
        continue;
      }

      for (let unitIndex = 0; unitIndex < boxUnits; unitIndex += 1) {
        const instanceNumber = unitIndex + 1;
        const instanceKey = `${boxItemKeyBase}::${instanceNumber}`;
        contents.forEach((content) => {
          const productId = String(content?.productId || "").trim();
          if (!productId) return;
          const perBox = Math.max(0, toNumber(content?.quantity, 1));
          const name = resolveLocalizedString(content?.name);
          addProduct(
            productId,
            perBox,
            {
              source_type: "box",
              box_id: String(boxId),
              box_name: boxName,
              box_variant: variantName,
              box_instance_key: instanceKey,
              box_instance_label: `#${instanceNumber}`,
              box_unit_price: boxUnitPrice,
            },
            {
              name: name || undefined,
            },
          );
        });
      }
      continue;
    }

    const productId =
      (item as any).productId ||
      (item as any).metadata?.productId ||
      (item as any).referenceId ||
      (item as any).id;
    if (!productId) continue;
    const normalizedProductId = String(productId).trim();
    if (!normalizedProductId) continue;

    const productLookup = await fetchProductDoc(normalizedProductId);
    const productDoc = productLookup?.data ?? null;
    const canonicalProductId = productLookup?.id ?? normalizedProductId;
    const preparedName =
      resolveLocalizedString(productDoc?.name) ||
      resolveLocalizedString((item as any).name) ||
      normalizedProductId;
    const recipeIngredients = Array.isArray(productDoc?.recipe?.ingredients)
      ? productDoc?.recipe?.ingredients
      : [];

    if (productDoc?.type === "prepared" && recipeIngredients.length) {
      recipeIngredients.forEach((ingredient) => {
        const ingredientProductId = String(ingredient?.productId || "").trim();
        if (!ingredientProductId) return;

        const perPreparedUnit = Math.max(0, toNumber(ingredient?.quantity, 0));
        if (!perPreparedUnit) return;

        addProduct(
          ingredientProductId,
          perPreparedUnit * itemQuantity,
          {
            source_type: "prepared",
            prepared_product: preparedName,
            prepared_product_id: canonicalProductId,
          },
          {
            name: resolveLocalizedString(ingredient?.name) || undefined,
            unit: resolveUnit(ingredient?.unit),
          },
        );
      });
      continue;
    }

    addProduct(
      canonicalProductId,
      itemQuantity,
      {
        source_type: "direct",
      },
      {
        name: resolveLocalizedString((item as any).name) || normalizedProductId,
        price: toNumber((item as any)?.unitPrice?.amount ?? (item as any)?.unitPrice, 0),
        unit: (item as any)?.metadata?.unit,
      },
    );
  }

  const aggregatedEntries = Array.from(aggregated.values());
  const productIds = Array.from(new Set(aggregatedEntries.map((entry) => entry.id)));
  const productRefs = productIds.map((productId) => db.collection(COLLECTIONS.products).doc(productId));
  const productDocs = productRefs.length ? await db.getAll(...productRefs) : [];
  const productMap = new Map<string, ProductDoc>();
  productDocs.forEach((docSnap) => {
    if (docSnap.exists) {
      productMap.set(docSnap.id, docSnap.data() as ProductDoc);
    }
  });

  const categorySnap = await db.collection(COLLECTIONS.categories).get();
  const categoryMap = new Map<string, CategoryDoc>();
  categorySnap.docs.forEach((docSnap) => {
    categoryMap.set(docSnap.id, docSnap.data() as CategoryDoc);
  });

  const list: ShoppingListItem[] = aggregatedEntries.map((entry) => {
    const product = productMap.get(entry.id);
    const name = resolveLocalizedString(product?.name) || entry.fallbackName || entry.id;
    const estimatedPrice =
      typeof product?.salePrice === "number"
        ? product.salePrice
        : typeof product?.price === "number"
          ? product.price
          : entry.fallbackPrice ?? 0;
    const unit = resolveUnit(product?.unit) || entry.fallbackUnit || "und";
    const categoryId = product?.categoryId;
    const category = categoryId
      ? resolveLocalizedString(categoryMap.get(categoryId)?.name) || categoryId
      : entry.fallbackCategory || "Sin categoria";

    return {
      id: entry.id,
      name,
      estimated_price: estimatedPrice,
      quantity: entry.quantity,
      unit,
      category,
      source_type: entry.source_type,
      box_id: entry.box_id,
      box_name: entry.box_name,
      box_variant: entry.box_variant,
      box_instance_key: entry.box_instance_key,
      box_instance_label: entry.box_instance_label,
      box_unit_price: entry.box_unit_price,
      prepared_product: entry.prepared_product,
      prepared_product_id: entry.prepared_product_id,
    };
  });

  list.sort((a, b) => {
    const categoryA = a.category || "";
    const categoryB = b.category || "";
    if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);
    return a.name.localeCompare(b.name);
  });

  return list;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const orderSnap = await db.collection(COLLECTIONS.orders).doc(id).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data() ?? {};
    const items = Array.isArray(orderData.items) ? (orderData.items as OrderItem[]) : [];
    const list = await buildShoppingList(db, items);

    return NextResponse.json({ data: list }, { status: 200 });
  } catch (error) {
    console.error("Error building shopping list:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? (body.items as OrderItem[]) : null;

    if (!items) {
      return NextResponse.json({ error: "Invalid items payload" }, { status: 400 });
    }

    const list = await buildShoppingList(db, items);
    return NextResponse.json({ data: list }, { status: 200 });
  } catch (error) {
    console.error("Error building shopping list from draft items:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
