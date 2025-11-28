import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Failed to proxy order request", error);
    return NextResponse.json({ error: "No se pudo procesar el pedido" }, { status: 500 });
  }
}
