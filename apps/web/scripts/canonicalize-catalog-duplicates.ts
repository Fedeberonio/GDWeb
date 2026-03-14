import admin from "firebase-admin";

import serviceAccount from "../service-account.json";
import { normalizeCatalogProduct } from "../src/modules/catalog/product-normalization";
import type { Product } from "../src/modules/catalog/types";

type FirestoreRecord = Record<string, unknown>;

const SAFE_ALIAS_TO_CANONICAL: Record<string, string> = {
  "GD-ING-005": "GD-VEGE-048",
  "GD-ING-006": "GD-VEGE-050",
  "GD-ING-013": "GD-FRUT-038",
  "GD-INGR-001": "GD-VEGE-050",
  "GD-INGR-005": "GD-FRUT-024",
  "GD-INGR-006": "GD-VEGE-053",
  "GD-INGR-009": "GD-VEGE-012",
  "GD-INGR-013": "GD-HIER-071",
  "GD-INGR-017": "GD-ING-020",
  "GD-INGR-022": "GD-VEGE-067",
  "GD-INGR-026": "GD-FRUT-030",
  "GD-INGR-027": "GD-FRUT-039",
  "GD-INGR-030": "GD-HIER-070",
  "GD-INGR-031": "GD-OTRO-021",
  "GD-INGR-032": "GD-HIER-075",
  "GD-INGR-039": "GD-VEGE-061",
  "GD-INGR-040": "GD-HIER-072",
  "GD-INGR-041": "GD-VEGE-047",
  "GD-INGR-045": "GD-VEGE-044",
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

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, "es"));
}

function localizedNameForProduct(product: Product) {
  const fallback = product.sku ?? product.id;
  return {
    es: product.name.es || product.name.en || fallback,
    en: product.name.en || product.name.es || fallback,
  };
}

async function main() {
  const productSnapshot = await db.collection("catalog_products").get();
  const rawProducts = productSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: (doc.data() ?? {}) as FirestoreRecord,
  }));
  const rawById = new Map(rawProducts.map((entry) => [entry.id, entry.data]));
  const normalizedById = new Map(
    rawProducts.map(({ id, data }) => [id, normalizeCatalogProduct(id, data)]),
  );

  const aliasDocWrites: Array<{ ref: FirebaseFirestore.DocumentReference; patch: FirestoreRecord }> = [];
  const recipeWrites: Array<{ ref: FirebaseFirestore.DocumentReference; patch: FirestoreRecord }> = [];

  Object.entries(SAFE_ALIAS_TO_CANONICAL).forEach(([aliasId, canonicalId]) => {
    const aliasData = rawById.get(aliasId);
    const canonicalProduct = normalizedById.get(canonicalId);
    if (!aliasData || !canonicalProduct) return;

    const currentMetadata =
      aliasData.metadata && typeof aliasData.metadata === "object"
        ? (aliasData.metadata as FirestoreRecord)
        : {};
    const currentTags = normalizeTags(aliasData.tags);
    const nextTags = normalizeTags([...currentTags, "legacy-alias"]);
    const nextMetadata = {
      ...currentMetadata,
      aliasOf: canonicalProduct.sku ?? canonicalProduct.id,
      aliasState: "archived",
    };

    const patch: FirestoreRecord = {};
    if (aliasData.status !== "discontinued") patch.status = "discontinued";
    if (aliasData.isActive !== false) patch.isActive = false;
    if (!sameJson(currentTags, nextTags)) patch.tags = nextTags;
    if (!sameJson(aliasData.metadata, nextMetadata)) patch.metadata = nextMetadata;

    if (Object.keys(patch).length > 0) {
      aliasDocWrites.push({
        ref: db.collection("catalog_products").doc(aliasId),
        patch,
      });
    }
  });

  rawProducts.forEach(({ id, data }) => {
    const recipe = data.recipe as { ingredients?: unknown } | undefined;
    const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
    if (!ingredients.length) return;

    const nextIngredients = ingredients.map((ingredient) => {
      if (!ingredient || typeof ingredient !== "object") return ingredient;
      const current = ingredient as FirestoreRecord;
      const aliasId = trimString(current.productId).toUpperCase();
      const canonicalId = SAFE_ALIAS_TO_CANONICAL[aliasId];
      if (!canonicalId) return ingredient;

      const canonicalProduct = normalizedById.get(canonicalId);
      if (!canonicalProduct) return ingredient;

      return {
        ...current,
        productId: canonicalProduct.sku ?? canonicalProduct.id,
        name: localizedNameForProduct(canonicalProduct),
      };
    });

    if (!sameJson(ingredients, nextIngredients)) {
      recipeWrites.push({
        ref: db.collection("catalog_products").doc(id),
        patch: {
          recipe: {
            ...(recipe && typeof recipe === "object" ? recipe : {}),
            ingredients: nextIngredients,
          },
        },
      });
    }
  });

  const recipeAliasHits = recipeWrites.map(({ ref, patch }) => ({
    id: ref.id,
    ingredients:
      (((patch.recipe as { ingredients?: unknown } | undefined)?.ingredients as Array<{ productId?: string }> | undefined) ?? [])
        .map((ingredient) => ingredient.productId ?? "")
        .filter(Boolean),
  }));

  console.log(`Alias map entries: ${Object.keys(SAFE_ALIAS_TO_CANONICAL).length}`);
  console.log(`Alias docs needing archive patch: ${aliasDocWrites.length}`);
  console.log(`Product recipes needing canonical rewrite: ${recipeWrites.length}`);

  if (shouldVerbose) {
    console.log("Alias docs to archive:");
    console.log(
      JSON.stringify(
        aliasDocWrites.map(({ ref, patch }) => ({ id: ref.id, patch })),
        null,
        2,
      ),
    );
    console.log("Recipes to rewrite:");
    console.log(JSON.stringify(recipeAliasHits, null, 2));
  }

  if (!shouldWrite) {
    console.log("Dry run only. Re-run with --write to apply.");
    return;
  }

  const allWrites = [...aliasDocWrites, ...recipeWrites];
  const now = new Date().toISOString();
  let batch = db.batch();
  let operationCount = 0;
  let committed = 0;

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
  console.error("canonicalize-catalog-duplicates failed:", error);
  process.exitCode = 1;
});
