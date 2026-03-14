import { NextResponse } from "next/server";

import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);

    // Future implementation: Fetch history from Firestore
    // const db = getAdminFirestore();
    // const historyRef = db.collection("catalog_history").orderBy("timestamp", "desc").limit(200);
    // const snapshot = await historyRef.get();
    // const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // For now, return empty to fix broken UI
    return NextResponse.json({ data: [] }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
