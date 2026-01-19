"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const firestore_1 = require("../lib/firestore");
const schemas_1 = require("../modules/catalog/schemas");
// Resolve paths relative to project root
const PROJECT_ROOT = path_1.default.resolve(process.cwd(), "../..");
const BOX_ASSETS_DIR = path_1.default.join(PROJECT_ROOT, "GreenDolio_BrandAssets/04_Fotografia/Productos/Cajas_GreenDolio");
const PUBLIC_BOXES_DIR = path_1.default.join(PROJECT_ROOT, "apps/web/public/images/boxes");
// Mapeo manual de cajas a imágenes
const boxImageMapping = {
    // Por ID
    "box-1": "greendolio-box1-caribbean-fresh-pack-mix-topdown.jpg",
    "box-2": "greendolio-box2-island-weekssential-mix-topdown-lifestyle.jpg",
    "box-3": "Box3_cenital_veggie.png",
    // Por slug completo
    "box-1-caribbean-fresh-pack-3-dias": "greendolio-box1-caribbean-fresh-pack-mix-topdown.jpg",
    "box-2-island-weekssential-1-semana": "greendolio-box2-island-weekssential-mix-topdown-lifestyle.jpg",
    "box-3-allgreenxclusive-2-semanas": "Box3_cenital_veggie.png",
    // Por slug parcial
    "caribbean-fresh-pack": "greendolio-box1-caribbean-fresh-pack-mix-topdown.jpg",
    "island-weekssential": "greendolio-box2-island-weekssential-mix-topdown-lifestyle.jpg",
    "allgreenxclusive": "Box3_cenital_veggie.png",
};
async function run() {
    if (!fs_1.default.existsSync(BOX_ASSETS_DIR)) {
        throw new Error(`Box assets directory not found: ${BOX_ASSETS_DIR}`);
    }
    fs_1.default.mkdirSync(PUBLIC_BOXES_DIR, { recursive: true });
    const db = (0, firestore_1.getDb)();
    const snapshot = await db.collection("catalog_boxes").get();
    console.log(`📦 Found ${snapshot.size} boxes in Firestore`);
    const updates = [];
    const skipped = [];
    const notFound = [];
    const newImagesCopied = [];
    // Primero, copiar todas las imágenes de cajas a public
    const assetsFiles = fs_1.default.readdirSync(BOX_ASSETS_DIR).filter((f) => f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".webp") || f.toLowerCase().endsWith(".png"));
    const publicImages = fs_1.default.existsSync(PUBLIC_BOXES_DIR)
        ? new Set(fs_1.default.readdirSync(PUBLIC_BOXES_DIR).filter((f) => f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".webp") || f.toLowerCase().endsWith(".png")))
        : new Set();
    assetsFiles.forEach((assetFile) => {
        const assetPath = path_1.default.join(BOX_ASSETS_DIR, assetFile);
        const baseName = path_1.default.basename(assetFile);
        // Verificar si la imagen ya está en public
        const alreadyInPublic = Array.from(publicImages).some((img) => img.toLowerCase() === baseName.toLowerCase());
        if (!alreadyInPublic) {
            // Copiar la imagen a public con su nombre original
            const destPath = path_1.default.join(PUBLIC_BOXES_DIR, baseName);
            fs_1.default.copyFileSync(assetPath, destPath);
            newImagesCopied.push(baseName);
            console.log(`📸 Copied new box image: ${baseName}`);
        }
    });
    // Ahora actualizar las cajas en Firestore
    snapshot.forEach((doc) => {
        const box = schemas_1.boxSchema.parse({ id: doc.id, ...doc.data() });
        // Buscar imagen por ID o slug
        let imageFileName = boxImageMapping[box.id] || boxImageMapping[box.slug];
        if (!imageFileName) {
            // Intentar buscar por nombre del archivo
            const boxNumber = box.id.replace("box-", "");
            const searchPattern = new RegExp(`box${boxNumber}`, "i");
            const matchingFile = assetsFiles.find((f) => searchPattern.test(f));
            if (matchingFile) {
                imageFileName = matchingFile;
            }
        }
        if (!imageFileName) {
            notFound.push(box.slug);
            console.warn(`✖ Image not found for box: ${box.slug} (${box.name.es})`);
            return;
        }
        const assetPath = path_1.default.join(BOX_ASSETS_DIR, imageFileName);
        if (!fs_1.default.existsSync(assetPath)) {
            notFound.push(box.slug);
            console.warn(`✖ Image file not found: ${imageFileName} for box ${box.slug}`);
            return;
        }
        // Copiar imagen a public con nombre basado en slug de la caja
        // Mantener la extensión original del archivo
        const assetExt = path_1.default.extname(imageFileName);
        const publicFileName = `${box.slug}${assetExt}`;
        const destination = path_1.default.join(PUBLIC_BOXES_DIR, publicFileName);
        fs_1.default.copyFileSync(assetPath, destination);
        const publicPath = `/images/boxes/${publicFileName}`;
        if (box.heroImage !== publicPath) {
            updates.push(doc.ref.update({ heroImage: publicPath }));
            console.log(`✔ ${box.slug} -> ${publicPath}`);
        }
        else {
            skipped.push(box.slug);
        }
    });
    await Promise.all(updates);
    console.log(`\n✅ Summary:`);
    console.log(`   - Updated: ${updates.length} boxes`);
    console.log(`   - Skipped (already synced): ${skipped.length} boxes`);
    console.log(`   - Not found: ${notFound.length} boxes`);
    console.log(`   - New images copied to public: ${newImagesCopied.length}`);
    if (notFound.length > 0) {
        console.log(`\n⚠️  Boxes without matching images:`);
        notFound.forEach((slug) => console.log(`   - ${slug}`));
    }
}
run().catch((error) => {
    console.error("Failed to update box images", error);
    process.exit(1);
});
//# sourceMappingURL=updateBoxImagesFromAssets.js.map