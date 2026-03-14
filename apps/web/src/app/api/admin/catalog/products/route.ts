import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import {
  matchesCatalogProductType,
  normalizeCatalogProduct,
} from "@/modules/catalog/product-normalization";
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

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const { searchParams } = new URL(request.url);
    const requestedType = searchParams.get("type");
    const snapshot = await db.collection(PRODUCT_COLLECTION).get();
    const data = snapshot.docs
      .map((doc) => normalizeCatalogProduct(doc.id, (doc.data() ?? {}) as Record<string, unknown>))
      .filter((product) => matchesCatalogProductType(product, requestedType));

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
    const body = parseAdminProductPayload(rawBody) as Record<string, unknown>;

    // CRITICAL: Use SKU as document ID (like existing products GD-VEGE-067, etc.)
    const sku = body.sku?.toString().trim();

    if (!sku) {
      return NextResponse.json(
        { error: "SKU es requerido para crear un producto" },
        { status: 400 }
      );
    }

    // Validate SKU format (optional but recommended)
    if (!/^[A-Za-z0-9\-_]+$/.test(sku)) {
      return NextResponse.json(
        { error: "SKU solo puede contener letras, números, guiones y guiones bajos" },
        { status: 400 }
      );
    }

    // Check if SKU already exists (prevent duplicates)
    const docRef = db.collection(PRODUCT_COLLECTION).doc(sku);
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      return NextResponse.json(
        { error: `El SKU "${sku}" ya existe. Por favor usa otro SKU.` },
        { status: 409 }
      );
    }

    // Create product with SKU as document ID
    const createdAt = new Date().toISOString();
    const basePayload = {
      ...body,
      sku: sku, // Ensure sku field matches document ID
      id: sku, // Set id field to match document ID
      createdAt,
      updatedAt: createdAt,
    };
    const normalized = normalizeCatalogProduct(sku, basePayload);
    await docRef.set(
      stripUndefined({
        ...basePayload,
        id: sku,
        sku: normalized.sku,
        slug: normalized.slug,
        name: normalized.name,
        description: normalized.description,
        unit: normalized.unit,
        image: normalized.image,
        categoryId: normalized.categoryId,
        price: normalized.price,
        salePrice: normalized.salePrice,
        type: normalized.type,
        status: normalized.status,
        isActive: normalized.isActive,
      }) as Record<string, unknown>,
    );

    return NextResponse.json({
      data: normalized,
    }, { status: 201 });

  } catch (error) {
    console.error("Admin Product Save Error:", error);
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
