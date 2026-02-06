
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

    const targetBoxes = ["GD-CAJA-001", "GD-CAJA-002", "GD-CAJA-003"];
    const targetKeywords = ["papa", "batata", "cebolla", "platano", "limon", "lemon", "onion", "potato"];

    console.log("--- Inspecting Box 2 and Box 3 ---");

    for (const boxId of targetBoxes) {
        const doc = await db.collection("catalog_boxes").doc(boxId).get();
        if (!doc.exists) {
            console.log(`Box ${boxId} not found.`);
            continue;
        }

        const box = doc.data();
        console.log(`\n📦 BOX: ${boxId} (${box.name?.es})`);

        if (box.variants) {
            console.log("\n--- Audit Report ---");
            box.variants.forEach(variant => {
                const contents = variant.referenceContents || [];
                console.log(`Variant: ${variant.id.toUpperCase()} - Count: ${contents.length}`);

                let placeholderCount = 0;
                contents.forEach(item => {
                    const isPlaceholder = item.image.includes("placeholder");
                    if (isPlaceholder) {
                        console.log(`  ❌ PLACEHOLDER: ${item.name?.es} (${item.image})`);
                        placeholderCount++;
                    } else {
                        // console.log(`  ✅ OK: ${item.name?.es} (${item.image})`);
                    }
                });

                if (placeholderCount === 0) {
                    console.log("  ✅ No placeholders found.");
                } else {
                    console.log(`  ⚠️  Found ${placeholderCount} placeholder(s).`);
                }
            });
        }
    }
}

main().catch(console.error);
