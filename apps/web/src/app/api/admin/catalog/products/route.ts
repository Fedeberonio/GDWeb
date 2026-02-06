import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const PRODUCT_COLLECTION = "catalog_products";

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    );
  }
  return value;
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = db.collection(PRODUCT_COLLECTION) as FirebaseFirestore.Query;
    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Admin Product Fetch Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const rawBody = stripUndefined(await request.json());
    const body =
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? (rawBody as Record<string, unknown>)
        : {};

    const docRef = db.collection(PRODUCT_COLLECTION).doc();
    await docRef.set({
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await docRef.set({ id: docRef.id }, { merge: true });

    return NextResponse.json({
      data: { id: docRef.id, ...body }
    }, { status: 201 });

  } catch (error) {
    console.error("Admin Product Save Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
