
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

    // 1. Activate Cebolla
    console.log("Activating Cebolla (GD-VEGE-012)...");
    await db.collection("catalog_products").doc("GD-VEGE-012").update({
        isActive: true,
        status: "active"
    });

    // 2. Check Slugs vs Box Contents
    console.log("Checking mappings...");
    const papas = (await db.collection("catalog_products").doc("GD-VEGE-045").get()).data();
    console.log("Product (045) Slug:", papas.slug);
    console.log("Product (045) ID: GD-VEGE-045");

    const box = (await db.collection("catalog_boxes").doc("GD-CAJA-001").get()).data();
    const papasItem = box.variants[0].referenceContents.find(i => i.productId === "GD-VEGE-045");
    console.log("Box Item ProductSlug:", papasItem.productSlug);

    if (papas.slug !== papasItem.productSlug) {
        console.log("⚠️  MISMATCH DETECTED: Box uses ID/Slug mismatch.");
    } else {
        console.log("✅ Slugs match.");
    }
}

main().catch(console.error);
