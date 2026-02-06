import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase/client";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const ORDERS_COLLECTION = "orders";
const SUPPLIES_COLLECTION = "catalog_supplies";
const USERS_COLLECTION = "users";

function isSameMonth(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase not initialized");

    const [ordersSnapshot, suppliesSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, ORDERS_COLLECTION)),
      getDocs(collection(db, SUPPLIES_COLLECTION)),
      getDocs(collection(db, USERS_COLLECTION)),
    ]);

    const now = new Date();
    const orders = ordersSnapshot.docs.map((doc) => doc.data());
    const supplies = suppliesSnapshot.docs.map((doc) => doc.data());
    const users = usersSnapshot.docs.map((doc) => doc.data());

    const totalSalesMonth = orders.reduce((sum, order: any) => {
      const createdAt = order?.createdAt?.toDate?.() ?? new Date(order?.createdAt ?? 0);
      if (!Number.isNaN(createdAt.getTime()) && isSameMonth(createdAt, now)) {
        return sum + (order?.totals?.total?.amount || 0);
      }
      return sum;
    }, 0);

    const pendingOrders = orders.filter((order: any) => order?.status === "pending").length;
    const criticalSupplies = supplies.filter((supply: any) => {
      const stock = typeof supply?.stock === "number" ? supply.stock : 0;
      const minStock = typeof supply?.minStock === "number" ? supply.minStock : 0;
      return stock <= minStock;
    }).length;

    const newCustomers = users.filter((user: any) => {
      const created = user?.fechaCreacion?.toDate?.() ?? new Date(user?.fechaCreacion ?? 0);
      return !Number.isNaN(created.getTime()) && isSameMonth(created, now);
    }).length;

    return NextResponse.json(
      {
        data: {
          totalSalesMonth,
          pendingOrders,
          criticalSupplies,
          newCustomers,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Dashboard Metrics Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
