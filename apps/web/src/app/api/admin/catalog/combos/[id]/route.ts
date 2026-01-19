import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
    const body = await request.json();
    const { id } = await params;
    const comboId = decodeURIComponent(id);

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/admin/catalog/combos/${comboId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData?.error ?? "Failed to update combo" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating combo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
