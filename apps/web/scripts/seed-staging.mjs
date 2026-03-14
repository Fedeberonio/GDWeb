
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Load Service Account
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve("service-account.json"), "utf-8"));

console.log("Initializing Firebase Admin with project:", serviceAccount.project_id);

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const PRODUCTS_CSV_PATH = path.resolve("../../_legacy_archive/static_data/data/GreenDolio_Productos_25nov_CORREGIDO.csv");
const BOX_CONTENTS_CSV_PATH = path.resolve("../../_legacy_archive/static_data/data/GreenDolio_Contenidos_Cajas_25nov.csv");

async function seed() {
    const productsContent = fs.readFileSync(PRODUCTS_CSV_PATH, "utf-8");
    const productsRecords = parse(productsContent, { columns: true, skip_empty_lines: true });

    const boxContentsContent = fs.readFileSync(BOX_CONTENTS_CSV_PATH, "utf-8");
    const boxContentsRecords = parse(boxContentsContent, { columns: true, skip_empty_lines: true });

    console.log(`Found ${productsRecords.length} product/box rows.`);
    console.log(`Found ${boxContentsRecords.length} box content rows.`);

    const batchSize = 400;
    let batch = db.batch();
    let operationCount = 0;

    async function commitBatchIfNeeded() {
        operationCount++;
        if (operationCount >= batchSize) {
            console.log("Committing batch...");
            await batch.commit();
            batch = db.batch();
            operationCount = 0;
        }
    }

    // 1. Process Categories
    const categories = new Set();
    productsRecords.forEach(row => {
        if (row.Categoria && row.Categoria !== "Cajas") {
            categories.add(row.Categoria);
        }
    });

    console.log(`Found ${categories.size} categories.`);
    let sortOrder = 1;
    const categoryMap = new Map();

    for (const catName of categories) {
        const id = catName.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
        categoryMap.set(catName, id);
        const docRef = db.collection("catalog_categories").doc(id);
        batch.set(docRef, {
            id,
            slug: id,
            name: { es: catName, en: catName },
            sortOrder: sortOrder++,
            status: "active"
        });
        await commitBatchIfNeeded();
    }

    // 2. Process Products (Exclude Boxes)
    for (const row of productsRecords) {
        if (row.Categoria === "Cajas") continue;

        const id = row.SKU || row.Nombre_Producto.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
        const docRef = db.collection("catalog_products").doc(id);

        // Clean price
        const priceAmount = parseFloat(row.Precio_DOP.replace(/,/g, "")) || 0;

        const product = {
            id,
            sku: row.SKU,
            slug: id,
            name: { es: row.Nombre_Producto, en: row.Descripcion_Corta_EN || row.Nombre_Producto },
            categoryId: categoryMap.get(row.Categoria) || "uncategorized",
            price: { amount: priceAmount, currency: "DOP" },
            unit: { es: row.Unidad_Venta || '', en: row.Unidad_Venta || '' },
            description: { es: row.Descripcion_Corta || '', en: "" },
            image: row.URL_Imagen ? row.URL_Imagen.replace("https://greendolio.shop/images/", "/assets/images/products/") : "",
            status: row.Activo === "Sí" ? "active" : "inactive",
            isFeatured: row.Destacado_Web === "Sí",
            tags: row.Tags ? row.Tags.split(",").map(t => t.trim()) : []
        };

        batch.set(docRef, product);
        await commitBatchIfNeeded();
    }

    // 3. Process Boxes
    const boxContents = {};

    boxContentsRecords.forEach(row => {
        const boxId = row.Caja_ID;
        if (!boxContents[boxId]) boxContents[boxId] = { mix: [], fruity: [], veggie: [] };

        let variantKey = "mix";
        const v = row.Variante.toUpperCase();
        if (v.includes("FRUTAL") || v.includes("FRUITY")) variantKey = "fruity";
        if (v.includes("VEGGIE") || v.includes("VEGETARIAP")) variantKey = "veggie";
        if (row.Variante === "MIX") variantKey = "mix";

        boxContents[boxId][variantKey].push({
            name: { es: row.Producto, en: row.Producto },
            quantity: row.Cantidad
        });
    });

    for (const row of productsRecords) {
        if (row.Categoria !== "Cajas") continue;

        const id = row.SKU; // GD-CAJA-001
        const docRef = db.collection("catalog_boxes").doc(id);
        const priceAmount = parseFloat(row.Precio_DOP.replace(/,/g, "")) || 0;

        const variants = [];
        const contents = boxContents[id];

        if (contents) {
            if (contents.mix.length > 0) {
                variants.push({
                    id: "mix", slug: "mix", name: { es: "Mix", en: "Mix" },
                    highlights: [], referenceContents: contents.mix
                });
            }
            if (contents.fruity.length > 0) {
                variants.push({
                    id: "fruity", slug: "fruity", name: { es: "Frutal", en: "Fruity" },
                    highlights: [], referenceContents: contents.fruity
                });
            }
            if (contents.veggie.length > 0) {
                variants.push({
                    id: "veggie", slug: "veggie", name: { es: "Veggie", en: "Veggie" },
                    highlights: [], referenceContents: contents.veggie
                });
            }
        }

        const box = {
            id,
            slug: id.toLowerCase(),
            name: { es: row.Nombre_Producto, en: row.Nombre_Producto },
            description: { es: row.Descripcion_Corta || '', en: "" },
            price: { amount: priceAmount, currency: "DOP" },
            isFeatured: row.Destacado_Web === "Sí",
            heroImage: row.URL_Imagen ? row.URL_Imagen.replace("https://greendolio.shop/images/", "/assets/images/products/") : "",
            variants
        };

        batch.set(docRef, box);
        await commitBatchIfNeeded();
    }

    await batch.commit();
    console.log("Migration Complete.");
    process.exit(0);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
