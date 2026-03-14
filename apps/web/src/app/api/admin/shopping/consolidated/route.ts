import { NextResponse } from "next/server";

import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { getAdminFirestore } from "@/lib/firebase/admin";

const COLLECTIONS = {
  orders: "orders",
  products: "catalog_products",
  supplies: "catalog_supplies",
  boxes: "catalog_boxes",
  categories: "catalog_categories",
} as const;

const EXCLUDED_ORDER_STATUSES = ["finalized", "cancelled", "delivered"] as const;

type OriginType = "box_content" | "prepared_ingredient" | "direct_item";

type Origin = {
  type: OriginType;
  orderId: string;
  customerName: string;
  quantity: number;
  boxName?: string;
  boxId?: string;
  variant?: string;
  preparedProduct?: string;
  preparedProductId?: string;
  liked?: boolean;
  disliked?: boolean;
};

type ChecklistItemState = {
  checked?: boolean;
  removed?: boolean;
  quantity?: number | string | null;
};

type AggregatedEntry = {
  id: string;
  type: "product" | "supply";
  totalQuantity: number;
  origins: Origin[];
};

type BoxVariant = {
  id?: string;
  slug?: string;
  name?: unknown;
  referenceContents?: Array<{
    productId?: string;
    quantity?: number | string;
  }>;
};

type BoxDoc = {
  id?: string;
  name?: unknown;
  variants?: BoxVariant[];
};

type ProductDoc = {
  id?: string;
  sku?: string;
  type?: string;
  name?: unknown;
  categoryId?: string;
  price?: number;
  salePrice?: number;
  unit?: unknown;
  recipe?: {
    ingredients?: Array<{
      productId?: string;
      supplyId?: string;
      quantity?: number | string;
      unit?: string;
    }>;
  };
};

type SupplyDoc = {
  id?: string;
  name?: unknown;
  category?: string;
  unit?: string;
  unitPrice?: number;
};

type CategoryDoc = {
  id?: string;
  name?: unknown;
};

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

function resolveUnit(value: unknown): string {
  if (!value) return "und";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.es === "string") return record.es;
    if (typeof record.en === "string") return record.en;
  }
  return "und";
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeVariantKey(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("mix")) return "mix";
  if (normalized.includes("frut")) return "fruity";
  if (normalized.includes("veggie") || normalized.includes("veg") || normalized.includes("vegetal")) return "veggie";
  return normalized;
}

function pickVariant(variants: BoxVariant[], variantKey?: string | null): BoxVariant | null {
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

function resolveItemProductId(item: Record<string, unknown>): string {
  const metadata =
    item.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : {};
  const candidates = [
    item.productId,
    metadata.boxId,
    metadata.productId,
    item.referenceId,
    item.id,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "";
}

function extractStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function hasPreference(item: Record<string, unknown>, key: "likes" | "dislikes", targetId: string): boolean {
  const metadata =
    item.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : {};
  const configuration =
    metadata.configuration && typeof metadata.configuration === "object"
      ? (metadata.configuration as Record<string, unknown>)
      : {};

  const values = new Set<string>([
    ...extractStringArray(metadata[key]),
    ...extractStringArray(configuration[key]),
  ]);
  if (!values.size) return false;

  const normalizedTarget = targetId.toLowerCase();
  for (const value of values) {
    if (value.toLowerCase() === normalizedTarget) return true;
  }
  return false;
}

function getCustomerName(orderData: Record<string, unknown>): string {
  const delivery =
    orderData.delivery && typeof orderData.delivery === "object"
      ? (orderData.delivery as Record<string, unknown>)
      : null;
  const address =
    delivery?.address && typeof delivery.address === "object"
      ? (delivery.address as Record<string, unknown>)
      : null;
  return typeof address?.contactName === "string" && address.contactName.trim()
    ? address.contactName.trim()
    : "Cliente";
}

function addToAggregation(
  target: Map<string, AggregatedEntry>,
  type: "product" | "supply",
  id: string,
  quantity: number,
  origin: Origin,
) {
  if (!id || quantity <= 0) return;
  const current = target.get(id) ?? { id, type, totalQuantity: 0, origins: [] };
  current.totalQuantity += quantity;
  current.origins.push(origin);
  target.set(id, current);
}

function extractBaseProductIdFromChecklistKey(rawKey: string): string {
  const key = String(rawKey || "").trim();
  if (!key) return "";
  const segments = key.split("|");
  const candidate = segments[segments.length - 1]?.trim() || "";
  return candidate;
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const ordersSnapshot = await db
      .collection(COLLECTIONS.orders)
      .where("status", "not-in", EXCLUDED_ORDER_STATUSES as unknown as string[])
      .get();

    const productAggregation = new Map<string, AggregatedEntry>();
    const supplyAggregation = new Map<string, AggregatedEntry>();
    const resolvedByOrderProduct = new Map<string, Map<string, number>>();

    const productCache = new Map<string, ProductDoc | null>();
    const supplyCache = new Map<string, SupplyDoc | null>();
    const boxCache = new Map<string, BoxDoc | null>();

    const fetchProduct = async (id: string): Promise<ProductDoc | null> => {
      if (productCache.has(id)) return productCache.get(id) ?? null;
      const snap = await db.collection(COLLECTIONS.products).doc(id).get();
      const data = snap.exists ? (snap.data() as ProductDoc) : null;
      productCache.set(id, data);
      return data;
    };

    const fetchSupply = async (id: string): Promise<SupplyDoc | null> => {
      if (supplyCache.has(id)) return supplyCache.get(id) ?? null;
      const snap = await db.collection(COLLECTIONS.supplies).doc(id).get();
      const data = snap.exists ? (snap.data() as SupplyDoc) : null;
      supplyCache.set(id, data);
      return data;
    };

    const fetchBox = async (id: string): Promise<BoxDoc | null> => {
      if (boxCache.has(id)) return boxCache.get(id) ?? null;
      const snap = await db.collection(COLLECTIONS.boxes).doc(id).get();
      const data = snap.exists ? (snap.data() as BoxDoc) : null;
      boxCache.set(id, data);
      return data;
    };

    const breakdown = {
      fromBoxes: 0,
      fromPrepared: 0,
      fromDirect: 0,
    };

    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = (orderDoc.data() ?? {}) as Record<string, unknown>;
      const orderId = orderDoc.id;
      const customerName = getCustomerName(orderData);
      const items = Array.isArray(orderData.items) ? (orderData.items as Record<string, unknown>[]) : [];

      try {
        const checklistSnapshot = await db
          .collection(COLLECTIONS.orders)
          .doc(orderId)
          .collection("market_costs")
          .doc("summary")
          .get();
        if (checklistSnapshot.exists) {
          const checklistData = (checklistSnapshot.data() ?? {}) as { items?: Record<string, ChecklistItemState> };
          const checklistItems = checklistData.items ?? {};
          const resolvedMap = new Map<string, number>();

          Object.entries(checklistItems).forEach(([key, state]) => {
            const entry = state ?? {};
            const isResolved = Boolean(entry.checked) || Boolean(entry.removed);
            if (!isResolved) return;
            const baseProductId = extractBaseProductIdFromChecklistKey(key);
            if (!baseProductId) return;
            const quantity = Math.max(0, toNumber(entry.quantity, 0));
            if (!quantity) return;
            resolvedMap.set(baseProductId, (resolvedMap.get(baseProductId) || 0) + quantity);
          });

          if (resolvedMap.size > 0) {
            resolvedByOrderProduct.set(orderId, resolvedMap);
          }
        }
      } catch (error) {
        console.error("[shopping/consolidated] failed to load checklist summary", { orderId, error });
      }

      for (const item of items) {
        const itemType = typeof item.type === "string" ? item.type : "product";
        const itemQuantity = Math.max(0, toNumber(item.quantity, 0));
        if (!itemQuantity) continue;

        if (itemType === "box") {
          const rawBoxId = resolveItemProductId(item);
          const boxId = rawBoxId ? rawBoxId.toUpperCase() : "";
          if (!boxId) {
            continue;
          }

          const boxData = await fetchBox(boxId);
          if (!boxData) continue;

          const variants = Array.isArray(boxData.variants) ? boxData.variants : [];
          const metadata =
            item.metadata && typeof item.metadata === "object"
              ? (item.metadata as Record<string, unknown>)
              : {};
          const configuration =
            metadata.configuration && typeof metadata.configuration === "object"
              ? (metadata.configuration as Record<string, unknown>)
              : {};
          const variantKey =
            (typeof metadata.variant === "string" && metadata.variant) ||
            (typeof configuration.variant === "string" && configuration.variant) ||
            (typeof metadata.mix === "string" && metadata.mix) ||
            null;

          const variant = pickVariant(variants, variantKey);
          const contents = Array.isArray(variant?.referenceContents) ? variant.referenceContents : [];
          if (!contents.length) continue;

          const boxName = resolveLocalizedString(boxData.name) || boxId;
          const variantName = resolveLocalizedString(variant?.name) || normalizeVariantKey(variantKey) || "mix";

          for (const content of contents) {
            const contentProductId = typeof content.productId === "string" ? content.productId.trim() : "";
            if (!contentProductId) continue;

            const contentQuantity = Math.max(0, toNumber(content.quantity, 1));
            const totalQuantity = contentQuantity * itemQuantity;
            if (!totalQuantity) continue;

            addToAggregation(productAggregation, "product", contentProductId, totalQuantity, {
              type: "box_content",
              boxName,
              boxId,
              variant: variantName,
              orderId,
              customerName,
              quantity: totalQuantity,
            });
            breakdown.fromBoxes += totalQuantity;
          }
          continue;
        }

        const productId = resolveItemProductId(item);
        if (!productId) continue;

        const productData = await fetchProduct(productId);

        if (itemType === "product" && productData?.type === "prepared") {
          const ingredients = Array.isArray(productData.recipe?.ingredients)
            ? productData.recipe?.ingredients
            : [];
          const preparedProduct = resolveLocalizedString(productData.name) || productId;

          for (const ingredient of ingredients) {
            const ingredientBaseQuantity = Math.max(0, toNumber(ingredient.quantity, 0));
            const totalQuantity = ingredientBaseQuantity * itemQuantity;
            if (!totalQuantity) continue;

            if (ingredient.productId) {
              const ingredientProductId = ingredient.productId.trim();
              if (ingredientProductId) {
                addToAggregation(productAggregation, "product", ingredientProductId, totalQuantity, {
                  type: "prepared_ingredient",
                  preparedProduct,
                  preparedProductId: productId,
                  orderId,
                  customerName,
                  quantity: totalQuantity,
                });
                breakdown.fromPrepared += totalQuantity;
              }
            }

            if (ingredient.supplyId) {
              const ingredientSupplyId = ingredient.supplyId.trim();
              if (ingredientSupplyId) {
                addToAggregation(supplyAggregation, "supply", ingredientSupplyId, totalQuantity, {
                  type: "prepared_ingredient",
                  preparedProduct,
                  preparedProductId: productId,
                  orderId,
                  customerName,
                  quantity: totalQuantity,
                });
                breakdown.fromPrepared += totalQuantity;
              }
            }
          }
          continue;
        }

        const liked = hasPreference(item, "likes", productId);
        const disliked = hasPreference(item, "dislikes", productId);
        addToAggregation(productAggregation, "product", productId, itemQuantity, {
          type: "direct_item",
          orderId,
          customerName,
          quantity: itemQuantity,
          liked,
          disliked,
        });
        breakdown.fromDirect += itemQuantity;
      }
    }

    await Promise.all([
      Promise.all(Array.from(productAggregation.keys()).map((id) => fetchProduct(id))),
      Promise.all(Array.from(supplyAggregation.keys()).map((id) => fetchSupply(id))),
    ]);

    const categorySnapshot = await db.collection(COLLECTIONS.categories).get();
    const categoryMap = new Map<string, CategoryDoc>();
    categorySnapshot.docs.forEach((docSnap) => {
      categoryMap.set(docSnap.id, docSnap.data() as CategoryDoc);
    });

    const productItems = Array.from(productAggregation.values()).map((entry) => {
      const productData = productCache.get(entry.id) ?? null;
      const categoryId = productData?.categoryId;
      const category =
        (categoryId ? resolveLocalizedString(categoryMap.get(categoryId)?.name) : "") ||
        categoryId ||
        "Sin categoría";
      const name = resolveLocalizedString(productData?.name) || entry.id;
      const unit = resolveUnit(productData?.unit);
      const estimatedPrice =
        typeof productData?.salePrice === "number"
          ? productData.salePrice
          : typeof productData?.price === "number"
            ? productData.price
            : 0;

      const orderIds = new Set(entry.origins.map((origin) => origin.orderId).filter(Boolean));
      const resolvedQuantity = Math.min(
        entry.totalQuantity,
        Array.from(orderIds).reduce((sum, originOrderId) => {
          const resolvedMap = resolvedByOrderProduct.get(originOrderId);
          if (!resolvedMap) return sum;
          return sum + (resolvedMap.get(entry.id) || 0);
        }, 0),
      );
      const pendingQuantity = Math.max(0, entry.totalQuantity - resolvedQuantity);

      return {
        id: entry.id,
        type: "product" as const,
        name,
        category,
        totalQuantity: entry.totalQuantity,
        resolvedQuantity,
        pendingQuantity,
        isComplete: pendingQuantity <= 0.00001,
        unit,
        estimatedPrice,
        estimatedTotal: estimatedPrice * entry.totalQuantity,
        orderCount: orderIds.size,
        origins: entry.origins,
      };
    });

    const supplyItems = Array.from(supplyAggregation.values()).map((entry) => {
      const supplyData = supplyCache.get(entry.id) ?? null;
      const name = (typeof supplyData?.name === "string" && supplyData.name) || entry.id;
      const category =
        (typeof supplyData?.category === "string" && supplyData.category) || "Supplies";
      const unit = (typeof supplyData?.unit === "string" && supplyData.unit) || "und";
      const estimatedPrice = typeof supplyData?.unitPrice === "number" ? supplyData.unitPrice : 0;
      const orderIds = new Set(entry.origins.map((origin) => origin.orderId).filter(Boolean));
      const resolvedQuantity = Math.min(
        entry.totalQuantity,
        Array.from(orderIds).reduce((sum, originOrderId) => {
          const resolvedMap = resolvedByOrderProduct.get(originOrderId);
          if (!resolvedMap) return sum;
          return sum + (resolvedMap.get(entry.id) || 0);
        }, 0),
      );
      const pendingQuantity = Math.max(0, entry.totalQuantity - resolvedQuantity);

      return {
        id: entry.id,
        type: "supply" as const,
        name,
        category,
        totalQuantity: entry.totalQuantity,
        resolvedQuantity,
        pendingQuantity,
        isComplete: pendingQuantity <= 0.00001,
        unit,
        estimatedPrice,
        estimatedTotal: estimatedPrice * entry.totalQuantity,
        orderCount: orderIds.size,
        origins: entry.origins,
      };
    });

    const items = [...productItems, ...supplyItems].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    const groupedRecord = items.reduce<Record<string, typeof items>>((acc, item) => {
      const key = item.category || "Sin categoría";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const grouped = Object.entries(groupedRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, groupedItems]) => ({
        category,
        items: groupedItems.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    const estimatedCost = items.reduce((sum, item) => sum + item.estimatedTotal, 0);
    const totalRequiredUnits = items.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalResolvedUnits = items.reduce((sum, item) => sum + item.resolvedQuantity, 0);
    const completedItems = items.filter((item) => item.isComplete).length;
    const pendingItems = items.length - completedItems;

    return NextResponse.json(
      {
        data: {
          items,
          grouped,
          summary: {
            totalOrders: ordersSnapshot.size,
            totalProducts: items.length,
            estimatedCost,
            completedItems,
            pendingItems,
            totalRequiredUnits,
            totalResolvedUnits,
            breakdown,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error building consolidated shopping list:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
