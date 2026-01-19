// @ts-nocheck
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { readFile, utils } from "xlsx";

import { getDb } from "../lib/firestore";
import { catalogCollections } from "../modules/catalog/repository";
import { comboSchema } from "../modules/catalog/schemas";
import type { Combo } from "../modules/catalog/schemas";

dotenv.config();

type RawRow = {
  "#"?: number | string;
  "Nombre Combo"?: string;
  "Ensalada"?: string;
  "Jugo"?: string;
  "Postre"?: string;
  "Costo Total"?: number;
  "Precio Venta"?: number;
  "Ganancia"?: number;
  "Margen %"?: number;
  "Calorías"?: number;
  "Proteínas (g)"?: number;
  "Apto Celíacos"?: string;
  "Beneficio Principal"?: string;
};

function toBoolean(value: unknown): boolean {
  const YES_VALUES = new Set(["si", "sí", "yes", "true", "1", "s"]);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return YES_VALUES.has(value.trim().toLowerCase());
  }
  return false;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function parseIngredients(ingredientsEs?: string, ingredientsEn?: string): Array<{ es: string; en: string }> {
  if (!ingredientsEs && !ingredientsEn) return [];

  const esList = ingredientsEs
    ? ingredientsEs
        .split(/[,\n;]/)
        .map((ing) => ing.trim())
        .filter(Boolean)
    : [];
  const enList = ingredientsEn
    ? ingredientsEn
        .split(/[,\n;]/)
        .map((ing) => ing.trim())
        .filter(Boolean)
    : [];

  const maxLength = Math.max(esList.length, enList.length);
  const result: Array<{ es: string; en: string }> = [];

  for (let i = 0; i < maxLength; i++) {
    result.push({
      es: esList[i] || enList[i] || "",
      en: enList[i] || esList[i] || "",
    });
  }

  return result.filter((ing) => ing.es || ing.en);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Datos hardcodeados de los combos (desde lunch-combos-section.tsx)
const COMBOS_DATA = [
  {
    id: 1,
    name: { es: "DETOX VERDE", en: "GREEN DETOX" },
    salad: { es: "Verde Detox con Arroz Integral y Berenjenas", en: "Green Detox with Brown Rice & Eggplant" },
    juice: { es: "Pepinada", en: "Cucumber Lemonade" },
    dessert: { es: "Melón en cubos", en: "Diced Melon" },
    price: 500,
    cost: 187,
    margin: 63,
    calories: 420,
    protein: 12,
    glutenFree: false,
    benefit: { es: "Depuración y alcalinización", en: "Detox & Alkalinization" },
    benefitDetail: { es: "Depuración y alcalinización del organismo", en: "Body detoxification and alkalinization" },
    recommendedFor: { es: "Personas con retención de líquidos, hinchazón, digestión lenta", en: "Fluid retention, bloating, slow digestion" },
    carbs: 62,
    fats: 14,
    fiber: 11,
    sugars: 18,
    vitaminA: "Alto",
    vitaminC: "Alto",
    image: "/images/combos/01_VERDE_DETOX_ARROZ_BERENJENAS.png",
    ingredients: [
      { es: "Lechuga repollada (50g)", en: "Iceberg lettuce (50g)" },
      { es: "Arroz integral cocido (80g)", en: "Cooked brown rice (80g)" },
      { es: "Berenjenas asadas (60g)", en: "Roasted eggplant (60g)" },
      { es: "Apio fresco (30g)", en: "Fresh celery (30g)" },
      { es: "Aguacate (0.25 unidad)", en: "Avocado (0.25 unit)" },
      { es: "Pepino (40g)", en: "Cucumber (40g)" },
      { es: "Zanahoria rallada (30g)", en: "Grated carrot (30g)" },
      { es: "Semillas ajonjolí (5g)", en: "Sesame seeds (5g)" },
      { es: "Cebolla morada (15g)", en: "Red onion (15g)" },
      { es: "Perejil y cilantro (10g)", en: "Parsley and cilantro (10g)" },
      { es: "Limón (jugo) (0.5 unidad)", en: "Lemon (juice) (0.5 unit)" },
      { es: "Aceite oliva (20ml)", en: "Olive oil (20ml)" },
      { es: "Jengibre (5g)", en: "Ginger (5g)" },
    ],
  },
  {
    id: 2,
    name: { es: "MEDITERRÁNEO FRESH", en: "MEDITERRANEAN FRESH" },
    salad: { es: "Griega con Trigo Burgol y Maíz", en: "Greek Salad with Bulgur & Corn" },
    juice: { es: "Rosa Maravillosa", en: "Wonderful Rose" },
    dessert: { es: "Naranja en gajos", en: "Orange Segments" },
    price: 600,
    cost: 313,
    margin: 48,
    calories: 485,
    protein: 18,
    glutenFree: false,
    benefit: { es: "Antioxidante y cardioprotector", en: "Antioxidant & Heart Health" },
    benefitDetail: { es: "Salud cardiovascular y antioxidante", en: "Cardiovascular health and antioxidant boost" },
    recommendedFor: { es: "Prevención cardiovascular, control colesterol, antiaging", en: "Heart health, cholesterol control, anti-aging" },
    carbs: 58,
    fats: 18,
    fiber: 9,
    sugars: 22,
    vitaminA: "Alto",
    vitaminC: "Muy Alto",
    image: "/images/combos/02_GRIEGA_BULGUR_MAIZ_v1.png",
    ingredients: [
      { es: "Queso feta (60g)", en: "Feta cheese (60g)" },
      { es: "Tomates bugalú (80g)", en: "Bugalu tomatoes (80g)" },
      { es: "Pepino (50g)", en: "Cucumber (50g)" },
      { es: "Cebolla morada (20g)", en: "Red onion (20g)" },
      { es: "Aceitunas mixtas (30g)", en: "Mixed olives (30g)" },
      { es: "Pimiento verde (40g)", en: "Green pepper (40g)" },
      { es: "Trigo burgol cocido (80g)", en: "Cooked bulgur wheat (80g)" },
      { es: "Maíz dulce (40g)", en: "Sweet corn (40g)" },
      { es: "Semillas chía (5g)", en: "Chia seeds (5g)" },
      { es: "Orégano fresco (5g)", en: "Fresh oregano (5g)" },
      { es: "Aceite oliva (20ml)", en: "Olive oil (20ml)" },
      { es: "Limón (0.5 unidad)", en: "Lemon (0.5 unit)" },
      { es: "Vinagre balsámico (5ml)", en: "Balsamic vinegar (5ml)" },
      { es: "Miel (5ml)", en: "Honey (5ml)" },
    ],
  },
  {
    id: 3,
    name: { es: "PODER TROPICAL", en: "TROPICAL POWER" },
    salad: { es: "Tropical con Quinoa y Pitahaya", en: "Tropical Salad with Quinoa & Dragon Fruit" },
    juice: { es: "Tropicalote", en: "Tropical Punch" },
    dessert: { es: "Mango en cubos", en: "Diced Mango" },
    price: 600,
    cost: 281,
    margin: 53,
    calories: 520,
    protein: 16,
    glutenFree: true,
    benefit: { es: "Energizante y sistema inmune", en: "Energizing & Immune System" },
    benefitDetail: { es: "Fortalecimiento sistema inmune y energía", en: "Immune system boost and sustained energy" },
    recommendedFor: { es: "Deportistas, personas con defensas bajas, necesidad de energía sostenida", en: "Athletes, low immunity, high energy needs" },
    carbs: 72,
    fats: 16,
    fiber: 13,
    sugars: 28,
    vitaminA: "Muy Alto",
    vitaminC: "Muy Alto",
    image: "/images/combos/03_TROPICAL_QUINOA_PITAHAYA.png",
    ingredients: [
      { es: "Quinoa cocida (80g)", en: "Cooked quinoa (80g)" },
      { es: "Mango (80g)", en: "Mango (80g)" },
      { es: "Pitahaya (60g)", en: "Dragon fruit (60g)" },
      { es: "Garbanzos cocidos (60g)", en: "Cooked chickpeas (60g)" },
      { es: "Aguacate (0.25 unidad)", en: "Avocado (0.25 unit)" },
      { es: "Repollo colorado (40g)", en: "Red cabbage (40g)" },
      { es: "Zanahoria rallada (30g)", en: "Grated carrot (30g)" },
      { es: "Semillas chía (5g)", en: "Chia seeds (5g)" },
      { es: "Cebolla morada (15g)", en: "Red onion (15g)" },
      { es: "Cilantro (10g)", en: "Cilantro (10g)" },
      { es: "Limón (0.5 unidad)", en: "Lemon (0.5 unit)" },
      { es: "Miel (5ml)", en: "Honey (5ml)" },
      { es: "Aceite oliva (15ml)", en: "Olive oil (15ml)" },
    ],
  },
  {
    id: 4,
    name: { es: "IMPULSO ENERGÉTICO", en: "ENERGY BOOST" },
    salad: { es: "Verde Detox Simplificada", en: "Simplified Green Detox" },
    juice: { es: "Zanahoria Manzana Limón", en: "Carrot Apple Lemon" },
    dessert: { es: "Piña en cubos", en: "Diced Pineapple" },
    price: 500,
    cost: 161,
    margin: 68,
    calories: 380,
    protein: 9,
    glutenFree: true,
    benefit: { es: "Energía y digestión", en: "Energy & Digestion" },
    benefitDetail: { es: "Mejora de visión y energía sostenida", en: "Vision improvement and sustained energy" },
    recommendedFor: { es: "Problemas de visión, cansancio, necesidad de concentración", en: "Vision issues, fatigue, focus needs" },
    carbs: 68,
    fats: 9,
    fiber: 9,
    sugars: 24,
    vitaminA: "Muy Alto",
    vitaminC: "Alto",
    image: "/images/combos/04_VERDE_DETOX_SIMPLIFICADA_v2.png",
    ingredients: [
      { es: "Lechuga repollada (60g)", en: "Iceberg lettuce (60g)" },
      { es: "Arroz integral (80g)", en: "Brown rice (80g)" },
      { es: "Apio (30g)", en: "Celery (30g)" },
      { es: "Pepino (50g)", en: "Cucumber (50g)" },
      { es: "Zanahoria rallada (40g)", en: "Grated carrot (40g)" },
      { es: "Cebolla morada (15g)", en: "Red onion (15g)" },
      { es: "Cilantro (10g)", en: "Cilantro (10g)" },
      { es: "Limón (0.5 unidad)", en: "Lemon (0.5 unit)" },
      { es: "Aceite oliva (20ml)", en: "Olive oil (20ml)" },
    ],
  },
  {
    id: 5,
    name: { es: "GRIEGA DOLIO", en: "GREEK DOLIO" },
    salad: { es: "Griega Simplificada", en: "Simplified Greek" },
    juice: { es: "Sandía y Manzana", en: "Watermelon & Apple" },
    dessert: { es: "Banana", en: "Banana" },
    price: 500,
    cost: 156,
    margin: 69,
    calories: 340,
    protein: 8,
    glutenFree: true,
    benefit: { es: "Hidratación y recuperación muscular", en: "Hydration & Muscle Recovery" },
    benefitDetail: { es: "Hidratación profunda y recuperación muscular", en: "Deep hydration and muscle recovery" },
    recommendedFor: { es: "Post-ejercicio, calor intenso, calambres, deshidratación", en: "Post-workout, intense heat, cramps, dehydration" },
    carbs: 58,
    fats: 8,
    fiber: 7,
    sugars: 26,
    vitaminA: "Alto",
    vitaminC: "Alto",
    image: "/images/combos/05_GRIEGA_SIMPLIFICADA.png",
    ingredients: [
      { es: "Tomates bugalú (100g)", en: "Bugalu tomatoes (100g)" },
      { es: "Pepino (60g)", en: "Cucumber (60g)" },
      { es: "Cebolla morada (20g)", en: "Red onion (20g)" },
      { es: "Pimiento verde (50g)", en: "Green pepper (50g)" },
      { es: "Lechuga repollada (40g)", en: "Iceberg lettuce (40g)" },
      { es: "Maíz dulce (40g)", en: "Sweet corn (40g)" },
      { es: "Orégano (5g)", en: "Oregano (5g)" },
      { es: "Aceite oliva (20ml)", en: "Olive oil (20ml)" },
      { es: "Limón (0.5 unidad)", en: "Lemon (0.5 unit)" },
    ],
  },
  {
    id: 6,
    name: { es: "JARDÍN ASADO", en: "ROASTED GARDEN" },
    salad: { es: "Endivia con Tomate Asado y Mozzarella", en: "Endive with Roasted Tomato & Mozzarella" },
    juice: { es: "Melón y Pepino", en: "Melon & Cucumber" },
    dessert: { es: "Naranja en gajos", en: "Orange Segments" },
    price: 500,
    cost: 189,
    margin: 62,
    calories: 410,
    protein: 15,
    glutenFree: true,
    benefit: { es: "Salud cardiovascular y piel", en: "Heart & Skin Health" },
    benefitDetail: { es: "Salud cardiovascular y piel radiante", en: "Cardiovascular health and radiant skin" },
    recommendedFor: { es: "Salud de la piel, prevención cardiovascular, antiaging", en: "Skin health, heart protection, anti-aging" },
    carbs: 48,
    fats: 16,
    fiber: 8,
    sugars: 20,
    vitaminA: "Alto",
    vitaminC: "Muy Alto",
    image: "/images/combos/Ensalada_Jardin_asado.png",
    ingredients: [
      { es: "Lechuga endivia (40g)", en: "Endive lettuce (40g)" },
      { es: "Lechuga repollada (40g)", en: "Iceberg lettuce (40g)" },
      { es: "Tomate asado (100g)", en: "Roasted tomato (100g)" },
      { es: "Mozzarella fresca (50g)", en: "Fresh mozzarella (50g)" },
      { es: "Cebolla caramelizada (30g)", en: "Caramelized onion (30g)" },
      { es: "Pepino (40g)", en: "Cucumber (40g)" },
      { es: "Maíz dulce (30g)", en: "Sweet corn (30g)" },
      { es: "Aceitunas negras (20g)", en: "Black olives (20g)" },
      { es: "Albahaca fresca (5g)", en: "Fresh basil (5g)" },
      { es: "Aceite oliva (20ml)", en: "Olive oil (20ml)" },
      { es: "Vinagre balsámico (5ml)", en: "Balsamic vinegar (5ml)" },
      { es: "Ajo (2g)", en: "Garlic (2g)" },
      { es: "Orégano (2g)", en: "Oregano (2g)" },
    ],
  },
  {
    id: 7,
    name: { es: "LA AUYAMA QUE LLAMA", en: "ROASTED PUMPKIN" },
    salad: { es: "Lechuga Rizada con Auyama Salteada", en: "Curly Lettuce with Sautéed Pumpkin" },
    juice: { es: "China Chinola", en: "Orange Passion Fruit" },
    dessert: { es: "Mango en cubos", en: "Diced Mango" },
    price: 500,
    cost: 185,
    margin: 63,
    calories: 395,
    protein: 11,
    glutenFree: true,
    benefit: { es: "Visión y salud de la piel", en: "Vision & Skin Health" },
    benefitDetail: { es: "Salud ocular y piel (beta-caroteno)", en: "Eye health and skin (beta-carotene)" },
    recommendedFor: { es: "Problemas de visión, piel seca, necesidad de vitamina A", en: "Vision issues, dry skin, Vitamin A deficiency" },
    carbs: 58,
    fats: 12,
    fiber: 10,
    sugars: 22,
    vitaminA: "Muy Alto",
    vitaminC: "Alto",
    image: "/images/combos/Ensaladaa_Auyama_que_llama.png",
    ingredients: [
      { es: "Lechuga rizada (60g)", en: "Curly lettuce (60g)" },
      { es: "Auyama salteada (100g)", en: "Sautéed pumpkin (100g)" },
      { es: "Ajo (5g)", en: "Garlic (5g)" },
      { es: "Garbanzos tostados (40g)", en: "Toasted chickpeas (40g)" },
      { es: "Ajonjolí tostado (10g)", en: "Toasted sesame (10g)" },
      { es: "Tomate bugalú (80g)", en: "Bugalu tomato (80g)" },
      { es: "Cebolla morada (30g)", en: "Red onion (30g)" },
      { es: "Zanahoria rallada (30g)", en: "Grated carrot (30g)" },
      { es: "Cilantro y perejil (15g)", en: "Cilantro and parsley (15g)" },
      { es: "Aceite oliva (20ml)", en: "Olive oil (20ml)" },
      { es: "Miel (5ml)", en: "Honey (5ml)" },
      { es: "Limón (0.5 unidad)", en: "Lemon (0.5 unit)" },
      { es: "Sal (2g)", en: "Salt (2g)" },
    ],
  },
];

async function importCombos() {
  console.log(`📖 Importando ${COMBOS_DATA.length} combos desde datos hardcodeados`);

  const db = getDb();
  const combosCollection = db.collection(catalogCollections.combos);

  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const comboData of COMBOS_DATA) {
    try {
      const id = `combo-${comboData.id}`;
      const combo: Combo = {
        id,
        name: comboData.name,
        salad: comboData.salad,
        juice: comboData.juice,
        dessert: comboData.dessert,
        price: comboData.price,
        cost: comboData.cost,
        margin: comboData.margin,
        calories: comboData.calories,
        protein: comboData.protein,
        glutenFree: comboData.glutenFree,
        benefit: comboData.benefit,
        benefitDetail: comboData.benefitDetail,
        recommendedFor: comboData.recommendedFor,
        carbs: comboData.carbs,
        fats: comboData.fats,
        fiber: comboData.fiber,
        sugars: comboData.sugars,
        vitaminA: comboData.vitaminA,
        vitaminC: comboData.vitaminC,
        image: comboData.image,
        ingredients: comboData.ingredients,
        status: "active",
        isFeatured: false,
      };

      // Guardar directamente (Firestore validará la estructura)
      // Verificar si ya existe
      const existingDoc = await combosCollection.doc(id).get();
      if (existingDoc.exists) {
        await combosCollection.doc(id).set(combo, { merge: true });
        console.log(`✅ Actualizado: ${comboData.name.es} (ID: ${id})`);
        updated++;
      } else {
        await combosCollection.doc(id).set(combo);
        console.log(`✨ Importado: ${comboData.name.es} (ID: ${id})`);
        imported++;
      }
    } catch (error) {
      console.error(`❌ Error procesando combo:`, error);
      console.error(`   Combo:`, JSON.stringify(comboData, null, 2));
      errors++;
    }
  }

  console.log(`\n📈 Resumen:`);
  console.log(`   ✨ Importados: ${imported}`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`\n🎉 ¡Importación completada!`);
}

importCombos()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
