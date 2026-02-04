import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "../../..");
const IMAGES_DIR = path.join(ROOT, "apps/web/public/assets/images/products");
const APPLY = process.argv.includes("--apply");

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function loadServiceAccount() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    return JSON.parse(inline);
  }
  const candidates = [
    path.join(ROOT, "service-account.json"),
    path.join(ROOT, "apps/web/service-account.json"),
  ];
  for (const file of candidates) {
    try {
      const raw = await fs.readFile(file, "utf8");
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  throw new Error("Missing Firebase service account credentials");
}

let db;

const normalizeBase = (value) => value?.trim().toUpperCase() ?? "";

const stripQuery = (value) => value.split("?")[0];

const fileNameFromImage = (imagePath) => path.basename(stripQuery(imagePath));

const ensureImageUrl = (fileName) => `/assets/images/products/${fileName}`;

async function main() {
  const serviceAccount = await loadServiceAccount();
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore();

  const files = await fs.readdir(IMAGES_DIR);
  const imageFiles = files.filter((file) => ALLOWED_EXT.has(path.extname(file).toLowerCase()));
  const fileMap = new Map();
  imageFiles.forEach((file) => {
    const base = normalizeBase(path.basename(file, path.extname(file)));
    if (!base) return;
    if (!fileMap.has(base)) {
      fileMap.set(base, file);
    }
  });

  const snapshot = await db.collection("catalog_products").get();
  let updatedDocs = 0;
  let renamedFiles = 0;
  let missingImages = 0;
  const missingList = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() ?? {};
    const sku = normalizeBase(data.sku || data.id || doc.id);
    if (!sku) continue;
    if (sku.startsWith("GD-CAJA") || data.categoryId === "cajas") {
      continue;
    }

    const slug = normalizeBase(data.slug);
    const currentImage = typeof data.image === "string" ? data.image : "";
    const currentFileName = currentImage ? fileNameFromImage(currentImage) : "";
    const currentBase = currentFileName ? normalizeBase(path.basename(currentFileName, path.extname(currentFileName))) : "";

    let imageFile = fileMap.get(sku);
    if (!imageFile && slug) {
      const slugFile = fileMap.get(slug);
      if (slugFile) {
        const ext = path.extname(slugFile);
        const targetFileName = `${sku}${ext}`;
        const fromPath = path.join(IMAGES_DIR, slugFile);
        const toPath = path.join(IMAGES_DIR, targetFileName);
        if (slugFile !== targetFileName) {
          if (APPLY) {
            await fs.rename(fromPath, toPath);
          }
          renamedFiles += 1;
          fileMap.delete(slug);
          fileMap.set(sku, targetFileName);
          imageFile = targetFileName;
        }
      }
    }

    if (!imageFile && currentBase && fileMap.get(currentBase)) {
      imageFile = fileMap.get(currentBase);
    }

    if (!imageFile) {
      missingImages += 1;
      missingList.push({
        id: doc.id,
        sku,
        name: data?.name?.es ?? data?.name?.en ?? "",
      });
      continue;
    }

    const desiredImage = ensureImageUrl(imageFile);
    const normalizedCurrent = currentImage ? ensureImageUrl(fileNameFromImage(currentImage)) : "";
    const shouldUpdate =
      !currentImage ||
      (currentImage.startsWith("/assets/images/products/") && normalizedCurrent !== desiredImage);

    if (shouldUpdate) {
      if (APPLY) {
        await doc.ref.set({ image: desiredImage }, { merge: true });
      }
      updatedDocs += 1;
    }
  }

  console.log("sync-product-images summary");
  console.log(`updated docs: ${updatedDocs}`);
  console.log(`renamed files: ${renamedFiles}`);
  console.log(`missing images: ${missingImages}`);
  if (missingList.length) {
    console.log("missing image products:");
    missingList.forEach((item) => {
      console.log(`- ${item.sku} (${item.name}) [doc: ${item.id}]`);
    });
  }
  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to persist changes.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
