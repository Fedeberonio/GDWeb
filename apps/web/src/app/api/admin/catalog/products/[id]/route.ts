import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { normalizeCatalogProduct } from "@/modules/catalog/product-normalization";
import { parseAdminProductPayload } from "@/modules/catalog/admin-schemas";

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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdminSession(request);
    const body = parseAdminProductPayload(stripUndefined(await request.json()));
    const db = getAdminFirestore();

    const productId = decodeURIComponent(id);
    const docRef = db.collection(PRODUCT_COLLECTION).doc(productId);
    const currentDoc = await docRef.get();

    const payload = body as Record<string, unknown>;
    const mergedPayload = {
      ...(currentDoc.data() ?? {}),
      ...payload,
      sku: typeof payload.sku === "string" && payload.sku.trim() ? payload.sku.trim() : productId,
      id: productId,
    };
    const normalized = normalizeCatalogProduct(productId, mergedPayload);
    await docRef.set(
      stripUndefined({
        ...mergedPayload,
        sku: normalized.sku,
        id: productId,
        type: normalized.type,
        status: normalized.status,
        isActive: normalized.isActive,
        updatedAt: new Date().toISOString(),
      }) as Record<string, unknown>,
    );

    const updated = await docRef.get();
    return NextResponse.json(
      { data: normalizeCatalogProduct(updated.id, (updated.data() ?? {}) as Record<string, unknown>) },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin Product Update Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message.startsWith("Datos de producto inválidos:")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const productId = decodeURIComponent(id);
    await db.collection(PRODUCT_COLLECTION).doc(productId).delete();

    return NextResponse.json({ data: { id: productId } }, { status: 200 });
  } catch (error) {
    console.error("Admin Product Delete Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
