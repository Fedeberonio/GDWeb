import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/admin/catalog/boxes`, {
    headers: {
      authorization: authHeader,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
