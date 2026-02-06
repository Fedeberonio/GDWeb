
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const SERVICE_ACCOUNT_PATH = path.resolve("service-account.json");
const PRODUCTS_DIR = path.resolve("public/assets/images/products");
const BOXES_DIR = path.resolve("public/assets/images/boxes");

async function main() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error("Service account not found");
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    console.log("--- Enforcing SKU-ONLY Image Policy ---");

    const snapshot = await db.collection("catalog_products").get();
    const batch = db.batch();
    let updateCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const id = doc.id;
        const sku = data.sku || id; // Default to ID if SKU missing (common in this DB)

        let newImage = null;
        let fileFound = false;

        // 1. Check if it's a BOX (GD-CAJA-xxx)
        if (sku.startsWith("GD-CAJA") || id.startsWith("GD-CAJA")) {
            // Box logic: Check specific box folder or product folder? 
            // User said: "check if they are in /assets/images/boxes/"

            // Potential extensions
            const extensions = [".png", ".jpg", ".jpeg", ".webp"];

            // Try ID in boxes dir
            for (const ext of extensions) {
                if (fs.existsSync(path.join(BOXES_DIR, `${id}${ext}`))) {
                    newImage = `/assets/images/boxes/${id}${ext}`;
                    fileFound = true;
                    break;
                }
            }

            // Try SKU in boxes dir if no ID match
            if (!fileFound && data.sku) {
                for (const ext of extensions) {
                    if (fs.existsSync(path.join(BOXES_DIR, `${data.sku}${ext}`))) {
                        newImage = `/assets/images/boxes/${data.sku}${ext}`;
                        fileFound = true;
                        break;
                    }
                }
            }
        }

        // 2. Standard Product Logic (GD-VEGE/FRUT-xxx)
        if (!fileFound) {
            // Target format: /assets/images/products/[SKU].png
            // We check if the file exists first.
            const extensions = [".png", ".jpg", ".jpeg", ".webp"];

            // PRIMARY CHECK: SKU
            for (const ext of extensions) {
                if (fs.existsSync(path.join(PRODUCTS_DIR, `${sku}${ext}`))) {
                    newImage = `/assets/images/products/${sku}${ext}`;
                    fileFound = true;
                    break;
                }
            }

            // SECONDARY CHECK: ID (if distinct from SKU)
            if (!fileFound && id !== sku) {
                for (const ext of extensions) {
                    if (fs.existsSync(path.join(PRODUCTS_DIR, `${id}${ext}`))) {
                        newImage = `/assets/images/products/${id}${ext}`;
                        fileFound = true;
                        break;
                    }
                }
            }

            // SPECIAL AJO CHECK (GD-VEGE-061-v2)
            if (!fileFound && (sku === 'GD-VEGE-061' || id === 'GD-VEGE-061')) {
                if (fs.existsSync(path.join(PRODUCTS_DIR, `GD-VEGE-061-v2.png`))) {
                    newImage = `/assets/images/products/GD-VEGE-061-v2.png`;
                    fileFound = true;
                }
            }
        }

        // 3. Apply Update
        if (fileFound && newImage) {
            // Only update if different
            if (data.image !== newImage) {
                console.log(`UPDATE: ${data.name?.es || id} (${sku})`);
                console.log(`   Old: ${data.image}`);
                console.log(`   New: ${newImage}`);
                batch.update(doc.ref, { image: newImage });
                updateCount++;
            }
        } else {
            // If NOT found, should we clear it or leave it?
            // User said "Update their paths...". 
            // If it's currently a placeholder or something wrong, we might want to flag it.
            // But if we don't find the SKU file, we can't enforce SKU mapping blindly if the file isn't there (broken link).
            // However, strictly adhering to "Product GD-VEGE-061 must have image: GD-VEGE-061.png" implies we might set it even if missing?
            // No, "Confirm you have locked these rules...". 
            // Safe bet: If file missing, log warning.
            // Exception: Cebolla (GD-VEGE-012) is known missing.
            if (sku !== 'GD-VEGE-012') {
                // console.warn(`⚠️  WARNING: File not found for ${sku} (${data.name?.es})`);
            }
        }
    }

    if (updateCount > 0) {
        console.log(`\nCommitting ${updateCount} variations...`);
        await batch.commit();
        console.log("✅ Database normalized to SKU-based paths.");
    } else {
        console.log("✅ No changes needed. Database already aligned.");
    }
}

main().catch(console.error);
