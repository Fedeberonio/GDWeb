import { NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

type IngredientDefinition = {
  sku: string;
  name: { es: string; en: string };
  unit: string;
  category: string;
  price: number;
};

type SaladRecipe = {
  name: { es: string; en: string };
  ingredients: Array<{ sku: string; quantity: number; unit: string }>;
};

const INGREDIENTS: IngredientDefinition[] = [
  { sku: "GD-INGR-001", name: { es: "Lechuga repollada", en: "Iceberg lettuce" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-002", name: { es: "Arroz integral cocido", en: "Cooked brown rice" }, unit: "g", category: "granos", price: 1.0 },
  { sku: "GD-INGR-003", name: { es: "Berenjenas asadas", en: "Roasted eggplant" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-004", name: { es: "Apio fresco", en: "Fresh celery" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-005", name: { es: "Aguacate", en: "Avocado" }, unit: "unidad", category: "frutas", price: 1.0 },
  { sku: "GD-INGR-006", name: { es: "Pepino", en: "Cucumber" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-007", name: { es: "Zanahoria rallada", en: "Grated carrot" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-008", name: { es: "Semillas ajonjolí", en: "Sesame seeds" }, unit: "g", category: "semillas", price: 1.0 },
  { sku: "GD-INGR-009", name: { es: "Cebolla morada", en: "Red onion" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-010", name: { es: "Perejil y cilantro", en: "Parsley and cilantro" }, unit: "g", category: "hierbas", price: 1.0 },
  { sku: "GD-INGR-011", name: { es: "Limón (jugo)", en: "Lemon (juice)" }, unit: "unidad", category: "frutas", price: 1.0 },
  { sku: "GD-INGR-012", name: { es: "Aceite oliva", en: "Olive oil" }, unit: "ml", category: "aceites", price: 1.0 },
  { sku: "GD-INGR-013", name: { es: "Jengibre", en: "Ginger" }, unit: "g", category: "condimentos", price: 1.0 },
  { sku: "GD-INGR-014", name: { es: "Queso feta", en: "Feta cheese" }, unit: "g", category: "lácteos", price: 1.0 },
  { sku: "GD-INGR-015", name: { es: "Tomates bugalú", en: "Bugalu tomatoes" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-016", name: { es: "Aceitunas mixtas", en: "Mixed olives" }, unit: "g", category: "grasas", price: 1.0 },
  { sku: "GD-INGR-017", name: { es: "Pimiento verde", en: "Green pepper" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-018", name: { es: "Trigo burgol cocido", en: "Cooked bulgur wheat" }, unit: "g", category: "granos", price: 1.0 },
  { sku: "GD-INGR-019", name: { es: "Maíz dulce", en: "Sweet corn" }, unit: "g", category: "granos", price: 1.0 },
  { sku: "GD-INGR-020", name: { es: "Semillas chía", en: "Chia seeds" }, unit: "g", category: "semillas", price: 1.0 },
  { sku: "GD-INGR-021", name: { es: "Orégano fresco", en: "Fresh oregano" }, unit: "g", category: "hierbas", price: 1.0 },
  { sku: "GD-INGR-022", name: { es: "Limón", en: "Lemon" }, unit: "unidad", category: "frutas", price: 1.0 },
  { sku: "GD-INGR-023", name: { es: "Vinagre balsámico", en: "Balsamic vinegar" }, unit: "ml", category: "condimentos", price: 1.0 },
  { sku: "GD-INGR-024", name: { es: "Miel", en: "Honey" }, unit: "ml", category: "endulzantes", price: 1.0 },
  { sku: "GD-INGR-025", name: { es: "Quinoa cocida", en: "Cooked quinoa" }, unit: "g", category: "granos", price: 1.0 },
  { sku: "GD-INGR-026", name: { es: "Mango", en: "Mango" }, unit: "g", category: "frutas", price: 1.0 },
  { sku: "GD-INGR-027", name: { es: "Pitahaya", en: "Dragon fruit" }, unit: "g", category: "frutas", price: 1.0 },
  { sku: "GD-INGR-028", name: { es: "Garbanzos cocidos", en: "Cooked chickpeas" }, unit: "g", category: "legumbres", price: 1.0 },
  { sku: "GD-INGR-029", name: { es: "Repollo colorado", en: "Red cabbage" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-030", name: { es: "Cilantro", en: "Cilantro" }, unit: "g", category: "hierbas", price: 1.0 },
  { sku: "GD-INGR-031", name: { es: "Arroz integral", en: "Brown rice" }, unit: "g", category: "granos", price: 1.0 },
  { sku: "GD-INGR-032", name: { es: "Apio", en: "Celery" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-033", name: { es: "Lechuga endivia", en: "Endive lettuce" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-034", name: { es: "Tomate asado", en: "Roasted tomato" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-035", name: { es: "Mozzarella fresca", en: "Fresh mozzarella" }, unit: "g", category: "lácteos", price: 1.0 },
  { sku: "GD-INGR-036", name: { es: "Cebolla caramelizada", en: "Caramelized onion" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-037", name: { es: "Aceitunas negras", en: "Black olives" }, unit: "g", category: "grasas", price: 1.0 },
  { sku: "GD-INGR-038", name: { es: "Albahaca fresca", en: "Fresh basil" }, unit: "g", category: "hierbas", price: 1.0 },
  { sku: "GD-INGR-039", name: { es: "Ajo", en: "Garlic" }, unit: "g", category: "condimentos", price: 1.0 },
  { sku: "GD-INGR-040", name: { es: "Orégano", en: "Oregano" }, unit: "g", category: "hierbas", price: 1.0 },
  { sku: "GD-INGR-041", name: { es: "Lechuga rizada", en: "Curly lettuce" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-042", name: { es: "Auyama salteada", en: "Sautéed pumpkin" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-043", name: { es: "Garbanzos tostados", en: "Toasted chickpeas" }, unit: "g", category: "legumbres", price: 1.0 },
  { sku: "GD-INGR-044", name: { es: "Ajonjolí tostado", en: "Toasted sesame" }, unit: "g", category: "semillas", price: 1.0 },
  { sku: "GD-INGR-045", name: { es: "Tomate bugalú", en: "Bugalu tomato" }, unit: "g", category: "verduras", price: 1.0 },
  { sku: "GD-INGR-046", name: { es: "Cilantro y perejil", en: "Cilantro and parsley" }, unit: "g", category: "hierbas", price: 1.0 },
  { sku: "GD-INGR-047", name: { es: "Sal", en: "Salt" }, unit: "g", category: "condimentos", price: 1.0 },
];

const SALAD_RECIPES: Record<string, SaladRecipe> = {
  "GD-SALA-001": {
    name: { es: "DETOX VERDE", en: "Green Detox" },
    ingredients: [
      { sku: "GD-INGR-001", quantity: 50, unit: "g" },
      { sku: "GD-INGR-002", quantity: 80, unit: "g" },
      { sku: "GD-INGR-003", quantity: 60, unit: "g" },
      { sku: "GD-INGR-004", quantity: 30, unit: "g" },
      { sku: "GD-INGR-005", quantity: 0.25, unit: "unidad" },
      { sku: "GD-INGR-006", quantity: 40, unit: "g" },
      { sku: "GD-INGR-007", quantity: 30, unit: "g" },
      { sku: "GD-INGR-008", quantity: 5, unit: "g" },
      { sku: "GD-INGR-009", quantity: 15, unit: "g" },
      { sku: "GD-INGR-010", quantity: 10, unit: "g" },
      { sku: "GD-INGR-011", quantity: 0.5, unit: "unidad" },
      { sku: "GD-INGR-012", quantity: 20, unit: "ml" },
      { sku: "GD-INGR-013", quantity: 5, unit: "g" },
    ],
  },
  "GD-SALA-002": {
    name: { es: "MEDITERRANEO FRESH", en: "Mediterranean Fresh" },
    ingredients: [
      { sku: "GD-INGR-014", quantity: 60, unit: "g" },
      { sku: "GD-INGR-015", quantity: 80, unit: "g" },
      { sku: "GD-INGR-006", quantity: 50, unit: "g" },
      { sku: "GD-INGR-009", quantity: 20, unit: "g" },
      { sku: "GD-INGR-016", quantity: 30, unit: "g" },
      { sku: "GD-INGR-017", quantity: 40, unit: "g" },
      { sku: "GD-INGR-018", quantity: 80, unit: "g" },
      { sku: "GD-INGR-019", quantity: 40, unit: "g" },
      { sku: "GD-INGR-020", quantity: 5, unit: "g" },
      { sku: "GD-INGR-021", quantity: 5, unit: "g" },
      { sku: "GD-INGR-012", quantity: 20, unit: "ml" },
      { sku: "GD-INGR-022", quantity: 0.5, unit: "unidad" },
      { sku: "GD-INGR-023", quantity: 5, unit: "ml" },
      { sku: "GD-INGR-024", quantity: 5, unit: "ml" },
    ],
  },
  "GD-SALA-003": {
    name: { es: "PODER TROPICAL", en: "Tropical Power" },
    ingredients: [
      { sku: "GD-INGR-025", quantity: 80, unit: "g" },
      { sku: "GD-INGR-026", quantity: 80, unit: "g" },
      { sku: "GD-INGR-027", quantity: 60, unit: "g" },
      { sku: "GD-INGR-028", quantity: 60, unit: "g" },
      { sku: "GD-INGR-005", quantity: 0.25, unit: "unidad" },
      { sku: "GD-INGR-029", quantity: 40, unit: "g" },
      { sku: "GD-INGR-007", quantity: 30, unit: "g" },
      { sku: "GD-INGR-020", quantity: 5, unit: "g" },
      { sku: "GD-INGR-009", quantity: 15, unit: "g" },
      { sku: "GD-INGR-030", quantity: 10, unit: "g" },
      { sku: "GD-INGR-022", quantity: 0.5, unit: "unidad" },
      { sku: "GD-INGR-024", quantity: 5, unit: "ml" },
      { sku: "GD-INGR-012", quantity: 15, unit: "ml" },
    ],
  },
  "GD-SALA-004": {
    name: { es: "IMPULSO ENERGETICO", en: "Energy Boost" },
    ingredients: [
      { sku: "GD-INGR-001", quantity: 60, unit: "g" },
      { sku: "GD-INGR-031", quantity: 80, unit: "g" },
      { sku: "GD-INGR-032", quantity: 30, unit: "g" },
      { sku: "GD-INGR-006", quantity: 50, unit: "g" },
      { sku: "GD-INGR-007", quantity: 40, unit: "g" },
      { sku: "GD-INGR-009", quantity: 15, unit: "g" },
      { sku: "GD-INGR-030", quantity: 10, unit: "g" },
      { sku: "GD-INGR-022", quantity: 0.5, unit: "unidad" },
      { sku: "GD-INGR-012", quantity: 20, unit: "ml" },
    ],
  },
  "GD-SALA-005": {
    name: { es: "GRIEGA DOLIO", en: "Greek Dolio" },
    ingredients: [
      { sku: "GD-INGR-015", quantity: 100, unit: "g" },
      { sku: "GD-INGR-006", quantity: 60, unit: "g" },
      { sku: "GD-INGR-009", quantity: 20, unit: "g" },
      { sku: "GD-INGR-017", quantity: 50, unit: "g" },
      { sku: "GD-INGR-001", quantity: 40, unit: "g" },
      { sku: "GD-INGR-019", quantity: 40, unit: "g" },
      { sku: "GD-INGR-040", quantity: 5, unit: "g" },
      { sku: "GD-INGR-012", quantity: 20, unit: "ml" },
      { sku: "GD-INGR-022", quantity: 0.5, unit: "unidad" },
    ],
  },
  "GD-SALA-006": {
    name: { es: "JARDIN ASADO", en: "Roasted Garden" },
    ingredients: [
      { sku: "GD-INGR-033", quantity: 40, unit: "g" },
      { sku: "GD-INGR-001", quantity: 40, unit: "g" },
      { sku: "GD-INGR-034", quantity: 100, unit: "g" },
      { sku: "GD-INGR-035", quantity: 50, unit: "g" },
      { sku: "GD-INGR-036", quantity: 30, unit: "g" },
      { sku: "GD-INGR-006", quantity: 40, unit: "g" },
      { sku: "GD-INGR-019", quantity: 30, unit: "g" },
      { sku: "GD-INGR-037", quantity: 20, unit: "g" },
      { sku: "GD-INGR-038", quantity: 5, unit: "g" },
      { sku: "GD-INGR-012", quantity: 20, unit: "ml" },
      { sku: "GD-INGR-023", quantity: 5, unit: "ml" },
      { sku: "GD-INGR-039", quantity: 2, unit: "g" },
      { sku: "GD-INGR-040", quantity: 2, unit: "g" },
    ],
  },
  "GD-SALA-007": {
    name: { es: "LA AUYAMA QUE LLAMA", en: "Roasted Pumpkin" },
    ingredients: [
      { sku: "GD-INGR-041", quantity: 60, unit: "g" },
      { sku: "GD-INGR-042", quantity: 100, unit: "g" },
      { sku: "GD-INGR-039", quantity: 5, unit: "g" },
      { sku: "GD-INGR-043", quantity: 40, unit: "g" },
      { sku: "GD-INGR-044", quantity: 10, unit: "g" },
      { sku: "GD-INGR-045", quantity: 80, unit: "g" },
      { sku: "GD-INGR-009", quantity: 30, unit: "g" },
      { sku: "GD-INGR-007", quantity: 30, unit: "g" },
      { sku: "GD-INGR-046", quantity: 15, unit: "g" },
      { sku: "GD-INGR-012", quantity: 20, unit: "ml" },
      { sku: "GD-INGR-024", quantity: 5, unit: "ml" },
      { sku: "GD-INGR-022", quantity: 0.5, unit: "unidad" },
      { sku: "GD-INGR-047", quantity: 2, unit: "g" },
    ],
  },
};

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const now = new Date().toISOString();

    const results = {
      categoryCreated: false,
      ingredientCategoryCreated: false,
      ingredientsCreated: 0,
      saladsConverted: 0,
      errors: [] as string[],
      debugInfo: null as null | {
        foundInFirestore: string[];
        lookingFor: string[];
        missingIds: string[];
      },
    };

    try {
      await db.collection("catalog_categories").doc("ensaladas").set({
        id: "ensaladas",
        slug: "ensaladas",
        name: { es: "Ensaladas", en: "Salads" },
        description: { es: "Ensaladas frescas y saludables", en: "Fresh and healthy salads" },
        displayOrder: 10,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      results.categoryCreated = true;
    } catch (error) {
      results.errors.push(`Category ensaladas: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await db.collection("catalog_categories").doc("ingredientes").set({
        id: "ingredientes",
        slug: "ingredientes",
        name: { es: "Ingredientes", en: "Ingredients" },
        description: { es: "Ingredientes base para recetas", en: "Base ingredients for recipes" },
        displayOrder: 11,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      results.ingredientCategoryCreated = true;
    } catch (error) {
      results.errors.push(`Category ingredientes: ${error instanceof Error ? error.message : String(error)}`);
    }

    const ingredientIdMap: Record<string, string> = {};

    for (const ingredient of INGREDIENTS) {
      try {
        const docRef = db.collection("catalog_products").doc(ingredient.sku);
        await docRef.set({
          id: ingredient.sku,
          sku: ingredient.sku,
          slug: ingredient.sku.toLowerCase(),
          name: ingredient.name,
          description: { es: "", en: "" },
          unit: ingredient.unit,
          isActive: true,
          categoryId: "ingredientes",
          price: ingredient.price,
          type: "simple",
          image: "",
          tags: ["ingrediente"],
          isFeatured: false,
          status: "active",
          createdAt: now,
          updatedAt: now,
        }, { merge: true });
        ingredientIdMap[ingredient.sku] = ingredient.sku;
        results.ingredientsCreated += 1;
      } catch (error) {
        results.errors.push(`Ingredient ${ingredient.sku}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // DEBUG: Check what salads exist
    const saladsSnapshot = await db.collection("salads").get();
    const existingSaladIds = saladsSnapshot.docs.map((doc) => doc.id);
    console.log("Found salads in Firestore:", existingSaladIds);
    console.log("Looking for salads:", Object.keys(SALAD_RECIPES));

    results.debugInfo = {
      foundInFirestore: existingSaladIds,
      lookingFor: Object.keys(SALAD_RECIPES),
      missingIds: Object.keys(SALAD_RECIPES).filter((id) => !existingSaladIds.includes(id)),
    };

    for (const [saladSku, saladRecipe] of Object.entries(SALAD_RECIPES)) {
      try {
        const saladDoc = await db.collection("salads").doc(saladSku).get();
        if (!saladDoc.exists) {
          results.errors.push(`Salad ${saladSku} not found`);
          continue;
        }
        const originalSalad = saladDoc.data() as Record<string, any>;

        const recipeIngredients = saladRecipe.ingredients.map((ing) => ({
          productId: ingredientIdMap[ing.sku],
          quantity: ing.quantity,
          unit: ing.unit,
          name: INGREDIENTS.find((i) => i.sku === ing.sku)?.name,
        }));

        await db.collection("catalog_products").doc(saladSku).set({
          id: saladSku,
          sku: saladSku,
          slug: saladSku.toLowerCase(),
          name: saladRecipe.name,
          description: originalSalad.description || { es: "", en: "" },
          isActive: true,
          categoryId: "ensaladas",
          price: originalSalad.price || 0,
          type: "prepared",
          recipe: {
            yields: 1,
            ingredients: recipeIngredients,
          },
          image: originalSalad.image || "",
          isFeatured: originalSalad.isFeatured || false,
          status: originalSalad.status || "active",
          nutrition: {
            calories: originalSalad.nutrition?.calories || 0,
            protein: originalSalad.nutrition?.protein || 0,
            carbs: originalSalad.carbs || 0,
            fats: originalSalad.fats || 0,
            fiber: originalSalad.fiber || 0,
            sugars: originalSalad.sugars || 0,
            glutenFree: originalSalad.nutrition?.isGlutenFree || false,
          },
          metadata: {
            ...(originalSalad.benefits && { benefit: originalSalad.benefits }),
            ...(originalSalad.benefitDetail && { benefitDetail: originalSalad.benefitDetail }),
            ...(originalSalad.recommendedFor && { recommendedFor: originalSalad.recommendedFor }),
            ...(originalSalad.cost !== undefined && { cost: originalSalad.cost }),
            ...(originalSalad.margin !== undefined && { margin: originalSalad.margin }),
            ...(originalSalad.vitaminA && { vitaminA: originalSalad.vitaminA }),
            ...(originalSalad.vitaminC && { vitaminC: originalSalad.vitaminC }),
          },
          createdAt: originalSalad.createdAt || now,
          updatedAt: now,
        });

        results.saladsConverted += 1;
      } catch (error) {
        results.errors.push(`Salad ${saladSku}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();

    // Check salads collection
    const saladsSnapshot = await db.collection("salads").get();
    const saladsInSaladsCollection = saladsSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));

    // Check catalog_products for salad SKUs
    const saladSkus = Object.keys(SALAD_RECIPES);
    const productsSnapshot = await db
      .collection("catalog_products")
      .where("sku", "in", saladSkus)
      .get();

    const saladsInProducts = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      sku: doc.data().sku,
      name: doc.data().name,
      type: doc.data().type,
      categoryId: doc.data().categoryId,
      hasRecipe: Boolean(doc.data().recipe),
    }));

    // Check ingredients too
    const ingredientsSnapshot = await db
      .collection("catalog_products")
      .where("categoryId", "==", "ingredientes")
      .get();

    return NextResponse.json({
      saladsCollection: {
        count: saladsInSaladsCollection.length,
        salads: saladsInSaladsCollection,
      },
      catalogProducts: {
        saladsCount: saladsInProducts.length,
        salads: saladsInProducts,
      },
      ingredients: {
        count: ingredientsSnapshot.size,
      },
      expectedIds: saladSkus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
