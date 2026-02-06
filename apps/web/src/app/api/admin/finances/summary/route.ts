import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase/client";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const ORDERS_COLLECTION = "orders";
const MANUAL_SALES_COLLECTION = "manual_sales";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase not initialized");

    const [ordersSnapshot, manualSnapshot] = await Promise.all([
      getDocs(collection(db, ORDERS_COLLECTION)),
      getDocs(collection(db, MANUAL_SALES_COLLECTION)),
    ]);

    const orders = ordersSnapshot.docs.map((doc) => doc.data());
    const manualSales = manualSnapshot.docs.map((doc) => doc.data());

    // Exclude cancelled orders from financial stats
    const activeOrders = orders.filter((order: any) => order.status !== "cancelled");

    const totalWebSales = activeOrders.reduce((sum, order: any) => {
      return sum + (order?.totals?.total?.amount || 0);
    }, 0);

    const totalManualSales = manualSales.reduce((sum, sale: any) => {
      return sum + (typeof sale?.total === "number" ? sale.total : 0);
    }, 0);

    const pendingOrderInvoices = activeOrders.filter((order: any) => order?.payment?.status === "pending").length;
    const pendingManualInvoices = manualSales.filter((sale: any) => sale?.paymentStatus === "pending").length;
    const paidOrderInvoices = activeOrders.filter((order: any) => order?.payment?.status === "paid").length;
    const paidManualInvoices = manualSales.filter((sale: any) => sale?.paymentStatus === "paid").length;

    return NextResponse.json(
      {
        data: {
          totalWebSales,
          totalManualSales,
          totalRevenue: totalWebSales + totalManualSales,
          pendingInvoices: pendingOrderInvoices + pendingManualInvoices,
          paidInvoices: paidOrderInvoices + paidManualInvoices,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Finances Summary Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
