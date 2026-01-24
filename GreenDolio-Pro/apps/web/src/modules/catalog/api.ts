import type { Box, Product, ProductCategory } from "./types";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

// Helper para obtener DB
function getDb() {
  return getFirebaseFirestore();
}

export async function fetchProductCategories(): Promise<ProductCategory[]> {
  try {
    const db = getDb();
    const q = query(collection(db, "categories"), orderBy("sortOrder", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ProductCategory);
  } catch (error) {
    console.error("Error fetching categories from Firestore:", error);
    return [];
  }
}

export async function fetchBoxes(): Promise<Box[]> {
  try {
    const db = getDb();
    // Fetch all boxes
    const q = query(collection(db, "boxes"));
    const snapshot = await getDocs(q);

    // Mapear y asegurar que los datos coincidan con el tipo Box
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Box;
    });
  } catch (error) {
    console.error("Error fetching boxes from Firestore:", error);
    return [];
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const db = getDb();
    // Traer solo productos activos por defecto para el catálogo público
    const q = query(collection(db, "products"), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Product;
    });
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return [];
  }
}
