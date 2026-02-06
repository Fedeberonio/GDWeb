import { NextResponse } from "next/server";
import { fetchLunchCombos } from "@/modules/catalog/api";

export async function GET() {
  try {
    const data = await fetchLunchCombos();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
