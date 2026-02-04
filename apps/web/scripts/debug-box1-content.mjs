
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

    console.log("--- Inspecting Box 1 (GD-CAJA-001) Contents ---");

    const doc = await db.collection("catalog_boxes").doc("GD-CAJA-001").get();
    if (!doc.exists) {
        console.log("Box not found.");
        return;
    }

    const box = doc.data();
    console.log(`Box Name: ${box.name?.es}`);

    if (box.variants) {
        box.variants.forEach(variant => {
            console.log(`\nVariant: ${variant.id}`);
            if (variant.referenceContents) {
                variant.referenceContents.forEach(item => {
                    console.log(`  Item:`);
                    console.log(`    Name (Raw):`, item.name);
                    console.log(`    ID: ${item.productId}`);
                    console.log(`    Image: ${item.image}`);
                });
            }
        });
    }
}

main().catch(console.error);
