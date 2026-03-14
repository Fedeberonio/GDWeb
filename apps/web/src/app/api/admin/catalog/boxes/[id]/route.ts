import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { parseAdminBoxPayload } from "@/modules/catalog/admin-schemas";
import { assertValidBoxReferenceProducts } from "@/modules/catalog/box-admin-validation";

const BOXES_COLLECTION = "catalog_products";
const CATALOG_BOXES_COLLECTION = "catalog_boxes";
const BOX_DEFINITIONS_COLLECTION = "box_definitions";
const BOX_RULES_COLLECTION = "catalog_box_rules";

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

function normalizeVariantKey(value?: string) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("mix")) return "mix";
  if (normalized.includes("frut") || normalized.includes("frui") || normalized.includes("fruit")) return "fruity";
  if (normalized.includes("veggie") || normalized.includes("veg")) return "veggie";
  return null;
}

function mapReferenceContents(referenceContents: Array<{ productId?: string; quantity?: number }>) {
  return referenceContents
    .filter((content) => content.productId)
    .map((content) => ({
      productSku: String(content.productId).trim().toUpperCase(),
      quantity: Number(content.quantity) || 1,
    }));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = parseAdminBoxPayload(await request.json()) as Record<string, unknown>;

  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const boxId = decodeURIComponent(id);
    const productRef = db.collection(BOXES_COLLECTION).doc(boxId);
    const catalogBoxRef = db.collection(CATALOG_BOXES_COLLECTION).doc(boxId);
    const definitionRef = db.collection(BOX_DEFINITIONS_COLLECTION).doc(boxId);

    const rawPrice = body.price;
    const priceAmount =
      rawPrice && typeof rawPrice === "object"
        ? Number((rawPrice as { amount?: unknown }).amount ?? 0)
        : Number(rawPrice ?? 0);
    const priceCurrency =
      rawPrice && typeof rawPrice === "object"
        ? String((rawPrice as { currency?: unknown }).currency ?? "DOP")
        : "DOP";
    const durationDays = typeof body?.durationDays === "number" ? body.durationDays : Number(body?.durationDays || 0);
    const variants = Array.isArray(body?.variants) ? body.variants : [];

    await assertValidBoxReferenceProducts(db, variants as Array<Record<string, unknown>>);

    const productPayload = stripUndefined({
      name: body?.name,
      description: body?.description,
      price: Number.isFinite(priceAmount) ? priceAmount : 0,
      image: body?.heroImage ?? body?.image ?? undefined,
      isFeatured: body?.isFeatured ?? false,
      ruleId: body?.ruleId ?? undefined,
      dimensionsLabel: body?.dimensionsLabel ?? undefined,
      weightLabel: body?.weightLabel ?? undefined,
      updatedAt: new Date().toISOString(),
    }) as Record<string, unknown>;

    if (durationDays > 0) {
      productPayload.attributes = { duration: `${durationDays} dias` };
    }

    const definitionPayload = stripUndefined({
      variants: variants.map((variant: any) => ({
        name: variant?.name?.es ?? variant?.name?.en ?? variant?.slug ?? variant?.id ?? "MIX",
        items: Array.isArray(variant?.referenceContents)
          ? variant.referenceContents
            .map((content: any) => ({
              product: content?.productId ?? content?.name?.es ?? content?.name?.en ?? "",
              quantity: Number(content?.quantity) || 1,
            }))
            .filter((item: { product: string }) => item.product)
          : [],
      })),
      updatedAt: new Date().toISOString(),
    }) as Record<string, unknown>;

    const ruleId = typeof body?.ruleId === "string" ? body.ruleId : boxId;
    const catalogBoxPayload = stripUndefined({
      name: body?.name,
      description: body?.description,
      price: {
        amount: priceAmount,
        currency: priceCurrency,
      },
      durationDays: durationDays || undefined,
      dimensionsLabel: body?.dimensionsLabel ?? undefined,
      weightLabel: body?.weightLabel ?? undefined,
      heroImage: body?.heroImage ?? body?.image ?? undefined,
      isFeatured: body?.isFeatured ?? false,
      status: body?.status ?? "active",
      ruleId: ruleId ?? undefined,
      variants: variants.map((variant: any) => ({
        id: variant?.id,
        slug: variant?.slug,
        name: variant?.name,
        description: variant?.description,
        referenceContents: Array.isArray(variant?.referenceContents)
          ? variant.referenceContents.map((content: any) => ({
              productId: content?.productId ?? "",
              name: content?.name,
              quantity: Number(content?.quantity) || 1,
            }))
          : [],
      })),
      updatedAt: new Date().toISOString(),
    }) as Record<string, unknown>;
    if (ruleId) {
      const mixVariant =
        variants.find((variant: any) => normalizeVariantKey(variant?.slug) === "mix") ??
        variants.find((variant: any) => normalizeVariantKey(variant?.id) === "mix") ??
        variants[0];
      const baseContents = mixVariant?.referenceContents
        ? mapReferenceContents(mixVariant.referenceContents)
        : [];
      const variantContents = variants.reduce((acc: Record<string, Array<{ productSku: string; quantity: number }>>, variant: any) => {
        const key = normalizeVariantKey(variant?.slug) ?? normalizeVariantKey(variant?.id);
        if (!key) return acc;
        acc[key] = mapReferenceContents(Array.isArray(variant?.referenceContents) ? variant.referenceContents : []);
        return acc;
      }, {});
      if (baseContents.length > 0) {
        variantContents.mix = baseContents;
      }
      const rulePayload = stripUndefined({
        baseContents,
        variantContents: Object.keys(variantContents).length ? variantContents : undefined,
        updatedAt: new Date().toISOString(),
      }) as Record<string, unknown>;
      const ruleRef = db.collection(BOX_RULES_COLLECTION).doc(ruleId);

      await Promise.all([
        productRef.set(productPayload, { merge: true }),
        catalogBoxRef.set(catalogBoxPayload, { merge: true }),
        definitionRef.set(definitionPayload, { merge: true }),
        ruleRef.set(rulePayload, { merge: true }),
      ]);
    } else {
      await Promise.all([
        productRef.set(productPayload, { merge: true }),
        catalogBoxRef.set(catalogBoxPayload, { merge: true }),
        definitionRef.set(definitionPayload, { merge: true }),
      ]);
    }

    return NextResponse.json({ data: { id: boxId, ...body } }, { status: 200 });
  } catch (error) {
    console.error("Admin Box Update Error:", error);
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const boxId = decodeURIComponent(id);
    const docSnap = await db.collection(CATALOG_BOXES_COLLECTION).doc(boxId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { id: docSnap.id, ...(docSnap.data() ?? {}) } }, { status: 200 });
  } catch (error) {
    console.error("Admin Box Fetch Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
