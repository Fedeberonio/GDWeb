import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";
import { staticProducts } from "@/modules/catalog/static-data";

export async function GET() {
  try {
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
    const apiBase = NEXT_PUBLIC_API_BASE_URL ?? "";
    const hasRemoteApi =
      apiBase !== "" && !apiBase.includes("localhost") && !apiBase.includes("mock");
    const allowStaticFallback = process.env.NODE_ENV !== "production";

    if (!hasRemoteApi) {
      if (allowStaticFallback) {
        return NextResponse.json({ data: staticProducts });
      }
      console.warn("Catalog API base URL not configured for products.");
      return NextResponse.json({ data: [] });
    }

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/catalog/products`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to fetch products from API, using static data:", error);
      return NextResponse.json({ data: staticProducts });
    }
    console.warn("Failed to fetch products from API, returning empty data:", error);
    return NextResponse.json({ data: [] });
  }
}
