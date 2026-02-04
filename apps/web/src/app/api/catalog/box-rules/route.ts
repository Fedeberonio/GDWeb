import { NextResponse } from "next/server";
import { fetchBoxRules } from "@/modules/catalog/api";

export async function GET() {
  try {
    const data = await fetchBoxRules();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.warn("Failed to fetch box rules from Firestore:", error);
    return NextResponse.json({ error: "Failed to fetch box rules." }, { status: 502 });
  }
}
