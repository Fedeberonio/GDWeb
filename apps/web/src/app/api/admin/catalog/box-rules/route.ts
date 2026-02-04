import { NextResponse } from "next/server";

import { fetchBoxRules } from "@/modules/catalog/api";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const data = await fetchBoxRules();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Admin Box Rules Fetch Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
