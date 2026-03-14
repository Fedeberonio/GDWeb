
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

    const ids = ["GD-VEGE-012", "GD-VEGE-045", "GD-VEGE-061", "GD-VEGE-064", "GD-VEGE-067", "GD-VEGE-046"];

    console.log("--- Checking Product Status ---");

    for (const id of ids) {
        const doc = await db.collection("catalog_products").doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            console.log(`ID: ${id}`);
            console.log(`  Name:`, data.name);
            console.log(`  Status: ${data.status}`);
            console.log(`  IsActive: ${data.isActive}`);
        } else {
            console.log(`ID: ${id} - NOT FOUND`);
        }
    }
}

main().catch(console.error);
