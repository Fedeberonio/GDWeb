import { NextResponse } from "next/server";
import { fetchProducts } from "@/modules/catalog/api";

export async function GET() {
  try {
    const data = await fetchProducts();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.warn("Failed to fetch products from Firestore:", error);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 502 });
  }
}
