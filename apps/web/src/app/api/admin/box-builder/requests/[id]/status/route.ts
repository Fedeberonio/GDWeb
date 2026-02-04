import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const REQUESTS_COLLECTION = "box_builder_requests";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await requireAdminSession(request);
    const body = await request.json();
    const db = getAdminFirestore();

    const requestId = decodeURIComponent(id);
    const docRef = db.collection(REQUESTS_COLLECTION).doc(requestId);

    await docRef.set(
      {
        status: body?.status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    const updated = await docRef.get();

    return NextResponse.json(
      { data: { id: updated.id, ...(updated.data() ?? {}) } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Box Builder Status Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
