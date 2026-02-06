import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const COMBOS_COLLECTION = "lunch_combos";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const body = await request.json();
    const { id } = await params;
    const comboId = decodeURIComponent(id);

    const payload = {
      name: body?.name,
      price: Number(body?.price) || 0,
      nutrition: {
        calories: Number(body?.calories) || 0,
        protein: Number(body?.protein) || 0,
        isGlutenFree: Boolean(body?.glutenFree),
      },
      benefits: body?.benefit,
      image: body?.image ?? "",
      isFeatured: body?.isFeatured ?? false,
      status: body?.status ?? "active",
      updatedAt: new Date().toISOString(),
    };

    const docRef = db.collection(COMBOS_COLLECTION).doc(comboId);
    await docRef.set(payload, { merge: true });

    const responseData = {
      id: comboId,
      name: payload.name ?? { es: "", en: "" },
      salad: body?.salad ?? { es: "", en: "" },
      juice: body?.juice ?? { es: "", en: "" },
      dessert: body?.dessert ?? { es: "", en: "" },
      price: payload.price,
      cost: body?.cost ? Number(body.cost) : undefined,
      margin: body?.margin ? Number(body.margin) : undefined,
      calories: payload.nutrition.calories,
      protein: payload.nutrition.protein,
      glutenFree: payload.nutrition.isGlutenFree,
      benefit: payload.benefits ?? { es: "", en: "" },
      benefitDetail: body?.benefitDetail ?? { es: "", en: "" },
      recommendedFor: body?.recommendedFor ?? { es: "", en: "" },
      carbs: body?.carbs ? Number(body.carbs) : 0,
      fats: body?.fats ? Number(body.fats) : 0,
      fiber: body?.fiber ? Number(body.fiber) : 0,
      sugars: body?.sugars ? Number(body.sugars) : 0,
      vitaminA: body?.vitaminA ?? "",
      vitaminC: body?.vitaminC ?? "",
      image: payload.image,
      ingredients: Array.isArray(body?.ingredients) ? body.ingredients : [],
      status: payload.status,
      isFeatured: payload.isFeatured,
    };

    return NextResponse.json({ data: responseData }, { status: 200 });
  } catch (error) {
    console.error("Error updating combo:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
