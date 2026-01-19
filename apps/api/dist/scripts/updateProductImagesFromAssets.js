"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const slugify_1 = __importDefault(require("slugify"));
dotenv_1.default.config();
const firestore_1 = require("../lib/firestore");
const schemas_1 = require("../modules/catalog/schemas");
// Resolve paths relative to project root
// Script runs from apps/api, so we need to go up 2 levels to reach project root
const PROJECT_ROOT = path_1.default.resolve(process.cwd(), "../..");
const BRAND_ASSETS_DIR = path_1.default.join(PROJECT_ROOT, "GreenDolio_BrandAssets/04_Fotografia/Productos");
const PUBLIC_DIR = path_1.default.join(PROJECT_ROOT, "apps/web/public/images/products");
const manualOverrides = {
    // Mieles (cambiaron a PNG)
    "miel-pura-de-abejas-65-oz": { asset: "Miel de abejas.png" },
    "miel-organica-con-panal-12-oz": { asset: "Miel de abeja con panal.png" },
    // Arroz integral
    "arroz-integral-1-libra": { asset: "Arroz integral.jpg" },
    // Habichuelas (usar habichuelas rojas como imagen principal)
    "habichuelas-rojasnegrasblancas-400-gr": { asset: "Habichuelas rojas.jpg" },
    // Jugos con nombres abreviados en assets y URLs públicas sin sufijos de porción
    "pepinada-1-porcion": { asset: "Pepinada.jpg", publicFileName: "pepinada.jpg" },
    "tropicalote-1-porcion": { asset: "Tropicalote.jpg", publicFileName: "tropicalote.jpg" },
    "rosa-maravillosa-1-porcion": { asset: "Rosa Maravillosa.jpg", publicFileName: "rosa-maravillosa.jpg" },
    "china-chinola-1-porcion": { asset: "China Chinola.jpg", publicFileName: "china-chinola.jpg" },
    // Huevos
    "huevos-de-color-12-unidades": { asset: "Huevos marrones.png" },
    "huevos-blancos-12-unidades": { asset: "Huevos blancos.png" },
    // Chimichurri cambió a PNG
    "chimichurri-95-oz": { asset: "Chimichurri.png" },
};
const measurementPatterns = [
    /-\d+(?:-\d+)?-?(?:oz|gr|kg|lb|l|litros|litro|cc|ml|porcion|porciones|unidades|unidad)$/,
    /-aprox-\d+(?:-\d+)?$/,
];
function normalizeBase(value) {
    const withoutParentheses = value.replace(/\([^)]*\)/g, " ");
    return (0, slugify_1.default)(withoutParentheses, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@¿?,]/g,
    });
}
function simplifyKey(value) {
    let key = value.toLowerCase();
    measurementPatterns.forEach((pattern) => {
        key = key.replace(pattern, "");
    });
    key = key.replace(/-(?:\d+)?-?por(?:cion|ciones)$/g, "");
    key = key.replace(/-por(?:cion|ciones)$/g, "");
    key = key.replace(/-(?:\d+)?-?unidad(?:es)?$/g, "");
    key = key.replace(/-(?:\d+|\d+\w*)/g, "");
    key = key.replace(/-/g, "");
    return key;
}
function buildAssetMap() {
    const map = new Map();
    const files = fs_1.default.readdirSync(BRAND_ASSETS_DIR).filter((file) => file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".png"));
    files.forEach((file) => {
        const base = path_1.default.basename(file, path_1.default.extname(file));
        const normalized = normalizeBase(base);
        const simplified = simplifyKey(normalized);
        if (!map.has(simplified)) {
            map.set(simplified, path_1.default.join(BRAND_ASSETS_DIR, file));
        }
    });
    return map;
}
function findAssetForProduct(assetMap, productSlug, productName) {
    if (manualOverrides[productSlug]) {
        return path_1.default.join(BRAND_ASSETS_DIR, manualOverrides[productSlug].asset);
    }
    const simplifiedSlug = simplifyKey(productSlug);
    if (assetMap.has(simplifiedSlug)) {
        return assetMap.get(simplifiedSlug);
    }
    const normalizedName = normalizeBase(productName);
    const simplifiedName = simplifyKey(normalizedName);
    if (assetMap.has(simplifiedName)) {
        return assetMap.get(simplifiedName);
    }
    const fallback = simplifiedName.replace(/s$/, "");
    if (assetMap.has(fallback)) {
        return assetMap.get(fallback);
    }
    return null;
}
async function run() {
    if (!fs_1.default.existsSync(BRAND_ASSETS_DIR)) {
        throw new Error(`Brand assets directory not found: ${BRAND_ASSETS_DIR}`);
    }
    fs_1.default.mkdirSync(PUBLIC_DIR, { recursive: true });
    const assetMap = buildAssetMap();
    console.log(`📁 Found ${assetMap.size} image files in assets directory`);
    const db = (0, firestore_1.getDb)();
    const snapshot = await db.collection("catalog_products").get();
    console.log(`📦 Found ${snapshot.size} products in Firestore`);
    const updates = [];
    const skipped = [];
    const notFound = [];
    snapshot.forEach((doc) => {
        const product = schemas_1.productSchema.parse({ id: doc.id, ...doc.data() });
        const override = manualOverrides[product.slug];
        const assetPath = findAssetForProduct(assetMap, product.slug, product.name.es);
        if (!assetPath) {
            notFound.push(product.slug);
            console.warn(`✖ Asset not found for: ${product.slug} (${product.name.es})`);
            return;
        }
        // Detectar la extensión del archivo original
        const assetExt = path_1.default.extname(assetPath).toLowerCase();
        const publicFileName = override?.publicFileName ?? `${product.slug}${assetExt}`;
        const destination = path_1.default.join(PUBLIC_DIR, publicFileName);
        // Copiar la imagen (sobrescribe si existe con diferente extensión)
        fs_1.default.copyFileSync(assetPath, destination);
        // Si el producto tenía una imagen con diferente extensión, eliminar la antigua
        const oldExt = assetExt === '.jpg' ? '.png' : '.jpg';
        const oldFileName = override?.publicFileName ?? `${product.slug}${oldExt}`;
        const oldPath = path_1.default.join(PUBLIC_DIR, oldFileName);
        if (fs_1.default.existsSync(oldPath)) {
            fs_1.default.unlinkSync(oldPath);
            console.log(`🗑️  Removed old image: ${oldFileName}`);
        }
        const publicPath = `/images/products/${publicFileName}`;
        if (product.image !== publicPath) {
            updates.push(doc.ref.update({ image: publicPath }));
            console.log(`✔ ${product.slug} -> ${publicPath}`);
        }
        else {
            skipped.push(product.slug);
        }
    });
    // Copiar todas las imágenes nuevas de assets a public, incluso si no están asociadas a productos
    const publicImages = fs_1.default.existsSync(PUBLIC_DIR)
        ? new Set(fs_1.default.readdirSync(PUBLIC_DIR).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')))
        : new Set();
    const assetsFiles = fs_1.default.readdirSync(BRAND_ASSETS_DIR).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'));
    let newImagesCopied = 0;
    assetsFiles.forEach((assetFile) => {
        const assetPath = path_1.default.join(BRAND_ASSETS_DIR, assetFile);
        const baseName = path_1.default.basename(assetFile);
        // Verificar si la imagen ya está en public
        const alreadyInPublic = Array.from(publicImages).some(img => img.toLowerCase() === baseName.toLowerCase());
        if (!alreadyInPublic) {
            // Copiar la imagen a public con su nombre original
            const destPath = path_1.default.join(PUBLIC_DIR, baseName);
            fs_1.default.copyFileSync(assetPath, destPath);
            newImagesCopied++;
            console.log(`📸 Copied new image: ${baseName}`);
        }
    });
    await Promise.all(updates);
    console.log(`\n✅ Summary:`);
    console.log(`   - Updated: ${updates.length} products`);
    console.log(`   - Skipped (already synced): ${skipped.length} products`);
    console.log(`   - Not found: ${notFound.length} products`);
    console.log(`   - New images copied to public: ${newImagesCopied}`);
    if (notFound.length > 0) {
        console.log(`\n⚠️  Products without matching images:`);
        notFound.forEach((slug) => console.log(`   - ${slug}`));
    }
}
run().catch((error) => {
    console.error("Failed to update product images", error);
    process.exit(1);
});
//# sourceMappingURL=updateProductImagesFromAssets.js.map