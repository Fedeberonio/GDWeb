import admin from "firebase-admin";

import serviceAccount from "../service-account.json";
import { normalizeCatalogProduct } from "../src/modules/catalog/product-normalization";
import type { Box, Product } from "../src/modules/catalog/types";

type FirestoreRecord = Record<string, unknown>;
type CatalogBoxDoc = Box & { status?: string; image?: string };

const BOX_FRONTEND_DEFAULTS: Record<string, { durationDays?: number; weightLabel?: string }> = {
  "GD-CAJA-001": { durationDays: 3, weightLabel: "~3.5 kg / 7.7 lb" },
  "GD-CAJA-002": { durationDays: 7, weightLabel: "~6 kg / 13.2 lb" },
  "GD-CAJA-003": { durationDays: 14, weightLabel: "~12 kg / 26.5 lb" },
};

const PRODUCT_FRONTEND_HINTS: Record<string, { addTags?: string[]; setFeatured?: boolean }> = {
  "GD-CASE-004": { addTags: ["dip"] },
  "GD-CASE-005": { addTags: ["dip"] },
  "GD-CASE-006": { addTags: ["dip"] },
  "GD-JUGO-012": { setFeatured: true },
  "GD-JUGO-013": { setFeatured: true },
};

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const shouldVerbose = args.has("--verbose");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeJsonValue(entry)]),
    );
  }

  return value;
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(normalizeJsonValue(left)) === JSON.stringify(normalizeJsonValue(right));
}

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean),
    ),
  );
}

function resolveQuantity(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeVariantKey(value?: string) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("mix")) return "mix";
  if (normalized.includes("frut") || normalized.includes("frui") || normalized.includes("fruit")) return "fruity";
  if (normalized.includes("veggie") || normalized.includes("veg")) return "veggie";
  return null;
}

function buildProductLookup(products: Product[]) {
  const lookup = new Map<string, Product>();

  products.forEach((product) => {
    [product.sku, product.id, product.slug, product.name.es, product.name.en].forEach((value) => {
      const key = typeof value === "string" ? normalizeSearch(value) : "";
      if (key && !lookup.has(key)) {
        lookup.set(key, product);
      }
    });
  });

  return lookup;
}

function findProduct(
  lookup: Map<string, Product>,
  productId?: string,
  productSlug?: string,
  nameEs?: string,
  nameEn?: string,
) {
  for (const candidate of [productId, productSlug, nameEs, nameEn]) {
    const key = typeof candidate === "string" ? normalizeSearch(candidate) : "";
    if (!key) continue;
    const product = lookup.get(key);
    if (product) return product;
  }

  return null;
}

function buildProductPatch(docId: string, rawData: FirestoreRecord) {
  const normalized = normalizeCatalogProduct(docId, rawData);
  const patch: FirestoreRecord = {};
  const frontendHints = PRODUCT_FRONTEND_HINTS[docId];

  const currentName = rawData.name;
  const currentNameRecord =
    currentName && typeof currentName === "object" ? (currentName as Record<string, unknown>) : null;
  const shouldSyncName =
    !currentNameRecord ||
    typeof currentNameRecord.es !== "string" ||
    typeof currentNameRecord.en !== "string";
  if (shouldSyncName && !sameJson(currentName, normalized.name)) {
    patch.name = normalized.name;
  }

  const fieldsToSync: Array<[keyof FirestoreRecord, unknown]> = [
    ["id", docId],
    ["sku", normalized.sku],
    ["slug", normalized.slug],
    ["categoryId", normalized.categoryId],
    ["type", normalized.type],
    ["status", normalized.status],
    ["isActive", normalized.isActive],
    ["image", normalized.image],
    ["price", normalized.price],
  ];

  fieldsToSync.forEach(([key, value]) => {
    if (!sameJson(rawData[key], value)) {
      patch[key] = value;
    }
  });

  if (frontendHints?.addTags?.length) {
    const currentTags = normalizeStringArray(rawData.tags);
    const nextTags = Array.from(new Set([...currentTags, ...frontendHints.addTags])).sort((left, right) =>
      left.localeCompare(right, "es"),
    );
    if (!sameJson(currentTags, nextTags)) {
      patch.tags = nextTags;
    }
  }

  if (frontendHints?.setFeatured && rawData.isFeatured !== true) {
    patch.isFeatured = true;
  }

  return { normalized, patch };
}

function buildBoxMirrorProductPatch(
  boxId: string,
  boxData: Pick<
    CatalogBoxDoc,
    "slug" | "name" | "description" | "price" | "heroImage" | "isFeatured" | "status" | "durationDays" | "weightLabel" | "dimensionsLabel"
  >,
  currentMirror: FirestoreRecord,
) {
  const payload = {
    id: boxId,
    sku: boxId,
    slug: boxData.slug || boxId.toLowerCase(),
    name: boxData.name,
    description: boxData.description,
    price: Number(boxData.price?.amount ?? 0),
    image: boxData.heroImage ?? `/assets/images/boxes/${boxId}.png`,
    isFeatured: boxData.isFeatured ?? false,
    weightLabel: boxData.weightLabel,
    dimensionsLabel: boxData.dimensionsLabel,
    status: boxData.status === "active" ? "active" : "inactive",
    isActive: boxData.status === "active",
    type: "box",
    categoryId: "cajas",
  } as FirestoreRecord;

  if (typeof boxData.durationDays === "number" && boxData.durationDays > 0) {
    const currentAttributes =
      currentMirror.attributes && typeof currentMirror.attributes === "object"
        ? (currentMirror.attributes as FirestoreRecord)
        : {};
    payload.attributes = {
      ...currentAttributes,
      duration: `${boxData.durationDays} dias`,
    };
  }

  return payload;
}

async function main() {
  const productSnapshot = await db.collection("catalog_products").get();
  const rawProducts = productSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: (doc.data() ?? {}) as FirestoreRecord,
  }));
  const rawProductsById = new Map(rawProducts.map((entry) => [entry.id, entry.data]));

  const normalizedProducts = rawProducts.map(({ id, data }) => normalizeCatalogProduct(id, data));
  const productLookup = buildProductLookup(normalizedProducts);

  const duplicateGroups = new Map<string, Product[]>();
  normalizedProducts.forEach((product) => {
    const key = normalizeSearch(product.name.es || product.name.en || product.sku || product.id);
    if (!key) return;
    duplicateGroups.set(key, [...(duplicateGroups.get(key) ?? []), product]);
  });
  const duplicates = Array.from(duplicateGroups.entries())
    .filter(([, products]) => products.length > 1)
    .map(([key, products]) => ({
      key,
      ids: products.map((product) => product.id),
      labels: products.map((product) => ({
        id: product.id,
        sku: product.sku,
        status: product.status,
        type: product.type,
        categoryId: product.categoryId,
      })),
    }))
    .sort((left, right) => right.ids.length - left.ids.length);
  const unresolvedDuplicates = duplicates.filter((duplicate) => {
    const activeLikeEntries = duplicate.labels.filter((product) => {
      const status = String(product.status ?? "").toLowerCase();
      return status !== "discontinued" && status !== "hidden";
    });
    return activeLikeEntries.length > 1;
  });

  const productWrites: Array<{ ref: FirebaseFirestore.DocumentReference; patch: FirestoreRecord }> = [];
  rawProducts.forEach(({ id, data }) => {
    const { patch } = buildProductPatch(id, data);
    if (Object.keys(patch).length > 0) {
      productWrites.push({ ref: db.collection("catalog_products").doc(id), patch });
    }
  });

  const boxSnapshot = await db.collection("catalog_boxes").get();
  const boxRuleSnapshot = await db.collection("catalog_box_rules").get();
  const rawBoxRulesById = new Map(
    boxRuleSnapshot.docs.map((doc) => [doc.id, (doc.data() ?? {}) as FirestoreRecord]),
  );
  const rawBoxes = boxSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: (doc.data() ?? {}) as FirestoreRecord,
  }));

  const boxWrites: Array<{ ref: FirebaseFirestore.DocumentReference; patch: FirestoreRecord }> = [];
  const boxMirrorWrites: Array<{ ref: FirebaseFirestore.DocumentReference; patch: FirestoreRecord }> = [];
  const boxRuleWrites: Array<{ ref: FirebaseFirestore.DocumentReference; patch: FirestoreRecord }> = [];

  rawBoxes.forEach(({ id, data }) => {
    const boxData = {
      ...(data as CatalogBoxDoc),
      id,
    } as CatalogBoxDoc;
    const boxDefaults = BOX_FRONTEND_DEFAULTS[id];

    const nextVariants = (boxData.variants ?? []).map((variant) => ({
      ...variant,
      referenceContents: (variant.referenceContents ?? []).map((content) => {
        const matchedProduct = findProduct(
          productLookup,
          trimString(content.productId),
          trimString((content as { productSlug?: unknown }).productSlug),
          trimString(content.name?.es),
          trimString(content.name?.en),
        );

        return {
          ...content,
          productId: matchedProduct?.sku ?? matchedProduct?.id ?? trimString(content.productId),
          name: matchedProduct
            ? matchedProduct.name
            : {
                es: trimString(content.name?.es) || trimString(content.name?.en) || trimString(content.productId),
                en: trimString(content.name?.en) || trimString(content.name?.es) || trimString(content.productId),
              },
          quantity: resolveQuantity(content.quantity),
        };
      }),
    }));

    const boxPatch: FirestoreRecord = {};
    const expectedSlug = trimString(boxData.slug) || id.toLowerCase();
    const expectedHeroImage = trimString(boxData.heroImage) || trimString((boxData as { image?: unknown }).image) || `/assets/images/boxes/${id}.png`;
    const expectedImage = trimString((boxData as { image?: unknown }).image) || expectedHeroImage;
    const expectedRuleId = trimString(boxData.ruleId) || id;
    const expectedStatus = trimString((boxData as { status?: unknown }).status) || "active";
    const expectedDurationDays =
      typeof boxData.durationDays === "number" && boxData.durationDays > 0
        ? boxData.durationDays
        : boxDefaults?.durationDays;
    const expectedWeightLabel = trimString(boxData.weightLabel) || trimString(boxDefaults?.weightLabel);

    if (!sameJson(boxData.slug, expectedSlug)) boxPatch.slug = expectedSlug;
    if (!sameJson(boxData.heroImage, expectedHeroImage)) boxPatch.heroImage = expectedHeroImage;
    if (!sameJson((boxData as { image?: unknown }).image, expectedImage)) boxPatch.image = expectedImage;
    if (!sameJson(boxData.ruleId, expectedRuleId)) boxPatch.ruleId = expectedRuleId;
    if (!sameJson((boxData as { status?: unknown }).status, expectedStatus)) boxPatch.status = expectedStatus;
    if (!sameJson(boxData.durationDays, expectedDurationDays)) boxPatch.durationDays = expectedDurationDays;
    if (!sameJson(boxData.weightLabel, expectedWeightLabel || undefined)) {
      boxPatch.weightLabel = expectedWeightLabel || undefined;
    }
    if (!sameJson(boxData.variants, nextVariants)) boxPatch.variants = nextVariants;

    if (Object.keys(boxPatch).length > 0) {
      boxWrites.push({ ref: db.collection("catalog_boxes").doc(id), patch: boxPatch });
    }

    const normalizedBoxData = {
      ...boxData,
      slug: expectedSlug,
      heroImage: expectedHeroImage,
      ruleId: expectedRuleId,
      status: expectedStatus,
      durationDays: expectedDurationDays,
      weightLabel: expectedWeightLabel || undefined,
    } satisfies CatalogBoxDoc;

    const currentMirror = rawProductsById.get(id) ?? {};
    const mirrorPatch = buildBoxMirrorProductPatch(id, normalizedBoxData, currentMirror);
    const mirrorDiff = Object.fromEntries(
      Object.entries(mirrorPatch).filter(([key, value]) => !sameJson(currentMirror[key], value)),
    );
    if (Object.keys(mirrorDiff).length > 0) {
      boxMirrorWrites.push({ ref: db.collection("catalog_products").doc(id), patch: mirrorDiff });
    }

    const mixVariant =
      nextVariants.find((variant) => normalizeVariantKey(variant.slug) === "mix") ??
      nextVariants.find((variant) => normalizeVariantKey(variant.id) === "mix") ??
      nextVariants[0];
    const baseContents =
      mixVariant?.referenceContents?.map((content) => ({
        productSku: trimString(content.productId).toUpperCase(),
        quantity: resolveQuantity(content.quantity),
      }))?.filter((item) => item.productSku) ?? [];
    const variantContents = nextVariants.reduce<Record<string, Array<{ productSku: string; quantity: number }>>>(
      (acc, variant) => {
        const key = normalizeVariantKey(variant.slug) ?? normalizeVariantKey(variant.id);
        if (!key) return acc;
        acc[key] = (variant.referenceContents ?? [])
          .map((content) => ({
            productSku: trimString(content.productId).toUpperCase(),
            quantity: resolveQuantity(content.quantity),
          }))
          .filter((item) => item.productSku);
        return acc;
      },
      {},
    );

    const rulePatch = {
      displayName: normalizedBoxData.name?.es ?? normalizedBoxData.name?.en ?? id,
      baseContents,
      variantContents,
    };
    const currentRule = rawBoxRulesById.get(expectedRuleId) ?? {};
    const ruleDiff = Object.fromEntries(
      Object.entries(rulePatch).filter(([key, value]) => !sameJson(currentRule[key], value)),
    );
    if (Object.keys(ruleDiff).length > 0) {
      boxRuleWrites.push({
        ref: db.collection("catalog_box_rules").doc(expectedRuleId),
        patch: ruleDiff,
      });
    }
  });

  console.log(`Catalog products scanned: ${rawProducts.length}`);
  console.log(`Catalog product docs needing patch: ${productWrites.length}`);
  console.log(`Catalog boxes scanned: ${rawBoxes.length}`);
  console.log(`Catalog box docs needing patch: ${boxWrites.length}`);
  console.log(`Catalog box mirror product docs to sync: ${boxMirrorWrites.length}`);
  console.log(`Catalog box rule docs to sync: ${boxRuleWrites.length}`);
  console.log(`Duplicate product groups detected: ${duplicates.length}`);
  console.log(`Unresolved duplicate groups: ${unresolvedDuplicates.length}`);

  if (duplicates.length > 0) {
    console.log("Top duplicate groups:");
    duplicates.slice(0, 12).forEach((duplicate) => {
      console.log(`- ${duplicate.key}: ${duplicate.ids.join(", ")}`);
    });
  }

  if (unresolvedDuplicates.length > 0) {
    console.log("Top unresolved duplicate groups:");
    unresolvedDuplicates.slice(0, 12).forEach((duplicate) => {
      console.log(`- ${duplicate.key}: ${duplicate.ids.join(", ")}`);
    });
  }

  if (shouldVerbose) {
    const sampleProductPatches = productWrites.slice(0, 10).map(({ ref, patch }) => ({
      id: ref.id,
      patch,
    }));
    const sampleBoxPatches = boxWrites.slice(0, 10).map(({ ref, patch }) => ({
      id: ref.id,
      patch,
    }));
    const sampleMirrorPatches = boxMirrorWrites.slice(0, 10).map(({ ref, patch }) => ({
      id: ref.id,
      patch,
    }));
    const sampleRulePatches = boxRuleWrites.slice(0, 10).map(({ ref, patch }) => ({
      id: ref.id,
      patch,
    }));
    console.log("Sample product patches:");
    console.log(JSON.stringify(sampleProductPatches, null, 2));
    console.log("Sample box patches:");
    console.log(JSON.stringify(sampleBoxPatches, null, 2));
    console.log("Sample box mirror patches:");
    console.log(JSON.stringify(sampleMirrorPatches, null, 2));
    console.log("Sample box rule patches:");
    console.log(JSON.stringify(sampleRulePatches, null, 2));
  }

  if (!shouldWrite) {
    console.log("Dry run only. Re-run with --write to apply.");
    return;
  }

  const allWrites = [
    ...productWrites,
    ...boxWrites,
    ...boxMirrorWrites,
    ...boxRuleWrites,
  ];

  let batch = db.batch();
  let operationCount = 0;
  let committed = 0;
  const now = new Date().toISOString();

  for (const { ref, patch } of allWrites) {
    batch.set(ref, { ...patch, updatedAt: now }, { merge: true });
    operationCount += 1;

    if (operationCount === 400) {
      await batch.commit();
      committed += operationCount;
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    committed += operationCount;
  }

  console.log(`Applied ${committed} document updates.`);
}

main().catch((error) => {
  console.error("sanitize-catalog-data failed:", error);
  process.exitCode = 1;
});
