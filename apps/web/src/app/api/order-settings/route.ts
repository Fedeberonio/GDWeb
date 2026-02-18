import { NextResponse } from "next/server";
import { loadOrderSettings } from "@/lib/config/load-order-settings";

export async function GET() {
  try {
    const data = await loadOrderSettings();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error loading public order settings:", error);
    return NextResponse.json({ error: "Failed to load order settings" }, { status: 500 });
  }
}

