import fs from "fs";
import path from "path";
import admin from "firebase-admin";

type RewriteResult = { value: unknown; changed: boolean };

function loadServiceAccount(): admin.ServiceAccount {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inlineJson) {
    return JSON.parse(inlineJson) as admin.ServiceAccount;
  }

  const candidates = [
    path.join(process.cwd(), "service-account.json"),
    path.join(process.cwd(), "apps/web/service-account.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf8")) as admin.ServiceAccount;
    }
  }

  throw new Error("Missing Firebase service account credentials");
}

function rewriteAssetString(value: string): string {
  let next = value;

  next = next.replace(
    /\/assets\/images\/hero\/WelcomeBillboard\.png/g,
    "/assets/images/hero/hero-welcome-banner.png",
  );
  next = next.replace(
    /\/assets\/images\/how-it-works\/ComoFuncionaSPA\.png/g,
    "/assets/images/how-it-works/how-it-works-es.png",
  );
  next = next.replace(
    /\/assets\/images\/how-it-works\/ComoFuncionaENG\.png/g,
    "/assets/images/how-it-works/how-it-works-en.png",
  );
  next = next.replace(
    /\/assets\/images\/icons\/Like\.png/g,
    "/assets/images/icons/icon-like.png",
  );
  next = next.replace(
    /\/assets\/images\/icons\/Dislike\.png/g,
    "/assets/images/icons/icon-dislike.png",
  );

  next = next.replace(/\/assets\/images\/how( |%20)it( |%20)works/g, "/assets/images/how-it-works");

  next = next.replace(/Productos_de_granja\.png/g, "productos-de-granja.png");
  next = next.replace(/productos_caseros\.png/g, "productos-caseros.png");
  next = next.replace(/hierbas_y_especias\.png/g, "hierbas-y-especias.png");
  next = next.replace(/Frutas\.png/g, "frutas.png");
  next = next.replace(/Vegetales\.png/g, "vegetales.png");
  next = next.replace(/Jugos\.png/g, "jugos.png");
  next = next.replace(/Otros\.png/g, "otros.png");

  next = next.replace(/\/assets\/images\/boxes\/([A-Za-z0-9-]+)\.jpg/g, "/assets/images/boxes/$1.png");
  next = next.replace(/\/assets\/images\/boxes\/(GD-CAJA-00[1-3]-topdown)\.jpg/g, "/assets/images/boxes/$1.png");
  next = next.replace(/\/assets\/images\/boxes\/placeholder\.jpg/g, "/assets/images/boxes/placeholder.png");
  next = next.replace(/\/assets\/images\/combos\/placeholder\.jpg/g, "/assets/images/combos/placeholder.png");

  return next;
}

const GHOST_FILENAMES = ["Eejt6s920Ttn5kROhXP8.png", "qocqodJknrMoYxabAi1V.png"];

function replaceGhostsInString(value: string, sku: string): RewriteResult {
  let next = value;
  let changed = false;
  for (const ghost of GHOST_FILENAMES) {
    if (!next.includes(ghost)) continue;
    const replacement = next.includes("/assets/images/products/")
      ? `/assets/images/products/${sku}.png`
      : `${sku}.png`;
    next = next.replace(new RegExp(ghost, "g"), replacement);
    changed = true;
  }
  return { value: next, changed };
}

function replaceGhostsInValue(value: unknown, sku: string): RewriteResult {
  if (typeof value === "string") {
    return replaceGhostsInString(value, sku);
  }

  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((entry) => {
      const result = replaceGhostsInValue(entry, sku);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: changed ? items : value, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const result = replaceGhostsInValue(entry, sku);
      if (result.changed) changed = true;
      output[key] = result.value;
    }
    return { value: changed ? output : value, changed };
  }

  return { value, changed: false };
}

function rewriteValue(value: unknown): RewriteResult {
  if (typeof value === "string") {
    const updated = rewriteAssetString(value);
    return { value: updated, changed: updated !== value };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((entry) => {
      const result = rewriteValue(entry);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: changed ? items : value, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const result = rewriteValue(entry);
      if (result.changed) changed = true;
      output[key] = result.value;
    }
    return { value: changed ? output : value, changed };
  }

  return { value, changed: false };
}

async function migrateCollection(collectionName: string) {
  const db = admin.firestore();
  const snapshot = await db.collection(collectionName).get();
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const result = rewriteValue(value);
      if (result.changed) {
        updates[key] = result.value;
      }
    }

    if (Object.keys(updates).length > 0) {
      await docSnap.ref.update(updates);
      updatedCount += 1;
      console.log(`[${collectionName}] updated ${docSnap.id}`, updates);
    }
  }

  console.log(`[${collectionName}] completed. Updated ${updatedCount} documents.`);
}

async function migrateGhostProductImages() {
  const db = admin.firestore();
  const snapshot = await db.collection("catalog_products").get();
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const rawSku = (data.sku ?? data.id ?? docSnap.id) as string;
    if (!rawSku) continue;
    const sku = String(rawSku).trim().toUpperCase();

    const result = replaceGhostsInValue(data, sku);
    if (result.changed && result.value && typeof result.value === "object") {
      await docSnap.ref.update(result.value as Record<string, unknown>);
      updatedCount += 1;
      console.log(`[catalog_products] updated ${docSnap.id} -> ${sku}.png`);
    }
  }

  console.log(`[catalog_products] ghost cleanup completed. Updated ${updatedCount} documents.`);
}

type LocalizedInput = Record<string, string> | string | undefined;

function buildLocalizedString(
  value?: LocalizedInput,
  fallbackEs?: string,
  fallbackEn?: string,
): { es: string; en: string } {
  if (typeof value === "string") {
    return { es: value, en: value };
  }
  const esCandidate = (value as Record<string, string>)?.es ?? fallbackEs ?? fallbackEn ?? "";
  const enCandidate = (value as Record<string, string>)?.en ?? fallbackEn ?? fallbackEs ?? esCandidate;
  const es = typeof esCandidate === "string" ? esCandidate : "";
  const en = typeof enCandidate === "string" ? enCandidate : es;
  return { es, en };
}

function getSuffixFallback(data: Record<string, unknown>, field: string, suffixes: string[]) {
  for (const suffix of suffixes) {
    const candidate = data[`${field}${suffix}`];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function collectLocalizedUpdates(field: string, data: Record<string, unknown>) {
  const localized = buildLocalizedString(
    data[field] as LocalizedInput,
    getSuffixFallback(data, field, ["_es", "Es"]),
    getSuffixFallback(data, field, ["_en", "En"]),
  );

  const updates: Record<string, unknown> = {};
  const currentValue = data[field];
  const needsObject =
    !currentValue ||
    typeof currentValue !== "object" ||
    (currentValue as Record<string, string>).es !== localized.es ||
    (currentValue as Record<string, string>).en !== localized.en;

  if (needsObject) {
    updates[field] = localized;
  }

  if ((data as Record<string, string>)[`${field}_es`] !== localized.es) {
    updates[`${field}_es`] = localized.es;
  }
  if ((data as Record<string, string>)[`${field}_en`] !== localized.en) {
    updates[`${field}_en`] = localized.en;
  }

  return updates;
}

async function ensureLocalizedCollection(collectionName: string, fields: string[]) {
  const db = admin.firestore();
  const snapshot = await db.collection(collectionName).get();
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const updates = fields.reduce((acc, field) => {
      const localizedUpdates = collectLocalizedUpdates(field, data);
      return { ...acc, ...localizedUpdates };
    }, {} as Record<string, unknown>);

    if (collectionName === "catalog_categories") {
      const slug = String(data.slug ?? data.id ?? docSnap.id);
      const translation = CATEGORY_TRANSLATIONS[slug];
      if (translation) {
        updates.name_en = translation.en;
        updates["name_en"] = translation.en;
        updates.name = { ...updates.name, en: translation.en };
        if (translation.description) {
          updates.description = translation.description;
          updates.description_es = translation.description.es;
          updates.description_en = translation.description.en;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await docSnap.ref.update(updates);
      updatedCount += 1;
      console.log(`[${collectionName}] ensured localized fields for ${docSnap.id}`, updates);
    }
  }

  console.log(
    `[${collectionName}] localization ensured. ${updatedCount} documents updated.`,
  );
}

async function main() {
  const serviceAccount = loadServiceAccount();
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  await migrateCollection("catalog_categories");
  await migrateCollection("catalog_boxes");
  await migrateCollection("catalog_box_rules");
  await migrateCollection("site_settings");
  await migrateCollection("ui_config");
  await migrateCollection("site_content");
  await migrateCollection("marketing_content");
  await migrateGhostProductImages();
  await ensureLocalizedCollection("catalog_categories", ["name", "description"]);
  await ensureLocalizedCollection("catalog_products", ["name", "description"]);
  await ensureLocalizedCollection("catalog_boxes", ["name", "description"]);
}

main().catch((error) => {
  console.error("sync-assets-db failed", error);
  process.exit(1);
});
const CATEGORY_TRANSLATIONS: Record<string, { en: string; description?: { es: string; en: string } }> = {
  "frutas": { en: "Fruits" },
  "vegetales": { en: "Vegetables" },
  "jugos": { en: "Juices" },
  "jugos-naturales": { en: "Natural Juices" },
  "hierbas-y-especias": { en: "Herbs & Spices" },
  "productos-de-granja": { en: "Farm Products" },
  "productos-caseros": { en: "Homemade Goods" },
  "otros": { en: "Others" },
  "cajas": { en: "Boxes" },
};
