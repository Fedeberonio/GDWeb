import { NextResponse } from "next/server";
import { fetchBoxes } from "@/modules/catalog/api";

export async function GET() {
  try {
    const data = await fetchBoxes();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.warn("Failed to fetch boxes from Firestore:", error);
    return NextResponse.json({ error: "Failed to fetch boxes." }, { status: 502 });
  }
}
