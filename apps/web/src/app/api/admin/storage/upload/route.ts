import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const authHeader = request.headers.get("authorization");
    const payload = await request.json();
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/admin/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: authHeader ?? "",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin Storage Upload Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
