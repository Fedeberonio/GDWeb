import fs from "fs";
import admin from "firebase-admin";

const serviceAccountPath = "service-account.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Missing service-account.json in repo root.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const updates = [
  {
    id: "botella-jp-litro",
    name: "Botella JP Litro",
    unitPrice: 20.48,
    category: "Glass",
    supplier: "Casa Consuelo",
    isReturnable: true,
    action: { type: "increment", value: 24 },
  },
  {
    id: "tapa-negra-verde",
    name: "Tapa Negra Botella Verde",
    unitPrice: 2.47,
    category: "Other",
    supplier: "Casa Consuelo",
    isReturnable: false,
    action: { type: "increment", value: 24 },
  },
  {
    id: "caja-panificadora-17x13x8",
    name: "Caja Panificadora 17x13x8",
    unitPrice: 1.35,
    category: "Packaging",
    supplier: "TodoCartonSK",
    isReturnable: false,
    action: { type: "set", value: 15 },
  },
  {
    id: "caja-8x8x8-swk",
    name: "Caja 8x8x8 SW K",
    unitPrice: 0.71,
    category: "Packaging",
    supplier: "TodoCartonSK",
    isReturnable: false,
    action: { type: "set", value: 10 },
  },
];

const now = admin.firestore.FieldValue.serverTimestamp();

for (const item of updates) {
  const ref = db.collection("catalog_supplies").doc(item.id);
  const snapshot = await ref.get();
  const existing = snapshot.exists ? snapshot.data() : {};
  const currentStock = typeof existing?.stock === "number" ? existing.stock : 0;

  const nextStock =
    item.action.type === "increment"
      ? currentStock + item.action.value
      : item.action.value;

  const payload = {
    id: item.id,
    name: item.name,
    category: item.category,
    supplier: item.supplier,
    unitPrice: item.unitPrice,
    stock: nextStock,
    minStock: typeof existing?.minStock === "number" ? existing.minStock : 0,
    isReturnable: item.isReturnable,
    currency: "DOP",
    updatedAt: now,
    createdAt: existing?.createdAt ?? now,
  };

  await ref.set(payload, { merge: true });

  await db.collection("supply_logs").add({
    supplyId: item.id,
    delta: nextStock - currentStock,
    previousStock: currentStock,
    newStock: nextStock,
    actorEmail: "system-seed",
    createdAt: now,
    note: `seed:${item.action.type}`,
  });

  console.log(`Updated ${item.id}: ${currentStock} -> ${nextStock}`);
}

console.log("Supply seed complete.");
