import { NextResponse } from "next/server";

import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { getAdminFirestore } from "@/lib/firebase/admin";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function resolveOrderTotal(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const amount = (value as { amount?: unknown }).amount;
    if (typeof amount === "number") return amount;
  }
  return 0;
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    const db = getAdminFirestore();

    // Calcular fecha de inicio (hace N días)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query by createdAt only to avoid composite index dependency; filter status in memory
    const snapshot = await db.collection("orders").where("createdAt", ">=", startDate).get();

    // Agrupar por día
    const salesByDay: Record<string, { sales: number; orders: number }> = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const status = typeof data.status === "string" ? data.status : "";
      if (status !== "confirmed") return;

      const createdAt = toDate(data.createdAt);
      if (!createdAt) return;

      const dayKey = createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
      if (!salesByDay[dayKey]) {
        salesByDay[dayKey] = { sales: 0, orders: 0 };
      }

      const totals = data.totals as { total?: unknown } | undefined;
      salesByDay[dayKey].sales += resolveOrderTotal(totals?.total);
      salesByDay[dayKey].orders += 1;
    });

    // Convertir a array con últimos N días
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayKey = date.toISOString().split("T")[0];

      const dayData = salesByDay[dayKey] || { sales: 0, orders: 0 };
      const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

      result.push({
        label: dayNames[date.getDay()],
        date: dayKey,
        sales: dayData.sales,
        orders: dayData.orders,
      });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily sales" },
      { status: 500 }
    );
  }
}
