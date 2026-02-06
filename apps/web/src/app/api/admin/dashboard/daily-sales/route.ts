import { NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase/client";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 });
    }

    // Calcular fecha de inicio (hace N días)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query de órdenes finalizadas
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("status", "==", "confirmed"),
      where("createdAt", ">=", Timestamp.fromDate(startDate))
    );

    const snapshot = await getDocs(q);
    
    // Agrupar por día
    const salesByDay: Record<string, { sales: number; orders: number }> = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      if (!createdAt) return;
      
      const dayKey = createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!salesByDay[dayKey]) {
        salesByDay[dayKey] = { sales: 0, orders: 0 };
      }
      
      salesByDay[dayKey].sales += data.totals?.total || 0;
      salesByDay[dayKey].orders += 1;
    });

    // Convertir a array con últimos N días
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayKey = date.toISOString().split('T')[0];
      
      const dayData = salesByDay[dayKey] || { sales: 0, orders: 0 };
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      result.push({
        label: dayNames[date.getDay()],
        date: dayKey,
        sales: dayData.sales,
        orders: dayData.orders
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
