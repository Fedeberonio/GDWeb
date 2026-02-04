import dotenv from "dotenv";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";

dotenv.config();

type LocalizedName = { es?: string; en?: string };

async function run() {
  const snapshot = await getDb().collection(catalogCollections.products).get();
  const babies: Array<{ id: string; name?: LocalizedName }> = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { name?: LocalizedName };
    const nameEs = (data.name?.es ?? "").toLowerCase();
    const nameEn = (data.name?.en ?? "").toLowerCase();
    if (nameEs.includes("baby") || nameEn.includes("baby")) {
      babies.push({ id: doc.id, name: data.name });
    }
  });

  console.log(`Found baby products: ${babies.length}`);
  babies.slice(0, 20).forEach((item) => console.log(item.id, item.name));
}

run().catch((error) => {
  console.error("Failed to report baby products:", error);
  process.exit(1);
});
