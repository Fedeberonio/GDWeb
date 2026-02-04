
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const SERVICE_ACCOUNT_PATH = path.resolve("service-account.json");

async function main() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error("Service account not found");
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    console.log("--- Refactoring Box & Cebolla Paths ---");

    const batch = db.batch();

    // 1. Boxes
    const BOX_MAP = {
        "GD-CAJA-001": "/assets/images/boxes/GD-CAJA-001.png",
        "GD-CAJA-002": "/assets/images/boxes/GD-CAJA-002.jpg", // Kept extension
        "GD-CAJA-003": "/assets/images/boxes/GD-CAJA-003.jpg"  // Kept extension
    };

    for (const [id, imagePath] of Object.entries(BOX_MAP)) {
        const ref = db.collection("catalog_boxes").doc(id);
        console.log(`UPDATE BOX: ${id} -> ${imagePath}`);
        batch.update(ref, { image: imagePath });
    }

    // 2. Cebolla (GD-VEGE-012) - Removing Placeholder
    const cebollaId = "GD-VEGE-012";
    const cebollaRef = db.collection("catalog_products").doc(cebollaId);

    console.log("UPDATE PRODUCT: Cebolla (GD-VEGE-012) -> /assets/images/products/GD-VEGE-012.png (Visual Fallback)");
    batch.set(cebollaRef, {
        sku: cebollaId,
        name: { es: "Cebolla morada/amarilla", en: "Red/Yellow Onion" },
        image: "/assets/images/products/GD-VEGE-012.png"
    }, { merge: true });

    await batch.commit();
    console.log("✅ Updates committed.");
}

main().catch(console.error);
