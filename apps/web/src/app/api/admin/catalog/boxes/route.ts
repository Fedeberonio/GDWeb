import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { parseAdminBoxPayload } from "@/modules/catalog/admin-schemas";
import { assertValidBoxReferenceProducts } from "@/modules/catalog/box-admin-validation";

const PRODUCT_COLLECTION = "catalog_products";
const BOX_COLLECTION = "catalog_boxes";
const BOX_DEFINITIONS_COLLECTION = "box_definitions";
const BOX_RULES_COLLECTION = "catalog_box_rules";

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    ) as T;
  }

  return value;
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const snapshot = await db.collection(BOX_COLLECTION).get();
    const data = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() ?? {}) }) as Record<string, unknown> & { id: string })
      .sort((left, right) => {
        const leftName =
          typeof (left.name as { es?: string } | undefined)?.es === "string"
            ? ((left.name as { es?: string }).es ?? left.id)
            : left.id;
        const rightName =
          typeof (right.name as { es?: string } | undefined)?.es === "string"
            ? ((right.name as { es?: string }).es ?? right.id)
            : right.id;
        return leftName.localeCompare(rightName, "es");
      });
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

    const body = parseAdminBoxPayload(await request.json()) as Record<string, unknown>;
    const requestedId =
      typeof body.id === "string" && body.id.trim()
        ? body.id.trim().toUpperCase()
        : typeof body.sku === "string" && body.sku.trim()
          ? body.sku.trim().toUpperCase()
          : db.collection(BOX_COLLECTION).doc().id;
    const now = new Date().toISOString();
    const variants = Array.isArray(body.variants) ? body.variants : [];

    await assertValidBoxReferenceProducts(db, variants as Array<Record<string, unknown>>);

    const boxPayload = stripUndefined({
      slug: typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : requestedId.toLowerCase(),
      name: body.name ?? { es: requestedId, en: requestedId },
      description: body.description,
      price: body.price ?? { amount: 0, currency: "DOP" },
      durationDays: body.durationDays,
      weightLabel: body.weightLabel,
      dimensionsLabel: body.dimensionsLabel,
      heroImage: body.heroImage ?? body.image ?? `/assets/images/boxes/${requestedId}.png`,
      image: body.image ?? body.heroImage ?? `/assets/images/boxes/${requestedId}.png`,
      isFeatured: body.isFeatured ?? false,
      status: body.status ?? "inactive",
      ruleId:
        typeof body.ruleId === "string" && body.ruleId.trim()
          ? body.ruleId.trim().toUpperCase()
          : requestedId,
      variants,
      metadata: body.metadata,
      createdAt: now,
      updatedAt: now,
    });

    const productPayload = stripUndefined({
      sku: requestedId,
      slug: boxPayload.slug,
      name: boxPayload.name,
      description: boxPayload.description,
      price:
        typeof (boxPayload.price as { amount?: unknown } | undefined)?.amount === "number"
          ? (boxPayload.price as { amount: number }).amount
          : Number((boxPayload.price as { amount?: unknown } | undefined)?.amount ?? 0),
      image: boxPayload.heroImage,
      isFeatured: boxPayload.isFeatured,
      weightLabel: boxPayload.weightLabel,
      dimensionsLabel: boxPayload.dimensionsLabel,
      status: boxPayload.status === "active" ? "active" : "inactive",
      isActive: boxPayload.status === "active",
      type: "box",
      categoryId: "cajas",
      createdAt: now,
      updatedAt: now,
    }) as Record<string, unknown>;

    const durationDays = Number((boxPayload as { durationDays?: unknown }).durationDays ?? 0);
    if (Number.isFinite(durationDays) && durationDays > 0) {
      productPayload.attributes = { duration: `${durationDays} dias` };
    }

    const definitionPayload = stripUndefined({
      variants: Array.isArray(boxPayload.variants)
        ? boxPayload.variants.map((variant: Record<string, unknown>) => ({
            name:
              (variant.name as { es?: string; en?: string } | undefined)?.es ??
              (variant.name as { en?: string } | undefined)?.en ??
              variant.slug ??
              variant.id ??
              "MIX",
            items: Array.isArray(variant.referenceContents)
              ? variant.referenceContents
                  .map((content: Record<string, unknown>) => ({
                    product:
                      typeof content.productId === "string" && content.productId.trim()
                        ? content.productId.trim().toUpperCase()
                        : (content.name as { es?: string; en?: string } | undefined)?.es ??
                          (content.name as { en?: string } | undefined)?.en ??
                          "",
                    quantity: Number(content.quantity) || 1,
                  }))
                  .filter((item: { product: string }) => item.product)
              : [],
          }))
        : [],
      createdAt: now,
      updatedAt: now,
    });

    const rulePayload = stripUndefined({
      displayName:
        (boxPayload.name as { es?: string; en?: string } | undefined)?.es ??
        (boxPayload.name as { en?: string } | undefined)?.en ??
        requestedId,
      baseContents:
        Array.isArray(boxPayload.variants) && boxPayload.variants.length > 0
          ? (((boxPayload.variants[0] as { referenceContents?: unknown }).referenceContents ?? []) as Array<Record<string, unknown>>)
              .map((content) => ({
                productSku:
                  typeof content.productId === "string" ? content.productId.trim().toUpperCase() : "",
                quantity: Number(content.quantity) || 1,
              }))
              .filter((item) => item.productSku)
          : [],
      updatedAt: now,
      createdAt: now,
    });

    await Promise.all([
      db.collection(BOX_COLLECTION).doc(requestedId).set({ id: requestedId, ...boxPayload }, { merge: true }),
      db.collection(PRODUCT_COLLECTION).doc(requestedId).set({ id: requestedId, ...productPayload }, { merge: true }),
      db.collection(BOX_DEFINITIONS_COLLECTION).doc(requestedId).set(definitionPayload, { merge: true }),
      db.collection(BOX_RULES_COLLECTION).doc(String(boxPayload.ruleId ?? requestedId)).set(rulePayload, { merge: true }),
    ]);

    return NextResponse.json({ data: { id: requestedId, ...boxPayload } }, { status: 201 });
  } catch (error) {
    console.error("Admin Box Save Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message.startsWith("Datos de caja inválidos:")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
