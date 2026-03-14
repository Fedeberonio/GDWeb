import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { DEFAULT_ORDER_SETTINGS, type OrderSettings } from "@/lib/config/order-settings";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    
    const db = getAdminFirestore();
    const docRef = db.collection("system_settings").doc("order_config");
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ data: DEFAULT_ORDER_SETTINGS });
    }
    
    return NextResponse.json({ data: doc.data() });
  } catch (error) {
    console.error("Error fetching order settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession(request);
    const body = await request.json();
    
    const settings: OrderSettings = {
      paymentFeePercentage: Number(body.paymentFeePercentage) || 10,
      deliveryFeeAmount: Number(body.deliveryFeeAmount) || 100,
      deliveryFeeDays: Array.isArray(body.deliveryFeeDays) ? body.deliveryFeeDays : ["Martes", "Jueves", "Sábado"],
      returnDiscountAmount: Number(body.returnDiscountAmount) || 30,
      usdExchangeRateDop: Number(body.usdExchangeRateDop) || 59,
    };
    
    const db = getAdminFirestore();
    const docRef = db.collection("system_settings").doc("order_config");
    await docRef.set(settings);
    
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("Error updating order settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
