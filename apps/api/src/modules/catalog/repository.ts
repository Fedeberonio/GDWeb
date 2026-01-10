import { getDb } from "../../lib/firestore";
import type { Box, Product, ProductCategory } from "./schemas";

const COLLECTIONS = {
  categories: "catalog_categories",
  products: "catalog_products",
  boxes: "catalog_boxes",
};

export async function listCategories(): Promise<ProductCategory[]> {
  const snapshot = await getDb().collection(COLLECTIONS.categories).orderBy("sortOrder").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProductCategory));
}

export async function listProducts(): Promise<Product[]> {
  const snapshot = await getDb().collection(COLLECTIONS.products).where("status", "==", "active").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
}

export async function listAllProducts(): Promise<Product[]> {
  const snapshot = await getDb().collection(COLLECTIONS.products).orderBy("name.es").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProductById(id: string): Promise<Product | null> {
  console.log(`[getProductById] Searching for product with ID: "${id}" (length: ${id.length})`);
  const doc = await getDb().collection(COLLECTIONS.products).doc(id).get();
  if (!doc.exists) {
    console.warn(`[getProductById] Document not found for ID: "${id}"`);
    return null;
  }
  const data = doc.data();
  console.log(`[getProductById] Document found: ${data?.name?.es || "unknown"} (doc.id: "${doc.id}")`);
  return { id: doc.id, ...data } as Product;
}

export async function saveProduct(product: Product): Promise<void> {
  await getDb().collection(COLLECTIONS.products).doc(product.id).set(product, { merge: true });
}

export async function listBoxes(): Promise<Box[]> {
  const snapshot = await getDb().collection(COLLECTIONS.boxes).where("isFeatured", "==", true).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Box));
}

export async function listAllBoxes(): Promise<Box[]> {
  const snapshot = await getDb().collection(COLLECTIONS.boxes).orderBy("name.es").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Box));
}

export async function getBoxById(id: string): Promise<Box | null> {
  const doc = await getDb().collection(COLLECTIONS.boxes).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Box;
}

export async function saveBox(box: Box): Promise<void> {
  await getDb().collection(COLLECTIONS.boxes).doc(box.id).set(box, { merge: true });
}

export const catalogCollections = COLLECTIONS;
