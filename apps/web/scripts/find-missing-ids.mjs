
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

    console.log("Searching catalog products for 'Plátano' and 'Limón'...");
    const snapshot = await db.collection("catalog_products").get();

    snapshot.forEach(doc => {
        const data = doc.data();
        const name = (data.name?.es || data.name || "").toLowerCase();

        if (name.includes("plátano") || name.includes("platano") || name.includes("limón") || name.includes("limon")) {
            console.log(`FOUND: "${data.name?.es || data.name}"`);
            console.log(`  ID: ${doc.id}`);
            console.log(`  SKU: ${data.sku}`);
            console.log(`  Image Field: ${data.image}`);
        }
    });
}

main().catch(console.error);
