import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const COMBOS_COLLECTION = "lunch_combos";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const snapshot = await db.collection(COMBOS_COLLECTION).get();
    const data = snapshot.docs.map((doc) => {
      const combo = doc.data() as Record<string, any>;
      const name = combo.name ?? {};
      const benefits = combo.benefits ?? {};
      const nutrition = combo.nutrition ?? {};
      return {
        id: doc.id,
        name: {
          es: name.es ?? name.en ?? "",
          en: name.en ?? name.es ?? "",
        },
        salad: { es: "", en: "" },
        juice: { es: "", en: "" },
        dessert: { es: "", en: "" },
        price: Number(combo.price) || 0,
        cost: combo.cost ? Number(combo.cost) : undefined,
        margin: combo.margin ? Number(combo.margin) : undefined,
        calories: Number(nutrition.calories) || 0,
        protein: Number(nutrition.protein) || 0,
        glutenFree: Boolean(nutrition.isGlutenFree),
        benefit: {
          es: benefits.es ?? benefits.en ?? "",
          en: benefits.en ?? benefits.es ?? "",
        },
        benefitDetail: { es: "", en: "" },
        recommendedFor: { es: "", en: "" },
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugars: 0,
        vitaminA: "",
        vitaminC: "",
        image: combo.image ?? "",
        ingredients: [],
        status: combo.status ?? "active",
        isFeatured: combo.isFeatured ?? false,
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching combos:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    const body = await request.json();
    const payload = {
      name: body?.name ?? { es: "Nuevo combo", en: "New combo" },
      price: Number(body?.price) || 0,
      nutrition: {
        calories: Number(body?.calories) || 0,
        protein: Number(body?.protein) || 0,
        isGlutenFree: Boolean(body?.glutenFree),
      },
      benefits: body?.benefit ?? { es: "", en: "" },
      image: body?.image ?? "",
      isFeatured: body?.isFeatured ?? false,
      status: body?.status ?? "inactive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = db.collection(COMBOS_COLLECTION).doc();
    await docRef.set(payload);
    await docRef.set({ id: docRef.id }, { merge: true });

    const responseData = {
      id: docRef.id,
      name: payload.name,
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

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error("Error creating combo:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
