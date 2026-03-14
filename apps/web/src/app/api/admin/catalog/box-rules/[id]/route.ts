import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { parseAdminBoxRulePayload } from "@/modules/catalog/admin-schemas";

const BOX_RULES_COLLECTION = "catalog_box_rules";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = parseAdminBoxRulePayload(await request.json());

  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const ruleId = decodeURIComponent(id);
    const docRef = db.collection(BOX_RULES_COLLECTION).doc(ruleId);

    await docRef.set(
      {
        ...body,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({ data: { id: ruleId, ...body } }, { status: 200 });
  } catch (error) {
    console.error("Admin Box Rule Update Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message.startsWith("Datos de reglas inválidos:")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
