import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const REQUESTS_COLLECTION = "box_builder_requests";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "100");
    const safeLimit = Number.isFinite(limitParam) ? limitParam : 100;

    const snapshot = await db
      .collection(REQUESTS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(safeLimit)
      .get();

    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Admin Box Builder Requests Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
