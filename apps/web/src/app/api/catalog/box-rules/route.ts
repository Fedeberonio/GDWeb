import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function GET() {
  try {
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
    const apiBase = NEXT_PUBLIC_API_BASE_URL ?? "";
    const hasRemoteApi =
      apiBase !== "" && !apiBase.includes("localhost") && !apiBase.includes("mock");

    if (!hasRemoteApi) {
      console.warn("Catalog API base URL not configured for box rules.");
      return NextResponse.json({ data: [] });
    }

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/catalog/box-rules`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.warn("Failed to fetch box rules from API, returning empty data:", error);
    return NextResponse.json({ data: [] });
  }
}
