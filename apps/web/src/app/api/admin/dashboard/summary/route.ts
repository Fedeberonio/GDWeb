import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase/client";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const PRODUCTS_COLLECTION = "catalog_products";
const BOXES_COLLECTION = "catalog_boxes";
const REQUESTS_COLLECTION = "box_builder_requests";
const SUPPLIES_COLLECTION = "catalog_supplies";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase not initialized");

    const [productsSnapshot, boxesSnapshot, requestsSnapshot, suppliesSnapshot] = await Promise.all([
      getDocs(collection(db, PRODUCTS_COLLECTION)),
      getDocs(collection(db, BOXES_COLLECTION)),
      getDocs(collection(db, REQUESTS_COLLECTION)),
      getDocs(collection(db, SUPPLIES_COLLECTION)),
    ]);

    const products = productsSnapshot.docs.map((doc) => doc.data());
    const boxes = boxesSnapshot.docs.map((doc) => doc.data());
    const requests = requestsSnapshot.docs.map((doc) => doc.data());
    const supplies = suppliesSnapshot.docs.map((doc) => doc.data());

    const pendingRequests = requests.filter((request: any) => request?.status === "pending").length;
    const lowStockCount = supplies.filter((supply: any) => {
      const stock = typeof supply?.stock === "number" ? supply.stock : 0;
      const minStock = typeof supply?.minStock === "number" ? supply.minStock : 0;
      return stock <= minStock;
    }).length;

    return NextResponse.json(
      {
        data: {
          productCount: products.length,
          boxCount: boxes.length,
          requestCount: requests.length,
          pendingRequests,
          lowStockCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Dashboard Summary Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
