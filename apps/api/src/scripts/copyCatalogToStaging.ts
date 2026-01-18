import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { initializeApp, cert, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

const COLLECTIONS = [
  "catalog_categories",
  "catalog_products",
  "catalog_boxes",
] as const;

const [sourceJsonPath] = process.argv.slice(2);

if (!sourceJsonPath) {
  console.error("Usage: ts-node-dev src/scripts/copyCatalogToStaging.ts /path/to/source.json");
  process.exit(1);
}

const resolvedPath = path.resolve(sourceJsonPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Source JSON not found: ${resolvedPath}`);
  process.exit(1);
}

const sourceServiceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf-8")) as ServiceAccount;

const targetProjectId = process.env.FIREBASE_PROJECT_ID;
const targetClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const targetPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!targetProjectId || !targetClientEmail || !targetPrivateKey) {
  console.error("Missing staging credentials in .env (FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY).");
  process.exit(1);
}

if (sourceServiceAccount.project_id === targetProjectId) {
  console.error("Source and target project IDs are the same. Aborting to avoid overwriting production.");
  process.exit(1);
}

const sourceApp = initializeApp(
  {
    credential: cert({
      projectId: sourceServiceAccount.project_id,
      clientEmail: sourceServiceAccount.client_email,
      privateKey: sourceServiceAccount.private_key,
    }),
  },
  "source",
);

const targetApp = initializeApp(
  {
    credential: cert({
      projectId: targetProjectId,
      clientEmail: targetClientEmail,
      privateKey: targetPrivateKey,
    }),
  },
  "target",
);

const sourceDb = getFirestore(sourceApp);
const targetDb = getFirestore(targetApp);

async function copyCollection(collectionName: string) {
  const snapshot = await sourceDb.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`- ${collectionName}: no docs to copy`);
    return;
  }

  const docs = snapshot.docs;
  let batchCount = 0;
  let copied = 0;
  let batch = targetDb.batch();

  for (const doc of docs) {
    const data = doc.data();
    const targetRef = targetDb.collection(collectionName).doc(doc.id);
    batch.set(targetRef, data, { merge: false });
    copied += 1;

    if (copied % 400 === 0) {
      await batch.commit();
      batch = targetDb.batch();
      batchCount += 1;
    }
  }

  if (copied % 400 !== 0) {
    await batch.commit();
    batchCount += 1;
  }

  console.log(`- ${collectionName}: ${copied} docs copied in ${batchCount} batch(es)`);
}

async function main() {
  console.log(`Source project: ${sourceServiceAccount.project_id}`);
  console.log(`Target project: ${targetProjectId}`);
  console.log("Starting copy...");

  for (const collectionName of COLLECTIONS) {
    await copyCollection(collectionName);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error("Copy failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([deleteApp(sourceApp), deleteApp(targetApp)]);
  });
