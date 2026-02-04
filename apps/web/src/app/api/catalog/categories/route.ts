import { NextResponse } from "next/server";
import { fetchProductCategories } from "@/modules/catalog/api";

export async function GET() {
  try {
    const data = await fetchProductCategories();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.warn("Failed to fetch categories from Firestore:", error);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 502 });
  }
}
