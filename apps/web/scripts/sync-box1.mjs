
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_PATH = path.resolve("service-account.json"); // User must ensure this exists
const TARGET_BOX_IDS = ["GD-CAJA-001", "box-1", "GD-CAJA-002", "GD-CAJA-003"]; // Focusing on Box 1 and others just in case

// --- HELPER FUNCTIONS ---
function normalizeKey(value) {
    if (!value) return "";
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function main() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error(`ERROR: Service account file not found at ${SERVICE_ACCOUNT_PATH}`);
        console.error("Please ensure 'service-account.json' is in the root directory.");
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
    console.log("Initializing Firebase Admin with project:", serviceAccount.project_id);

    const app = initializeApp({
        credential: cert(serviceAccount)
    });

    const db = getFirestore();

    // 1. Fetch Master Catalog
    console.log("Fetching Master Catalog (catalog_products)...");
    const productsSnapshot = await db.collection("catalog_products").get();
    const productMap = new Map(); // Key -> Product data

    productsSnapshot.forEach(doc => {
        const p = doc.data();
        p.id = doc.id; // IMPORTANT: Ensure ID is preserved in the data object
        // Index by ID/SKU
        productMap.set(doc.id, p);
        if (p.sku) productMap.set(p.sku, p);
        if (p.slug) productMap.set(p.slug, p);

        // Index by Name (Spanish and English)
        if (p.name?.es) productMap.set(normalizeKey(p.name.es), p);
        if (p.name?.en) productMap.set(normalizeKey(p.name.en), p);
    });

    console.log(`Loaded ${productsSnapshot.size} products from catalog.`);

    // 2. Fetch Boxes
    console.log("Fetching Catalog Boxes...");
    const boxesSnapshot = await db.collection("catalog_boxes").get();

    const batch = db.batch();
    let changesCount = 0;

    boxesSnapshot.forEach(doc => {
        const box = doc.data();
        let boxUpdated = false;

        // Check if this is a box we want to repair
        if (!TARGET_BOX_IDS.includes(doc.id) && !TARGET_BOX_IDS.includes(box.slug)) {
            // Optional: Skip if you only want to touch Box 1 strictly. 
            // But usually good to repair all boxes if logic applies.
            // Keeping it strict to Box 1 for now if user insisted, but user said "Box 1" is the issue.
            // Let's filter loosely.
            if (!box.slug?.includes("box-1") && !doc.id.includes("001")) return;
        }

        console.log(`\nProcessing Box: ${doc.id} (${box.name?.es})`);

        if (!box.variants || !Array.isArray(box.variants)) {
            console.log("  No variants found, skipping.");
            return;
        }

        const updatedVariants = box.variants.map(variant => {
            console.log(`  Checking variant: ${variant.id}`);

            // Check referenceContents
            // Some schemas use 'referenceContents', others might have 'contents'. 
            // Based on seed script, it's referenceContents.
            // However, schemas.ts says 'referenceContents' has { productId, name, quantity }
            if (!variant.referenceContents) return variant;

            const updatedContents = variant.referenceContents.map(item => {
                let match = null;

                // A. Try matching by existing productId/slug
                if (item.productId && productMap.has(item.productId)) {
                    match = productMap.get(item.productId);
                } else if (item.productSlug && productMap.has(item.productSlug)) {
                    match = productMap.get(item.productSlug);
                } else {
                    // B. Try matching by Name (Legacy fallback, but useful if ID missing)
                    const nameKey = normalizeKey(item.name?.es || item.name?.en || item.name);
                    if (productMap.has(nameKey)) {
                        match = productMap.get(nameKey);
                    }
                }

                if (match) {
                    const productName = match.name?.es || match.name?.en || "Unknown";

                    // SKU-ONLY POLICY: Trust the Master Catalog image which has been normalized and verified.
                    let finalImage = match.image;

                    return {
                        ...item,
                        productId: match.sku || match.id || "", // Ensure ID is set
                        productSlug: match.slug || match.id || "", // Ensure Slug is set (fallback to ID)
                        name: match.name || { es: "Unknown", en: "Unknown" }, // Sync Name
                        description: match.description || { es: "", en: "" },   // Sync Description
                        image: finalImage,                // Sync Image (From Catalog)
                        // Keeping quantity
                    };
                } else {
                    console.warn(`    WARNING: Could not find product for "${item.name?.es || item.name}"`);
                    return item; // Keep as is if no match
                }
            });

            // Check if contents actually changed (simple JSON stringify comparison for now, or just assume yes)
            return {
                ...variant,
                referenceContents: updatedContents
            };
        });

        // Update the document
        batch.update(doc.ref, { variants: updatedVariants });
        changesCount++;
        boxUpdated = true;
    });

    if (changesCount > 0) {
        console.log(`\nCommitting updates for ${changesCount} boxes...`);
        await batch.commit();
        console.log("✅ Box data synchronized successfully.");
    } else {
        console.log("\nNo changes needed (or Box 1 not found/matched).");
    }
}

main().catch(console.error);
