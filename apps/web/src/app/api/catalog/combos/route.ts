import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function GET() {
  try {
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/catalog/combos`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch combos" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
