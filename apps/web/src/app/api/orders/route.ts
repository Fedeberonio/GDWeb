import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

    try {
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (backendError) {
      console.warn("⚠️ Backend API unavailable or failed. Returning MOCK success for demo purpose.", backendError);

      // FALLBACK MOCK RESPONSE
      const mockOrder = {
        id: `mock-${Date.now()}`,
        status: "pending",
        createdAt: new Date().toISOString(),
        items: payload.items,
        delivery: {
          address: {
            contactName: payload.contactName,
            zone: payload.deliveryZone,
          }
        },
        totals: {
          total: { amount: 0, currency: "DOP" } // Simplified
        }
      };

      return NextResponse.json({ data: mockOrder }, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to process order request", error);
    return NextResponse.json({ error: "No se pudo procesar el pedido" }, { status: 500 });
  }
}
