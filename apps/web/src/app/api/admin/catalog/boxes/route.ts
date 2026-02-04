import { NextResponse } from "next/server";

import { fetchBoxes } from "@/modules/catalog/api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const BOXES_COLLECTION = "catalog_products";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const data = await fetchBoxes();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Admin Box Fetch Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const body = await request.json();
    const docRef = db.collection(BOXES_COLLECTION).doc();
    await docRef.set({
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await docRef.set({ id: docRef.id }, { merge: true });

    return NextResponse.json({ data: { id: docRef.id, ...body } }, { status: 201 });
  } catch (error) {
    console.error("Admin Box Save Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
