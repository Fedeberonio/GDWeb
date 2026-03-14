// @ts-nocheck
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import slugify from "slugify";

dotenv.config();

import { getDb } from "../lib/firestore";
import { productSchema } from "../modules/catalog/schemas";

// Resolve paths relative to project root
const PROJECT_ROOT = path.resolve(process.cwd(), "../..");
const BRAND_ASSETS_DIR = path.join(PROJECT_ROOT, "GreenDolio_BrandAssets/04_Fotografia/Productos");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "apps/web/public/images/products");

const measurementPatterns = [
  /-\d+(?:-\d+)?-?(?:oz|gr|kg|lb|litros|litro|cc|porcion|porciones|unidades|unidad)$/,
  /-aprox-\d+(?:-\d+)?$/,
];

function normalizeBase(value: string) {
  return slugify(value, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@¿?,]/g,
  });
}

function simplifyKey(value: string) {
  let key = value.toLowerCase();
  measurementPatterns.forEach((pattern) => {
    key = key.replace(pattern, "");
  });
  key = key.replace(/-(?:\d+|\d+\w*)/g, "");
  key = key.replace(/-/g, "");
  return key;
}

interface ProductImageStatus {
  product: {
    id: string;
    slug: string;
    name: string;
  };
  hasPublicImage: boolean;
  publicImagePath?: string;
  hasAssetImage: boolean;
  assetImagePath?: string;
  assetFileName?: string;
  matchStatus: "found" | "not_found" | "name_mismatch";
  issues: string[];
}

async function checkProductImages() {
  console.log("🔍 Verificando imágenes de productos...\n");

  // 1. Obtener productos de Firestore
  const db = getDb();
  const snapshot = await db.collection("catalog_products").get();
  const products = snapshot.docs.map((doc) => {
    const data = productSchema.parse({ id: doc.id, ...doc.data() });
    return {
      id: data.id,
      slug: data.slug,
      name: data.name.es,
      image: data.image,
    };
  });

  console.log(`📦 Productos en Firestore: ${products.length}\n`);

  // 2. Obtener imágenes en assets
  if (!fs.existsSync(BRAND_ASSETS_DIR)) {
    throw new Error(`Directorio de assets no encontrado: ${BRAND_ASSETS_DIR}`);
  }
  const assetFiles = fs
    .readdirSync(BRAND_ASSETS_DIR)
    .filter((file) => file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".jpeg"));
  
  console.log(`📁 Imágenes en assets: ${assetFiles.length}\n`);

  // 3. Obtener imágenes en public
  const publicFiles: string[] = [];
  if (fs.existsSync(PUBLIC_DIR)) {
    publicFiles.push(...fs.readdirSync(PUBLIC_DIR).filter((file) => file.toLowerCase().endsWith(".jpg")));
  }
  console.log(`📂 Imágenes en public: ${publicFiles.length}\n`);

  // 4. Crear mapa de assets simplificados
  const assetMap = new Map<string, { original: string; path: string }>();
  assetFiles.forEach((file) => {
    const base = path.basename(file, path.extname(file));
    const normalized = normalizeBase(base);
    const simplified = simplifyKey(normalized);
    if (!assetMap.has(simplified)) {
      assetMap.set(simplified, { original: file, path: path.join(BRAND_ASSETS_DIR, file) });
    }
  });

  // 5. Verificar cada producto
  const statuses: ProductImageStatus[] = [];
  const productsWithoutImages: string[] = [];
  const productsWithNameMismatch: string[] = [];
  const assetsWithoutProducts: string[] = [];

  products.forEach((product) => {
    const status: ProductImageStatus = {
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
      },
      hasPublicImage: false,
      hasAssetImage: false,
      matchStatus: "not_found",
      issues: [],
    };

    // Verificar imagen en public
    const expectedPublicPath = path.join(PUBLIC_DIR, `${product.slug}.jpg`);
    if (fs.existsSync(expectedPublicPath)) {
      status.hasPublicImage = true;
      status.publicImagePath = `/images/products/${product.slug}.jpg`;
    } else {
      status.issues.push(`No existe imagen en public: ${product.slug}.jpg`);
    }

    // Verificar imagen en assets
    const simplifiedSlug = simplifyKey(product.slug);
    const normalizedName = normalizeBase(product.name);
    const simplifiedName = simplifyKey(normalizedName);

    let foundAsset = assetMap.get(simplifiedSlug);
    if (!foundAsset) {
      foundAsset = assetMap.get(simplifiedName);
    }
    if (!foundAsset) {
      const fallback = simplifiedName.replace(/s$/, "");
      foundAsset = assetMap.get(fallback);
    }

    if (foundAsset) {
      status.hasAssetImage = true;
      status.assetImagePath = foundAsset.path;
      status.assetFileName = foundAsset.original;
      status.matchStatus = "found";

      // Verificar si el nombre coincide exactamente
      const assetBase = path.basename(foundAsset.original, path.extname(foundAsset.original));
      const normalizedAsset = normalizeBase(assetBase);
      if (normalizedAsset !== normalizeBase(product.slug) && normalizedAsset !== normalizedName) {
        status.matchStatus = "name_mismatch";
        status.issues.push(
          `Nombre no coincide exactamente: producto "${product.name}" (slug: ${product.slug}) vs asset "${foundAsset.original}"`
        );
        productsWithNameMismatch.push(product.slug);
      }
    } else {
      status.issues.push(`No se encontró imagen en assets para: ${product.name} (slug: ${product.slug})`);
      productsWithoutImages.push(product.slug);
    }

    statuses.push(status);
  });

  // 6. Verificar assets sin productos
  const productSlugs = new Set(products.map((p) => p.slug));
  const productNames = new Set(products.map((p) => simplifyKey(normalizeBase(p.name))));
  
  assetFiles.forEach((file) => {
    const base = path.basename(file, path.extname(file));
    const normalized = normalizeBase(base);
    const simplified = simplifyKey(normalized);
    
    if (!productSlugs.has(normalized) && !productNames.has(simplified)) {
      const fallback = simplified.replace(/s$/, "");
      if (!productNames.has(fallback)) {
        assetsWithoutProducts.push(file);
      }
    }
  });

  // 7. Generar reporte
  console.log("=".repeat(80));
  console.log("📊 REPORTE DE IMÁGENES DE PRODUCTOS");
  console.log("=".repeat(80));
  console.log();

  console.log(`✅ Productos con imagen encontrada: ${statuses.filter((s) => s.matchStatus === "found" && !s.issues.length).length}`);
  console.log(`⚠️  Productos con diferencia de nombre: ${productsWithNameMismatch.length}`);
  console.log(`❌ Productos sin imagen: ${productsWithoutImages.length}`);
  console.log(`📦 Assets sin producto asociado: ${assetsWithoutProducts.length}`);
  console.log();

  if (productsWithNameMismatch.length > 0) {
    console.log("⚠️  PRODUCTOS CON DIFERENCIAS DE NOMBRE:");
    console.log("-".repeat(80));
    statuses
      .filter((s) => s.matchStatus === "name_mismatch")
      .forEach((status) => {
        console.log(`\n  Producto: ${status.product.name}`);
        console.log(`    ID: ${status.product.id}`);
        console.log(`    Slug: ${status.product.slug}`);
        console.log(`    Asset encontrado: ${status.assetFileName}`);
        status.issues.forEach((issue) => console.log(`    ⚠️  ${issue}`));
      });
    console.log();
  }

  if (productsWithoutImages.length > 0) {
    console.log("❌ PRODUCTOS SIN IMAGEN EN ASSETS:");
    console.log("-".repeat(80));
    productsWithoutImages.forEach((slug) => {
      const product = products.find((p) => p.slug === slug);
      console.log(`  - ${product?.name || slug} (slug: ${slug}, ID: ${product?.id || "N/A"})`);
    });
    console.log();
  }

  if (assetsWithoutProducts.length > 0) {
    console.log("📦 IMÁGENES EN ASSETS SIN PRODUCTO ASOCIADO:");
    console.log("-".repeat(80));
    assetsWithoutProducts.forEach((file) => {
      console.log(`  - ${file}`);
    });
    console.log();
  }

  // 8. Verificar problemas de nombres (espacios, acentos, etc.)
  console.log("🔍 VERIFICACIÓN DE PROBLEMAS DE NOMBRES:");
  console.log("-".repeat(80));
  const nameIssues: Array<{ product: string; issue: string }> = [];

  statuses.forEach((status) => {
    if (status.assetFileName) {
      const assetBase = path.basename(status.assetFileName, path.extname(status.assetFileName));
      
      // Verificar espacios en nombres de assets
      if (assetBase.includes(" ")) {
        nameIssues.push({
          product: status.product.name,
          issue: `Asset tiene espacios: "${status.assetFileName}"`,
        });
      }

      // Verificar caracteres especiales
      if (/[áéíóúñüÁÉÍÓÚÑÜ]/.test(assetBase)) {
        nameIssues.push({
          product: status.product.name,
          issue: `Asset tiene acentos: "${status.assetFileName}"`,
        });
      }

      // Verificar mayúsculas
      if (/[A-Z]/.test(assetBase)) {
        nameIssues.push({
          product: status.product.name,
          issue: `Asset tiene mayúsculas: "${status.assetFileName}"`,
        });
      }
    }
  });

  if (nameIssues.length > 0) {
    nameIssues.forEach(({ product, issue }) => {
      console.log(`  ⚠️  ${product}: ${issue}`);
    });
  } else {
    console.log("  ✅ No se encontraron problemas de nombres (espacios, acentos, mayúsculas)");
  }
  console.log();

  // 9. Resumen final
  console.log("=".repeat(80));
  console.log("📋 RESUMEN FINAL");
  console.log("=".repeat(80));
  console.log(`Total productos: ${products.length}`);
  console.log(`Total imágenes en assets: ${assetFiles.length}`);
  console.log(`Total imágenes en public: ${publicFiles.length}`);
  console.log(`Productos con imagen correcta: ${statuses.filter((s) => s.hasAssetImage && s.hasPublicImage && s.matchStatus === "found").length}`);
  console.log(`Productos que necesitan atención: ${productsWithoutImages.length + productsWithNameMismatch.length}`);
  console.log();
}

checkProductImages().catch((error) => {
  console.error("❌ Error al verificar imágenes:", error);
  process.exit(1);
});

