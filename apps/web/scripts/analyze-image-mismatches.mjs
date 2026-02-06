
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const SERVICE_ACCOUNT_PATH = path.resolve("service-account.json");
const IMAGES_DIR = path.resolve("public/assets/images/products");

async function main() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error("Service account not found");
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    console.log("--- Analyzing Image Mismatches ---");

    const snapshot = await db.collection("catalog_products").limit(50).get(); // Check sample
    let mismatchCount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const imagePath = data.image;

        if (imagePath && typeof imagePath === 'string' && !imagePath.startsWith("http") && !imagePath.includes("placeholder")) {
            const filename = path.basename(imagePath);
            const fullPath = path.join(IMAGES_DIR, filename);

            if (!fs.existsSync(fullPath)) {
                console.log(`❌ MISMATCH: ${data.name?.es || data.name}`);
                console.log(`   Firestore: ${imagePath}`);
                console.log(`   Disk Path: ${fullPath} (NOT FOUND)`);
                mismatchCount++;
            }
        }
    });

    if (mismatchCount === 0) {
        console.log("✅ No mismatches found in sample.");
    } else {
        console.log(`\nFound ${mismatchCount} mismatches in sample.`);
    }
}

main().catch(console.error);
