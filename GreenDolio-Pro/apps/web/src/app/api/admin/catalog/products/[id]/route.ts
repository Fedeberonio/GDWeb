import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
  const apiUrl = `${NEXT_PUBLIC_API_BASE_URL}/admin/catalog/products/${encodeURIComponent(id)}`;

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
