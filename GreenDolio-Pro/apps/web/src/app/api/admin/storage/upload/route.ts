import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/admin/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
