
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const serviceAccount = JSON.parse(fs.readFileSync(path.resolve("service-account.json"), "utf-8"));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function verifyBox1() {
    console.log("Connecting to Firestore...");
    const docRef = db.collection("catalog_boxes").doc("GD-CAJA-001");
    const doc = await docRef.get();

    if (!doc.exists) {
        console.log("❌ Document 'GD-CAJA-001' not found in 'catalog_boxes' collection.");
        return;
    }

    const data = doc.data();
    console.log(`\n✅ SOURCE: Firestore Collection 'catalog_boxes', Document 'GD-CAJA-001'`);
    console.log(`Box Name: ${data.name?.es}`);

    if (data.variants) {
        data.variants.forEach(variant => {
            console.log(`\n--- Variant: ${variant.id} ---`);
            if (variant.referenceContents) {
                console.log(JSON.stringify(variant.referenceContents.map(item => ({
                    Name: item.name?.es,
                    SKU_ID: item.productId,
                    Image_Path: item.image
                })), null, 2));
            } else {
                console.log("No referenceContents found.");
            }
        });
    } else {
        console.log("No variants found.");
    }
}

verifyBox1().catch(console.error);
