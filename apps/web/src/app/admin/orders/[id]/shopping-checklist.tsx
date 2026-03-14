"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Beef,
  Check,
  ChevronDown,
  ChevronRight,
  Cherry,
  CircleDot,
  Droplet,
  Flower2,
  Leaf,
  Milk,
  Printer,
  RotateCcw,
  Sprout,
  Square,
  Trash2,
  Wheat,
} from "lucide-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

import { getFirestoreDb } from "@/lib/firebase/client";
import { adminFetch } from "@/modules/admin/api/client";

interface OrderItem {
  id: string;
  name?: unknown;
  quantity: number;
  type?: string;
  productId?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  unitPrice?: { amount?: number } | number;
}

interface ShoppingChecklistProps {
  items: OrderItem[];
  orderId: string;
  orderTotal: number;
  orderCurrency?: string;
  customerLikes?: string;
  customerDislikes?: string;
  onChecklistStatusChange?: (status: {
    isComplete: boolean;
    checkedCount: number;
    totalCount: number;
  }) => void;
}

type SourceType = "box" | "prepared" | "direct";

type ApiShoppingListItem = {
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

type ItemState = {
  checked: boolean;
  price: string;
  quantity: string;
  removed: boolean;
  replacementInput: string;
  replacementId?: string;
  replacementName?: string;
  replacementPrice?: number;
  replacementUnit?: string;
};

type MarketCostsDoc = {
  items?: Record<
    string,
    {
      checked?: boolean;
      cost?: number | null;
      quantity?: number | null;
      removed?: boolean;
      replacementId?: string;
      replacementName?: string;
      replacementPrice?: number;
      replacementUnit?: string;
    }
  >;
};

type CatalogProductOption = {
  id: string;
  sku: string;
  name: string;
  price: number;
  unit: string;
};

type LeafChecklistItem = {
  key: string;
  legacyKeys: string[];
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  category?: string;
  sourceType: SourceType;
  sourceLabel: string;
};

type PreparedGroup = {
  key: string;
  name: string;
  quantity: number;
  preparedProductId?: string;
  ingredients: LeafChecklistItem[];
};

type BoxGroup = {
  key: string;
  boxId?: string;
  name: string;
  variant: string;
  instanceLabel?: string;
  boxUnitPrice?: number;
  items: LeafChecklistItem[];
};

const MARKET_COSTS_DOC_ID = "summary";

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number") return String(value);
  return fallback;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function buildLeafKey(item: ApiShoppingListItem) {
  const id = normalizeText(item.id, "item");
  if (item.source_type === "prepared") {
    const preparedName = normalizeText(item.prepared_product, "preparado");
    return `prepared|${normalizeKey(preparedName)}|${id}`;
  }
  if (item.source_type === "box") {
    const instanceKey = normalizeText(item.box_instance_key, "");
    if (instanceKey) return `box|${normalizeKey(instanceKey)}|${id}`;
    const boxName = normalizeText(item.box_name, "caja");
    const variant = normalizeText(item.box_variant, "mix");
    return `box|${normalizeKey(boxName)}|${normalizeKey(variant)}|${id}`;
  }
  return `direct|${id}`;
}

function buildSourceLabel(item: ApiShoppingListItem) {
  if (item.source_type === "box") {
    const boxName = normalizeText(item.box_name, "Caja");
    const variant = normalizeText(item.box_variant, "Mix");
    const instance = normalizeText(item.box_instance_label, "");
    return instance ? `caja: ${boxName} (${variant}) ${instance}` : `caja: ${boxName} (${variant})`;
  }
  if (item.source_type === "prepared") return "ingrediente";
  return "producto";
}

function buildImageCandidates(id: string, kind: "product" | "box") {
  const normalizedId = normalizeText(id, "");
  const fallback = ["/assets/images/products/placeholder.png"];
  if (!normalizedId) return fallback;

  if (kind === "box") {
    return [
      `/assets/images/boxes/${normalizedId}.png`,
      `/assets/images/boxes/${normalizedId}.jpg`,
      `/assets/images/boxes/${normalizedId}.jpeg`,
      `/assets/images/products/${normalizedId}.png`,
      `/assets/images/products/${normalizedId}.jpg`,
      `/assets/images/products/${normalizedId}.jpeg`,
      ...fallback,
    ];
  }

  return [
    `/assets/images/products/${normalizedId}.png`,
    `/assets/images/products/${normalizedId}.jpg`,
    `/assets/images/products/${normalizedId}.jpeg`,
    `/assets/images/salads/${normalizedId}.png`,
    `/assets/images/salads/${normalizedId}.jpg`,
    `/assets/images/salads/${normalizedId}.jpeg`,
    ...fallback,
  ];
}

function ItemThumbnail({
  id,
  alt,
  kind,
  className,
}: {
  id?: string;
  alt: string;
  kind: "product" | "box";
  className: string;
}) {
  const candidates = useMemo(() => buildImageCandidates(id || "", kind), [id, kind]);
  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    setSrcIndex(0);
  }, [id, kind]);

  const safeIndex = Math.min(srcIndex, Math.max(0, candidates.length - 1));
  return (
    <img
      src={candidates[safeIndex]}
      alt={alt}
      className={className}
      onError={() => {
        setSrcIndex((prev) => (prev + 1 < candidates.length ? prev + 1 : prev));
      }}
    />
  );
}

function getIngredientIcon(category?: string) {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("verdura")) return Leaf;
  if (normalized.includes("grano")) return Wheat;
  if (normalized.includes("fruta")) return Cherry;
  if (normalized.includes("lácteo") || normalized.includes("lacteo")) return Milk;
  if (normalized.includes("aceite")) return Droplet;
  if (normalized.includes("semilla")) return Sprout;
  if (normalized.includes("legumbre") || normalized.includes("proteina") || normalized.includes("proteína")) return Beef;
  if (normalized.includes("hierba")) return Flower2;
  if (normalized.includes("condimento")) return Flower2;
  return CircleDot;
}

function resolveOrderItemName(item: OrderItem): string {
  if (typeof item.name === "string") return item.name;
  if (item.name && typeof item.name === "object") {
    const record = item.name as Record<string, unknown>;
    if (typeof record.es === "string") return record.es;
    if (typeof record.en === "string") return record.en;
  }
  return normalizeText(item.id, "Producto");
}

function resolveOrderItemId(item: OrderItem): string {
  const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata : {};
  const candidates = [
    item.productId,
    metadata.productId,
    item.referenceId,
    item.id,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return normalizeText(item.id, "item");
}

function resolveOrderItemUnit(item: OrderItem): string {
  const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata : {};
  const rawUnit = metadata.unit;
  if (typeof rawUnit === "string" && rawUnit.trim()) return rawUnit.trim();
  if (rawUnit && typeof rawUnit === "object") {
    const record = rawUnit as Record<string, unknown>;
    if (typeof record.es === "string") return record.es;
    if (typeof record.en === "string") return record.en;
  }
  return "und";
}

function resolveOrderItemEstimatedPrice(item: OrderItem): number {
  const raw = item.unitPrice;
  if (typeof raw === "number") return Math.max(0, raw);
  if (raw && typeof raw === "object") {
    const amount = Number(raw.amount);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
  }
  return 0;
}

function parsePreferenceTerms(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((term) => normalizeKey(term))
    .filter((term) => term.length >= 2);
}

function resolveCatalogName(value: unknown, fallback = "Producto"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.es === "string" && record.es.trim()) return record.es.trim();
    if (typeof record.en === "string" && record.en.trim()) return record.en.trim();
  }
  return fallback;
}

function resolveCatalogUnit(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.es === "string" && record.es.trim()) return record.es.trim();
    if (typeof record.en === "string" && record.en.trim()) return record.en.trim();
  }
  return "und";
}

export function ShoppingChecklist({
  items,
  orderId,
  orderTotal,
  orderCurrency,
  customerLikes,
  customerDislikes,
  onChecklistStatusChange,
}: ShoppingChecklistProps) {
  const [itemState, setItemState] = useState<Record<string, ItemState>>({});
  const [expandedPrepared, setExpandedPrepared] = useState<Record<string, boolean>>({});
  const [expandedBoxes, setExpandedBoxes] = useState<Record<string, boolean>>({});
  const [catalogOptions, setCatalogOptions] = useState<CatalogProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [shoppingListStatus, setShoppingListStatus] = useState<"loading" | "ready" | "error">("loading");
  const [shoppingListItems, setShoppingListItems] = useState<ApiShoppingListItem[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasLoadedRef = useRef(false);
  const latestItemsRef = useRef<OrderItem[]>(items);
  const orderItemsSignature = useMemo(
    () =>
      items
        .map((item) => {
          const metadata =
            item.metadata && typeof item.metadata === "object" ? item.metadata : {};
          const variant =
            (typeof metadata.variant === "string" && metadata.variant.trim()) ||
            (typeof metadata.variantKey === "string" && metadata.variantKey.trim()) ||
            "";
          return `${item.type || "product"}:${resolveOrderItemId(item)}:${item.quantity}:${variant}`;
        })
        .join("|"),
    [items],
  );

  const parseCost = useCallback((value: string) => {
    if (!value) return null;
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const currencyFormatter = useMemo(() => {
    const currency = orderCurrency || "DOP";
    try {
      return new Intl.NumberFormat("es-DO", { style: "currency", currency });
    } catch {
      return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });
    }
  }, [orderCurrency]);

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  const dislikeTerms = useMemo(() => parsePreferenceTerms(customerDislikes), [customerDislikes]);
  const likeTerms = useMemo(() => parsePreferenceTerms(customerLikes), [customerLikes]);

  useEffect(() => {
    let isMounted = true;

    const loadCatalogOptions = async () => {
      try {
        const response = await adminFetch("/api/admin/catalog/products", { cache: "no-store" });
        const json = (await response.json()) as { data?: Array<Record<string, unknown>> };
        if (!response.ok || !Array.isArray(json.data)) return;
        if (!isMounted) return;

        const nextOptions: CatalogProductOption[] = json.data
          .map((product) => {
            const id = normalizeText(product.id, "");
            if (!id) return null;
            return {
              id,
              sku: normalizeText(product.sku, id),
              name: resolveCatalogName(product.name, id),
              price: Math.max(0, parseNumber(product.salePrice ?? product.price, 0)),
              unit: resolveCatalogUnit(product.unit),
            } as CatalogProductOption;
          })
          .filter((option): option is CatalogProductOption => Boolean(option));

        setCatalogOptions(nextOptions);
      } catch (error) {
        console.error("Failed to load catalog products for replacement", error);
      }
    };

    loadCatalogOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;

    const loadShoppingList = async () => {
      setShoppingListStatus("loading");
      try {
        const response = await adminFetch(`/api/admin/orders/${orderId}/shopping-list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: latestItemsRef.current }),
        });
        const json = (await response.json()) as { data?: ApiShoppingListItem[]; error?: string };
        if (!response.ok) {
          throw new Error(json.error || "No se pudo cargar la lista de compras");
        }
        if (!isMounted) return;
        setShoppingListItems(Array.isArray(json.data) ? json.data : []);
        setShoppingListStatus("ready");
      } catch (error) {
        console.error("Failed to load shopping list", error);
        if (!isMounted) return;
        setShoppingListStatus("error");
      }
    };

    const debounceTimeoutId = window.setTimeout(() => {
      void loadShoppingList();
    }, 280);

    return () => {
      isMounted = false;
      window.clearTimeout(debounceTimeoutId);
    };
  }, [orderId, orderItemsSignature]);

  const draftDirectItems = useMemo<ApiShoppingListItem[]>(() => {
    return items
      .filter((item) => item.type !== "box")
      .map((item) => ({
        id: resolveOrderItemId(item),
        name: resolveOrderItemName(item),
        estimated_price: resolveOrderItemEstimatedPrice(item),
        quantity: Math.max(0, parseNumber(item.quantity, 0)),
        unit: resolveOrderItemUnit(item),
        category: "General",
        source_type: "direct" as const,
      }));
  }, [items]);

  const activeShoppingItems = useMemo(() => {
    if (shoppingListStatus === "error" && shoppingListItems.length === 0) {
      return draftDirectItems;
    }

    const draftDirectMap = new Map<string, ApiShoppingListItem>();
    draftDirectItems.forEach((item) => {
      draftDirectMap.set(`direct|${normalizeText(item.id, "")}`, item);
    });
    const preparedProductIds = new Set<string>();
    const preparedProductNames = new Set<string>();
    shoppingListItems.forEach((item) => {
      if (item.source_type !== "prepared") return;
      const preparedId = normalizeKey(normalizeText(item.prepared_product_id, ""));
      if (preparedId) preparedProductIds.add(preparedId);
      const preparedName = normalizeKey(normalizeText(item.prepared_product, ""));
      if (preparedName) preparedProductNames.add(preparedName);
    });

    const merged: ApiShoppingListItem[] = [];
    shoppingListItems.forEach((item) => {
      if (item.source_type !== "direct") {
        merged.push(item);
        return;
      }

      const directKey = `direct|${normalizeText(item.id, "")}`;
      const draftItem = draftDirectMap.get(directKey);
      if (!draftItem) {
        return;
      }

      merged.push({
        ...item,
        name: draftItem.name || item.name,
        quantity: draftItem.quantity,
        estimated_price: draftItem.estimated_price || item.estimated_price,
        unit: draftItem.unit || item.unit,
      });
      draftDirectMap.delete(directKey);
    });

    draftDirectMap.forEach((item) => {
      const draftId = normalizeKey(normalizeText(item.id, ""));
      const draftName = normalizeKey(normalizeText(item.name, ""));
      if (preparedProductIds.has(draftId) || preparedProductNames.has(draftName)) {
        return;
      }
      merged.push(item);
    });

    return merged;
  }, [shoppingListItems, shoppingListStatus, draftDirectItems]);

  const preparedQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const key = normalizeKey(resolveOrderItemName(item));
      if (!key) return;
      map.set(key, (map.get(key) || 0) + Math.max(0, parseNumber(item.quantity, 0)));
    });
    return map;
  }, [items]);

  const { directItems, boxGroups, preparedGroups, leafItems } = useMemo(() => {
    const direct: LeafChecklistItem[] = [];
    const preparedGroupsMap = new Map<string, PreparedGroup>();
    const boxGroupsMap = new Map<string, BoxGroup>();

    activeShoppingItems.forEach((item) => {
      const name = normalizeText(item.name, item.id);
      const id = normalizeText(item.id, "item");
      const quantity = Math.max(0, parseNumber(item.quantity, 0));
      const unit = normalizeText(item.unit, "und");
      const estimatedPrice = Math.max(0, parseNumber(item.estimated_price, 0));
      const key = buildLeafKey(item);

      const leafItem: LeafChecklistItem = {
        key,
        legacyKeys: [id],
        id,
        name,
        quantity,
        unit,
        estimatedPrice,
        category: item.category,
        sourceType: item.source_type,
        sourceLabel: buildSourceLabel(item),
      };

      if (item.source_type === "prepared") {
        const preparedName = normalizeText(item.prepared_product, "Preparado");
        const preparedId = normalizeText(item.prepared_product_id, "");
        const preparedKey = preparedId
          ? `prepared-group|${normalizeKey(preparedId)}`
          : `prepared-group|${normalizeKey(preparedName)}`;
        if (!preparedGroupsMap.has(preparedKey)) {
          preparedGroupsMap.set(preparedKey, {
            key: preparedKey,
            name: preparedName,
            quantity: preparedQuantityMap.get(normalizeKey(preparedName)) || 1,
            preparedProductId: preparedId || undefined,
            ingredients: [],
          });
        }
        const preparedGroup = preparedGroupsMap.get(preparedKey)!;
        if (!preparedGroup.preparedProductId && preparedId) {
          preparedGroup.preparedProductId = preparedId;
        }
        preparedGroupsMap.get(preparedKey)!.ingredients.push(leafItem);
        return;
      }

      if (item.source_type === "box") {
        const boxId = normalizeText(item.box_id, "");
        const boxName = normalizeText(item.box_name, "Caja");
        const boxVariant = normalizeText(item.box_variant, "Mix");
        const boxInstanceKey = normalizeText(item.box_instance_key, `${boxName}|${boxVariant}|${item.id}`);
        const boxUnitPrice = Math.max(0, parseNumber(item.box_unit_price, 0));
        const boxKey = `box-group|${normalizeKey(boxInstanceKey)}`;
        if (!boxGroupsMap.has(boxKey)) {
          boxGroupsMap.set(boxKey, {
            key: boxKey,
            boxId: boxId || undefined,
            name: boxName,
            variant: boxVariant,
            instanceLabel: normalizeText(item.box_instance_label, ""),
            boxUnitPrice: boxUnitPrice > 0 ? boxUnitPrice : undefined,
            items: [],
          });
        }
        const boxGroup = boxGroupsMap.get(boxKey)!;
        if (!boxGroup.boxId && boxId) {
          boxGroup.boxId = boxId;
        }
        if (!boxGroup.boxUnitPrice && boxUnitPrice > 0) {
          boxGroup.boxUnitPrice = boxUnitPrice;
        }
        boxGroupsMap.get(boxKey)!.items.push(leafItem);
        return;
      }

      direct.push(leafItem);
    });

    direct.sort((a, b) => a.name.localeCompare(b.name));
    const boxes = Array.from(boxGroupsMap.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => {
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return a.variant.localeCompare(b.variant);
      });
    const groups = Array.from(preparedGroupsMap.values())
      .map((group) => ({
        ...group,
        ingredients: [...group.ingredients].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      directItems: direct,
      boxGroups: boxes,
      preparedGroups: groups,
      leafItems: [
        ...direct,
        ...boxes.flatMap((group) => group.items),
        ...groups.flatMap((group) => group.ingredients),
      ],
    };
  }, [activeShoppingItems, preparedQuantityMap]);

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const db = getFirestoreDb();
        const docRef = doc(db, "orders", orderId, "market_costs", MARKET_COSTS_DOC_ID);
        const snapshot = await getDoc(docRef);

        if (!isMounted) return;

        if (snapshot.exists()) {
          const data = snapshot.data() as MarketCostsDoc;
          const nextState: Record<string, ItemState> = {};
          Object.entries(data.items ?? {}).forEach(([id, entry]) => {
            nextState[id] = {
              checked: Boolean(entry?.checked),
              price: typeof entry?.cost === "number" ? String(entry.cost) : "",
              quantity: typeof entry?.quantity === "number" ? String(entry.quantity) : "",
              removed: Boolean(entry?.removed),
              replacementInput: entry?.replacementId || "",
              replacementId: typeof entry?.replacementId === "string" ? entry.replacementId : undefined,
              replacementName: typeof entry?.replacementName === "string" ? entry.replacementName : undefined,
              replacementPrice:
                typeof entry?.replacementPrice === "number" ? entry.replacementPrice : undefined,
              replacementUnit: typeof entry?.replacementUnit === "string" ? entry.replacementUnit : undefined,
            };
          });
          setItemState(nextState);
        }
      } catch (error) {
        console.error("Failed to load market costs", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          hasLoadedRef.current = true;
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  useEffect(() => {
    if (!leafItems.length) return;
    setItemState((prev) => {
      let changed = false;
      const next = { ...prev };

      leafItems.forEach((leafItem) => {
        if (next[leafItem.key]) return;

        const legacyMatch = leafItem.legacyKeys.find((legacyKey) => Boolean(next[legacyKey]));
        if (legacyMatch) {
          next[leafItem.key] = {
            ...next[legacyMatch],
            quantity: next[legacyMatch].quantity || String(leafItem.quantity),
            removed: Boolean(next[legacyMatch].removed),
            replacementInput: next[legacyMatch].replacementInput || next[legacyMatch].replacementId || "",
          };
          changed = true;
          return;
        }

        next[leafItem.key] = {
          checked: false,
          price: "",
          quantity: String(leafItem.quantity),
          removed: false,
          replacementInput: "",
        };
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [leafItems]);

  useEffect(() => {
    if (!orderId || !hasLoadedRef.current) return;

    const timeoutId = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const db = getFirestoreDb();
        const docRef = doc(db, "orders", orderId, "market_costs", MARKET_COSTS_DOC_ID);
        const payload: MarketCostsDoc = { items: {} };

        leafItems.forEach((leafItem) => {
          const state = itemState[leafItem.key];
          const cost = state ? parseCost(state.price) : null;
          const quantity = state ? parseNumber(state.quantity, leafItem.quantity) : leafItem.quantity;
          if (!payload.items) payload.items = {};
          const payloadItem: {
            checked: boolean;
            cost: number | null;
            quantity: number;
            removed: boolean;
            replacementId: string;
            replacementName: string;
            replacementUnit: string;
            replacementPrice?: number;
          } = {
            checked: Boolean(state?.checked),
            cost,
            quantity,
            removed: Boolean(state?.removed),
            replacementId: state?.replacementId || "",
            replacementName: state?.replacementName || "",
            replacementUnit: state?.replacementUnit || "",
          };
          if (typeof state?.replacementPrice === "number") {
            payloadItem.replacementPrice = state.replacementPrice;
          }
          payload.items[leafItem.key] = payloadItem;
        });

        await setDoc(
          docRef,
          {
            ...payload,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        setSaveState("saved");
      } catch (error) {
        console.error("Failed to save market costs", error);
        setSaveState("error");
      }
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [orderId, leafItems, itemState, parseCost]);

  const getInitialItemState = (): ItemState => ({
    checked: false,
    price: "",
    quantity: "",
    removed: false,
    replacementInput: "",
  });

  const toggleItem = (itemKey: string) => {
    setItemState((prev) => {
      const current = prev[itemKey] ?? getInitialItemState();
      return {
        ...prev,
        [itemKey]: {
          ...current,
          removed: false,
          checked: !current.checked,
        },
      };
    });
  };

  const handlePriceChange = (itemKey: string, value: string) => {
    setItemState((prev) => {
      const current = prev[itemKey] ?? getInitialItemState();
      return {
        ...prev,
        [itemKey]: {
          ...current,
          price: value,
        },
      };
    });
  };

  const handleQuantityChange = (itemKey: string, value: string) => {
    setItemState((prev) => {
      const current = prev[itemKey] ?? getInitialItemState();
      return {
        ...prev,
        [itemKey]: {
          ...current,
          quantity: value,
        },
      };
    });
  };

  const toggleRemoved = (itemKey: string) => {
    setItemState((prev) => {
      const current = prev[itemKey] ?? getInitialItemState();
      const nextRemoved = !current.removed;
      return {
        ...prev,
        [itemKey]: {
          ...current,
          removed: nextRemoved,
          checked: nextRemoved ? false : current.checked,
        },
      };
    });
  };

  const optionMap = useMemo(() => {
    const map = new Map<string, CatalogProductOption>();
    catalogOptions.forEach((option) => {
      map.set(normalizeKey(option.id), option);
      if (option.sku) map.set(normalizeKey(option.sku), option);
    });
    return map;
  }, [catalogOptions]);

  const isDislikedOption = useCallback(
    (option: CatalogProductOption) => {
      if (!dislikeTerms.length) return false;
      const candidateId = normalizeKey(option.id);
      const candidateSku = normalizeKey(option.sku);
      const candidateName = normalizeKey(option.name);
      return dislikeTerms.some((term) => {
        if (term === candidateId || term === candidateSku) return true;
        return candidateName.includes(term) || term.includes(candidateName);
      });
    },
    [dislikeTerms],
  );

  const resolveOptionFromInput = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim();
      if (!trimmed) return null;
      const direct = optionMap.get(normalizeKey(trimmed));
      if (direct) return direct;
      const beforePipe = trimmed.split("|")[0]?.trim() || trimmed;
      const byPipe = optionMap.get(normalizeKey(beforePipe));
      return byPipe || null;
    },
    [optionMap],
  );

  const handleReplacementChange = (itemKey: string, rawValue: string) => {
    const resolved = resolveOptionFromInput(rawValue);
    if (!resolved) {
      setItemState((prev) => {
        const current = prev[itemKey] ?? getInitialItemState();
        return {
          ...prev,
          [itemKey]: {
            ...current,
            replacementInput: rawValue,
            replacementId: undefined,
            replacementName: undefined,
            replacementPrice: undefined,
            replacementUnit: undefined,
          },
        };
      });
      return;
    }

    if (isDislikedOption(resolved)) {
      toast.error(`No permitido: cliente no desea ${resolved.name}`);
      return;
    }

    setItemState((prev) => {
      const current = prev[itemKey] ?? getInitialItemState();
      return {
        ...prev,
        [itemKey]: {
          ...current,
          replacementInput: resolved.id,
          replacementId: resolved.id,
          replacementName: resolved.name,
          replacementPrice: resolved.price,
          replacementUnit: resolved.unit,
          removed: false,
        },
      };
    });
  };

  const togglePreparedExpanded = (groupKey: string) => {
    setExpandedPrepared((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const toggleBoxExpanded = (groupKey: string) => {
    setExpandedBoxes((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const isLeafResolved = useCallback(
    (leafItemKey: string) => {
      const state = itemState[leafItemKey];
      return Boolean(state?.removed || state?.checked);
    },
    [itemState],
  );

  const completedBoxMap = useMemo(() => {
    const map = new Map<string, boolean>();
    boxGroups.forEach((group) => {
      const completed = group.items.length > 0 && group.items.every((item) => isLeafResolved(item.key));
      map.set(group.key, completed);
    });
    return map;
  }, [boxGroups, isLeafResolved]);

  const completedPreparedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    preparedGroups.forEach((group) => {
      const completed =
        group.ingredients.length > 0 &&
        group.ingredients.every((ingredient) => isLeafResolved(ingredient.key));
      map.set(group.key, completed);
    });
    return map;
  }, [preparedGroups, isLeafResolved]);

  const checkedCount = useMemo(() => {
    const checkedDirect = directItems.reduce(
      (count, item) => (isLeafResolved(item.key) ? count + 1 : count),
      0,
    );
    const checkedBoxes = boxGroups.reduce(
      (count, group) => (completedBoxMap.get(group.key) ? count + 1 : count),
      0,
    );
    const checkedPrepared = preparedGroups.reduce(
      (count, group) => (completedPreparedMap.get(group.key) ? count + 1 : count),
      0,
    );
    return checkedDirect + checkedBoxes + checkedPrepared;
  }, [directItems, boxGroups, preparedGroups, completedBoxMap, completedPreparedMap, isLeafResolved]);

  const checklistTotal = directItems.length + boxGroups.length + preparedGroups.length;
  const progress = checklistTotal > 0 ? (checkedCount / checklistTotal) * 100 : 0;

  useEffect(() => {
    if (!onChecklistStatusChange) return;
    onChecklistStatusChange({
      isComplete: checklistTotal > 0 && checkedCount === checklistTotal,
      checkedCount,
      totalCount: checklistTotal,
    });
  }, [onChecklistStatusChange, checkedCount, checklistTotal]);

  const marketCostTotal = useMemo(() => {
    return leafItems.reduce((sum, leafItem) => {
      const state = itemState[leafItem.key];
      if (state?.removed) return sum;
      const effectiveQuantity = Math.max(0, parseNumber(state?.quantity, leafItem.quantity));
      const overrideUnitPrice = state ? parseCost(state.price) : null;
      const replacementUnitPrice =
        state && typeof state.replacementPrice === "number" ? state.replacementPrice : null;
      const effectiveUnitPrice = overrideUnitPrice ?? replacementUnitPrice ?? leafItem.estimatedPrice;
      const lineTotal = effectiveUnitPrice * effectiveQuantity;
      return sum + lineTotal;
    }, 0);
  }, [leafItems, itemState, parseCost]);

  const profit = orderTotal - marketCostTotal;
  const profitClass = profit > 0 ? "text-emerald-700" : profit < 0 ? "text-red-600" : "text-slate-600";
  const profitCardClass = profit > 0
    ? "border-emerald-200 bg-emerald-50"
    : profit < 0
      ? "border-red-200 bg-red-50"
      : "border-slate-200 bg-slate-50";

  const saveLabel = saveState === "saving"
    ? "Guardando..."
    : saveState === "error"
      ? "Error al guardar"
      : saveState === "saved"
        ? "Guardado"
        : "";

  const handlePrint = () => {
    window.print();
  };

  const renderLeafItem = (leafItem: LeafChecklistItem, compact = false) => {
    const state = itemState[leafItem.key] ?? getInitialItemState();
    const isRemoved = Boolean(state.removed);
    const effectiveQuantity = Math.max(0, parseNumber(state.quantity, leafItem.quantity));
    const overrideUnitPrice = parseCost(state.price);
    const replacementUnitPrice =
      typeof state.replacementPrice === "number" ? state.replacementPrice : null;
    const effectiveUnitPrice = overrideUnitPrice ?? replacementUnitPrice ?? leafItem.estimatedPrice;
    const lineTotal = isRemoved ? 0 : effectiveUnitPrice * effectiveQuantity;
    const displayName = state.replacementName || leafItem.name;
    const displayId = state.replacementId || leafItem.id;
    const isIngredient = (leafItem.category || "").toLowerCase().includes("ingrediente");
    const IngredientIcon = getIngredientIcon(leafItem.category);
    const hasReplacement = Boolean(state.replacementId);
    const replacementIsLiked =
      hasReplacement &&
      likeTerms.some((term) => normalizeKey(displayName).includes(term) || normalizeKey(displayId) === term);
    const replacementBlocked =
      hasReplacement &&
      dislikeTerms.some((term) => normalizeKey(displayName).includes(term) || normalizeKey(displayId) === term);
    const replacementListId = `replacement-options-${normalizeKey(leafItem.key).replace(/[^a-z0-9_-]/g, "-")}`;

    return (
      <div
        key={leafItem.key}
        className={`w-full flex items-center gap-3 rounded-xl border transition ${
          compact ? "p-2.5" : "p-3"
        } ${
          isRemoved
            ? "bg-rose-50 border-rose-200"
            : state.checked
            ? "bg-emerald-50 border-emerald-200"
            : "bg-white/50 border-gray-200"
        }`}
      >
        {isIngredient ? (
          <div
            className={`rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 ${
              compact ? "h-10 w-10" : "h-12 w-12"
            }`}
          >
            <IngredientIcon className={`${compact ? "h-5 w-5" : "h-6 w-6"} text-emerald-600`} />
          </div>
        ) : (
          <ItemThumbnail
            id={displayId}
            alt={displayName}
            kind="product"
            className={`rounded-lg object-cover flex-shrink-0 ${compact ? "h-10 w-10" : "h-12 w-12"}`}
          />
        )}
        <button
          type="button"
          onClick={() => toggleItem(leafItem.key)}
          disabled={isRemoved}
          className="flex items-center gap-3 flex-1 text-left disabled:opacity-50"
        >
          {state.checked ? (
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium truncate ${
                state.checked || isRemoved ? "line-through text-gray-500" : "text-gray-900"
              }`}
            >
              {displayName}
            </p>
            <p className="text-xs text-gray-500">
              {leafItem.sourceLabel}
            </p>
            {hasReplacement && (
              <p className="text-xs text-amber-700">
                Reemplazo: {leafItem.name} {"->"} {displayName}
              </p>
            )}
            {replacementIsLiked && (
              <p className="text-xs text-emerald-700">Preferencia del cliente: le gusta este producto</p>
            )}
            {replacementBlocked && (
              <p className="inline-flex items-center gap-1 text-xs text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Advertencia: este producto aparece en dislikes
              </p>
            )}
            <p className="text-xs text-gray-500">
              Sistema: {currencyFormatter.format(leafItem.estimatedPrice)} / {leafItem.unit}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={state.quantity || String(leafItem.quantity)}
            onChange={(event) => handleQuantityChange(leafItem.key, event.target.value)}
            className="w-20 rounded-lg border border-gray-200 bg-white/80 px-2 py-1 text-sm text-right focus:border-emerald-400 focus:outline-none"
            title="Cantidad a comprar"
          />
          <span className="text-xs text-gray-500 whitespace-nowrap">{state.replacementUnit || leafItem.unit}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder={leafItem.estimatedPrice > 0 ? String(leafItem.estimatedPrice) : "Precio"}
            value={state.price}
            onChange={(event) => handlePriceChange(leafItem.key, event.target.value)}
            className="w-28 rounded-lg border border-gray-200 bg-white/80 px-2 py-1 text-sm text-right focus:border-emerald-400 focus:outline-none"
            title="Precio unitario actualizado"
          />
          <div className="relative">
            <input
              list={replacementListId}
              value={state.replacementInput}
              onChange={(event) => handleReplacementChange(leafItem.key, event.target.value)}
              placeholder="Reemplazar"
              className="w-44 rounded-lg border border-gray-200 bg-white/80 px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
              title="Reemplazar por otro producto"
            />
            <datalist id={replacementListId}>
              {catalogOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.sku} - {option.name}
                </option>
              ))}
            </datalist>
          </div>
          <button
            type="button"
            onClick={() => toggleRemoved(leafItem.key)}
            className={`rounded-lg p-2 transition ${
              isRemoved
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-rose-100 text-rose-700 hover:bg-rose-200"
            }`}
            title={isRemoved ? "Restaurar producto" : "Quitar de preparación"}
          >
            {isRemoved ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          </button>
          <div className="w-28 text-right">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-sm font-semibold text-gray-800">{currencyFormatter.format(lineTotal)}</p>
          </div>
        </div>
      </div>
    );
  };

  const hasChecklistData = checklistTotal > 0;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/60">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">
            Lista de Compras - Mercado
          </h3>
          <p className="text-sm text-[var(--gd-color-text-muted)]">
            {checkedCount} de {checklistTotal} productos completados
          </p>
          {saveLabel && (
            <p className={`text-xs ${saveState === "error" ? "text-red-600" : "text-slate-500"}`}>
              {saveLabel}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 hover:bg-white/80 border border-gray-200 text-sm font-medium text-gray-700"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      <div className="mb-4 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Costo Mercado</p>
          <p className="text-lg font-semibold text-gray-900">
            {currencyFormatter.format(marketCostTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Precio Venta</p>
          <p className="text-lg font-semibold text-gray-900">
            {currencyFormatter.format(orderTotal)}
          </p>
        </div>
        <div className={`rounded-2xl border p-4 ${profitCardClass}`}>
          <p className="text-xs uppercase tracking-wide text-gray-500">Ganancia / Pérdida</p>
          <p className={`text-lg font-semibold ${profitClass}`}>
            {currencyFormatter.format(profit)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {boxGroups.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Cajas</h4>
            {boxGroups.map((group) => {
              const isExpanded = Boolean(expandedBoxes[group.key]);
              const itemsChecked = group.items.reduce(
                (count, item) => (isLeafResolved(item.key) ? count + 1 : count),
                0,
              );
              const isBoxComplete = Boolean(completedBoxMap.get(group.key));
              const boxMarketCost = group.items.reduce((sum, item) => {
                const state = itemState[item.key];
                if (state?.removed) return sum;
                const quantity = Math.max(0, parseNumber(state?.quantity, item.quantity));
                const overrideUnitPrice = state ? parseCost(state.price) : null;
                const replacementUnitPrice =
                  state && typeof state.replacementPrice === "number" ? state.replacementPrice : null;
                const unitPrice = overrideUnitPrice ?? replacementUnitPrice ?? item.estimatedPrice;
                return sum + unitPrice * quantity;
              }, 0);
              const boxSystemCost = group.items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity), 0);
              return (
                <div
                  key={group.key}
                  className={`w-full rounded-xl border transition ${
                    isBoxComplete ? "bg-emerald-50 border-emerald-200" : "bg-white/50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => toggleBoxExpanded(group.key)}
                      className="rounded-md p-1 hover:bg-slate-100 text-slate-600"
                      aria-label={isExpanded ? "Ocultar productos de caja" : "Mostrar productos de caja"}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isBoxComplete ? (
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <ItemThumbnail
                      id={group.boxId}
                      alt={group.name}
                      kind="box"
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-gray-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isBoxComplete ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {group.name} ({group.variant}) {group.instanceLabel || ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        caja · {itemsChecked}/{group.items.length} productos listos
                      </p>
                      <p className="text-xs text-gray-500">
                        Precio caja: {currencyFormatter.format(group.boxUnitPrice || 0)} · Costo sistema: {currencyFormatter.format(boxSystemCost)} · Costo mercado: {currencyFormatter.format(boxMarketCost)}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pb-3 pr-3 pl-11 space-y-2">
                      {group.items.map((item) => renderLeafItem(item, true))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {preparedGroups.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Elaborados</h4>
            {preparedGroups.map((group) => {
              const isExpanded = Boolean(expandedPrepared[group.key]);
              const ingredientsChecked = group.ingredients.reduce(
                (count, ingredient) => (isLeafResolved(ingredient.key) ? count + 1 : count),
                0,
              );
              const isPreparedComplete = Boolean(completedPreparedMap.get(group.key));
              const preparedMarketCost = group.ingredients.reduce((sum, ingredient) => {
                const state = itemState[ingredient.key];
                if (state?.removed) return sum;
                const quantity = Math.max(0, parseNumber(state?.quantity, ingredient.quantity));
                const overrideUnitPrice = state ? parseCost(state.price) : null;
                const replacementUnitPrice =
                  state && typeof state.replacementPrice === "number" ? state.replacementPrice : null;
                const unitPrice = overrideUnitPrice ?? replacementUnitPrice ?? ingredient.estimatedPrice;
                return sum + unitPrice * quantity;
              }, 0);
              return (
                <div
                  key={group.key}
                  className={`w-full rounded-xl border transition ${
                    isPreparedComplete
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => togglePreparedExpanded(group.key)}
                      className="rounded-md p-1 hover:bg-slate-100 text-slate-600"
                      aria-label={isExpanded ? "Ocultar ingredientes" : "Mostrar ingredientes"}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isPreparedComplete ? (
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <ItemThumbnail
                      id={group.preparedProductId}
                      alt={group.name}
                      kind="product"
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-gray-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isPreparedComplete ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        elaborado · {ingredientsChecked}/{group.ingredients.length} ingredientes listos
                      </p>
                      <p className="text-xs text-gray-500">
                        Costo ingredientes mercado: {currencyFormatter.format(preparedMarketCost)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">×{group.quantity}</span>
                  </div>

                  {isExpanded && (
                    <div className="pb-3 pr-3 pl-11 space-y-2">
                      {group.ingredients.map((ingredient) => renderLeafItem(ingredient, true))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {directItems.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">A la carta</h4>
            {directItems.map((item) => renderLeafItem(item))}
          </section>
        )}
      </div>

      {!loading && shoppingListStatus !== "loading" && !hasChecklistData && (
        <p className="mt-4 text-sm text-slate-500">No hay items para mostrar.</p>
      )}

      {shoppingListStatus === "loading" && (
        <p className="mt-4 text-sm text-slate-500">Cargando lista de compras...</p>
      )}

      {checkedCount === checklistTotal && checklistTotal > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-sm font-medium text-emerald-700 text-center">
            ✓ Lista completa - Listo para preparar el pedido
          </p>
        </div>
      )}

      <style>{`
        @media print {
          button,
          input {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
