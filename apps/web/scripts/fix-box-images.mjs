
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

    console.log("--- Fixing Box Images ---");

    const batch = db.batch();

    // Manual mapping based on 'ls' output
    const BOX_MAP = {
        "GD-CAJA-001": "/assets/images/boxes/GD-CAJA-001.png",
        "GD-CAJA-002": "/assets/images/boxes/GD-CAJA-002.jpg",
        "GD-CAJA-003": "/assets/images/boxes/GD-CAJA-003.jpg"
    };

    for (const [id, imagePath] of Object.entries(BOX_MAP)) {
        const ref = db.collection("catalog_boxes").doc(id);
        const doc = await ref.get();
        if (doc.exists) {
            console.log(`UPDATE: ${id} -> ${imagePath}`);
            batch.update(ref, { image: imagePath });
        } else {
            console.log(`WARNING: Box ${id} not found.`);
        }
    }

    await batch.commit();
    console.log("✅ Box images updated.");
}

main().catch(console.error);
