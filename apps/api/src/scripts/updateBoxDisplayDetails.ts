import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

const boxDetails: Record<string, { dimensionsLabel: string; weightLabel: string }> = {
  "box-1": { dimensionsLabel: "8\" x 8\" x 8\"", weightLabel: "7.7 lb (3.5 kg)" },
  "box-2": { dimensionsLabel: "10\" x 10\" x 10\"", weightLabel: "13.2 lb (6 kg)" },
  "box-3": { dimensionsLabel: "12\" x 12\" x 12\"", weightLabel: "26.4 lb (12 kg)" },
  "caribbean-fresh-pack": { dimensionsLabel: "8\" x 8\" x 8\"", weightLabel: "7.7 lb (3.5 kg)" },
  "island-weekssential": { dimensionsLabel: "10\" x 10\" x 10\"", weightLabel: "13.2 lb (6 kg)" },
  "allgreenxclusive": { dimensionsLabel: "12\" x 12\" x 12\"", weightLabel: "26.4 lb (12 kg)" },
};

async function run() {
  const snapshot = await getDb().collection(catalogCollections.boxes).get();
  const batch = getDb().batch();
  let updates = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { id?: string; slug?: string };
    const docId = doc.id;
    const match =
      (docId && boxDetails[docId]) ||
      (data.id && boxDetails[data.id]) ||
      (data.slug && boxDetails[data.slug]);
    if (!match) return;

    batch.set(
      doc.ref,
      {
        dimensionsLabel: match.dimensionsLabel,
        weightLabel: match.weightLabel,
      },
      { merge: true },
    );
    updates += 1;
  });

  if (updates > 0) {
    await batch.commit();
  }

  console.log(`Updated box display details for ${updates} boxes.`);
}

run().catch((error) => {
  console.error("Failed to update box display details:", error);
  process.exit(1);
});
