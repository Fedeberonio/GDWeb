
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Load Service Account
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve("service-account.json"), "utf-8"));

console.log("Initializing Firebase Admin with project:", serviceAccount.project_id);

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function inspect() {
    // Try to find Box 1. User mentioned "catalog_boxes".
    // Common IDs for Box 1 could be 'GD-CAJA-001', 'box-1', etc.
    // Let's list all boxes first.
    const snapshot = await db.collection("catalog_boxes").get();
    if (snapshot.empty) {
        console.log("No documents found in catalog_boxes.");
        return;
    }

    snapshot.forEach(doc => {
        console.log(`\n=== Box ID: ${doc.id} ===`);
        const data = doc.data();
        console.log(JSON.stringify(data, null, 2));
    });
}

inspect().catch(console.error);
