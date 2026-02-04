"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Apple, Check, Citrus, Info, Leaf, Package, Salad, ShoppingCart } from "lucide-react";
import { createPortal } from "react-dom";
import { useCart } from "@/modules/cart/context";
import toast from "react-hot-toast";
import { useTranslation } from "@/modules/i18n/use-translation";
import { ProductCard } from "./product-card";

import type { LocalizedString } from "@/modules/catalog/types";

type Combo = {
  id: number;
  sku: string;
  name: LocalizedString | string;
  salad: LocalizedString | string;
  juice: LocalizedString | string;
  dessert: LocalizedString | string;
  price: number;
  cost: number;
  margin: number;
  calories: number;
  protein: number;
  glutenFree: boolean;
  benefit: LocalizedString | string;
  benefitDetail: LocalizedString | string;
  recommendedFor: LocalizedString | string;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  vitaminA: string;
  vitaminC: string;
  image?: string; // Ruta de la imagen de la ensalada
  ingredients: (LocalizedString | string)[]; // Lista completa de ingredientes de la ensalada
};

const COMBOS: Combo[] = [
  {
    id: 1,
    sku: "GD-COMB-001",
    name: { es: "Detox Verde", en: "Green Detox" },
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
    image: "/assets/images/combos/GD-COMB-001.png",
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
    sku: "GD-COMB-002",
    name: { es: "Mediterráneo Fresh", en: "Mediterranean Fresh" },
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
    image: "/assets/images/combos/GD-COMB-002.png",
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
    sku: "GD-COMB-003",
    name: { es: "Poder Tropical", en: "Tropical Power" },
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
    image: "/assets/images/combos/GD-COMB-003.png",
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
    sku: "GD-COMB-004",
    name: { es: "Impulso Energético", en: "Energy Boost" },
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
    image: "/assets/images/combos/GD-COMB-004.png",
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
    sku: "GD-COMB-005",
    name: { es: "Griega Dolio", en: "Greek Dolio" },
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
    image: "/assets/images/combos/GD-COMB-005.png",
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
    sku: "GD-COMB-006",
    name: { es: "Jardín Asado", en: "Roasted Garden" },
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
    image: "/assets/images/combos/GD-COMB-006.png",
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
    sku: "GD-COMB-007",
    name: { es: "La Auyama que Llama", en: "Roasted Pumpkin" },
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
    image: "/assets/images/combos/GD-COMB-007.png",
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

export function LunchCombosSection() {
  const { t, tData } = useTranslation();
  const { addItem } = useCart();
  const [comboDetailsModal, setComboDetailsModal] = useState<Combo | null>(null);
  const [comboNotes, setComboNotes] = useState<Record<number, string>>({});
  const [comboExcludedIngredients, setComboExcludedIngredients] = useState<Record<number, number[]>>({});
  const [comboQuantities, setComboQuantities] = useState<Record<number, number>>({});
  const [visibleCombos, setVisibleCombos] = useState<Set<number>>(new Set());
  const comboRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getIngredientLabel = (ingredient: LocalizedString | string) => tData(ingredient);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    comboRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCombos((prev) => new Set([...prev, index]));
              observer.unobserve(ref);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const toggleExcludedIngredient = (comboId: number, ingredientIndex: number) => {
    setComboExcludedIngredients((prev) => {
      const current = new Set(prev[comboId] ?? []);
      if (current.has(ingredientIndex)) {
        current.delete(ingredientIndex);
      } else {
        current.add(ingredientIndex);
      }
      return {
        ...prev,
        [comboId]: Array.from(current),
      };
    });
  };

  const getQuantity = (comboId: number) => Math.max(1, comboQuantities[comboId] ?? 1);
  const updateQuantity = (comboId: number, delta: number) => {
    setComboQuantities((prev) => {
      const current = prev[comboId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [comboId]: next };
    });
  };
  const resetQuantity = (comboId: number) => {
    setComboQuantities((prev) => ({ ...prev, [comboId]: 1 }));
  };

  const handleAddCombo = (
    combo: Combo,
    options?: { notes?: string; excludedIngredients?: string[]; quantity?: number }
  ) => {
    const notes = options?.notes?.trim();
    const excludedIngredients = options?.excludedIngredients?.filter(Boolean);
    const quantity = options?.quantity ?? 1;
    addItem({
      type: "product",
      slug: combo.sku,
      name: tData(combo.name),
      price: combo.price,
      quantity,
      slotValue: 1,
      weightKg: 0,
      image: combo.image,
      notes: notes || undefined,
      excludedIngredients: excludedIngredients?.length ? excludedIngredients : undefined,
    });

    toast.success(`${tData(combo.name)} ${t("common.added").toLowerCase()}`, {
      duration: 3000,
      style: {
        background: "var(--gd-color-forest)",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 20px",
      },
    });
  };

  const excludedIngredientIndexes = comboDetailsModal
    ? new Set(comboExcludedIngredients[comboDetailsModal.id] ?? [])
    : new Set<number>();
  const comboNotesValue = comboDetailsModal ? comboNotes[comboDetailsModal.id] ?? "" : "";

  return (
    <div className="relative">
      {/* Header compacto */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/30 to-[var(--gd-color-citrus)]/20 px-4 py-1.5 border-2 border-[var(--gd-color-leaf)]/30">
          <Salad className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gd-color-forest)]">
            {t("combos.header_badge")}
          </span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-green-800">
          {t("combos.title")}
        </h2>
        <p className="font-display max-w-2xl mx-auto text-base md:text-lg text-[var(--gd-color-forest)] leading-relaxed font-medium">
          {t("combos.header_desc")}
        </p>
      </div>

      {/* Grid de Combos - Mismo diseño que las cajas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-8">
        {COMBOS.map((combo, index) => {
          const isVisible = visibleCombos.has(index);
          const quantity = getQuantity(combo.id);
          const badges = [
            { label: "UNIT", tone: "unit" as const },
            combo.glutenFree ? { label: "SIN GLUTEN", tone: "glutenFree" as const } : null,
          ].filter(Boolean) as Array<{ label: string; tone: "unit" | "glutenFree" }>;
          const imageSrc = combo.image || "/assets/images/combos/placeholder.png";
          return (
            <div
              key={combo.id}
              ref={(el) => {
                comboRefs.current[index] = el as HTMLDivElement | null;
              }}
              className={`${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} transition-all duration-700`}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                transitionTimingFunction: "ease-out",
              }}
            >
              <ProductCard
                title={tData(combo.name)}
                description={tData(combo.salad)}
                imageContainerClassName="bg-white"
                imageClassName="cursor-zoom-in"
                image={{ src: imageSrc, alt: tData(combo.salad), fit: "contain", priority: combo.id <= 3 }}
                badges={badges}
                priceLabel={`RD$${combo.price.toLocaleString("es-DO", { minimumFractionDigits: 0 })}`}
                disableFlip
                quantity={quantity}
                onDecrease={() => updateQuantity(combo.id, -1)}
                onIncrease={() => updateQuantity(combo.id, 1)}
                onAdd={() => {
                  const excludedIngredients = (comboExcludedIngredients[combo.id] ?? [])
                    .map((index) => combo.ingredients[index])
                    .filter(Boolean)
                    .map(getIngredientLabel);
                  handleAddCombo(combo, {
                    notes: comboNotes[combo.id],
                    excludedIngredients,
                    quantity,
                  });
                  resetQuantity(combo.id);
                }}
                addLabel={t("common.add_to_cart")}
                imageAction={
                  <button
                    type="button"
                    onClick={() => setComboDetailsModal(combo)}
                    aria-label={t("common.view_details")}
                    className="rounded-full border border-[var(--gd-color-orange)] bg-white/90 p-2 text-[var(--gd-color-orange)] transition duration-200 hover:bg-[var(--gd-color-orange)] hover:text-white"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                }
              />
            </div>
          );
        })}
      </div>

      {/* Modal de detalles del combo */}
      {comboDetailsModal && typeof window !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[10003] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 pt-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setComboDetailsModal(null);
            }
          }}
          style={{ position: "fixed" }}
        >
          <div className="relative w-full max-w-3xl max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl z-[10004]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b-2 border-[var(--gd-color-leaf)]/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
                  {tData(comboDetailsModal.name)}
                </h2>
                <button
                  type="button"
                  onClick={() => setComboDetailsModal(null)}
                  className="rounded-full p-2 hover:bg-[var(--gd-color-sprout)]/20 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Imagen del combo */}
              {comboDetailsModal.image && (
                <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white border-2 border-[var(--gd-color-leaf)]/20">
                  <Image
                    src={comboDetailsModal.image}
                    alt={tData(comboDetailsModal.salad)}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover object-center"
                  />
                </div>
              )}

              {/* Componentes del combo */}
              <div className="grid md:grid-cols-3 gap-4 rounded-xl bg-gradient-to-br from-[var(--gd-color-sprout)]/30 to-white p-4 border-2 border-[var(--gd-color-leaf)]/30">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Salad className="w-10 h-10 text-green-600" />
                  <p className="text-xs font-semibold text-[var(--gd-color-forest)] uppercase">{t("combos.salad")}</p>
                  <p className="text-sm text-[var(--color-foreground)] font-medium">{tData(comboDetailsModal.salad)}</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Citrus className="w-10 h-10 text-orange-500" />
                  <p className="text-xs font-semibold text-[var(--gd-color-forest)] uppercase">{t("combos.juice")}</p>
                  <p className="text-sm text-[var(--color-foreground)] font-medium">{tData(comboDetailsModal.juice)}</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Apple className="w-10 h-10 text-red-500" />
                  <p className="text-xs font-semibold text-[var(--gd-color-forest)] uppercase">{t("combos.dessert")}</p>
                  <p className="text-sm text-[var(--color-foreground)] font-medium">{tData(comboDetailsModal.dessert)}</p>
                </div>
              </div>

              {/* Precio destacado */}
              <div className="rounded-xl bg-gradient-to-br from-[var(--gd-color-leaf)]/40 via-[var(--gd-color-sprout)]/50 to-[var(--gd-color-avocado)]/30 p-6 border-2 border-[var(--gd-color-leaf)]/40 shadow-lg text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--gd-color-forest)] font-bold mb-1">
                  {t("common.price")}
                </p>
                <p className="font-display text-4xl font-black text-emerald-950">
                  RD${comboDetailsModal.price.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                </p>
              </div>

              {/* Información nutricional completa */}
              <div className="rounded-xl bg-gradient-to-br from-[var(--gd-color-sprout)]/40 to-white p-6 border-2 border-[var(--gd-color-leaf)]/30 space-y-4">
                <h3 className="text-lg font-bold text-[var(--gd-color-forest)] uppercase text-center mb-4">
                  <span className="inline-flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-600" />
                    {t("combos.nutrition")}
                  </span>
                </h3>

                {/* Estadísticas principales */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center rounded-lg bg-white/80 p-4 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("combos.calories")}</p>
                    <p className="text-2xl font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.calories}</p>
                  </div>
                  <div className="text-center rounded-lg bg-white/80 p-4 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("combos.protein")}</p>
                    <p className="text-2xl font-bold text-[var(--gd-color-leaf)]">{comboDetailsModal.protein}g</p>
                  </div>
                  <div className="text-center rounded-lg bg-white/80 p-4 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("combos.benefit")}</p>
                    <p className="text-sm font-semibold text-[var(--gd-color-forest)] leading-tight">{tData(comboDetailsModal.benefit)}</p>
                  </div>
                </div>

                {/* Macros detallados */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("combos.carbs")}</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.carbs}g</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("combos.fats")}</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.fats}g</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("category.fiber")}</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.fiber}g</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("category.sugars")}</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.sugars}g</p>
                  </div>
                </div>

                {/* Vitaminas */}
                <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20">
                  <p className="text-sm font-bold text-[var(--gd-color-forest)] mb-3 text-center">{t("category.vitamins")}</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="text-xs text-[var(--color-muted)]">Vitamina A</p>
                        <p className="text-sm font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.vitaminA}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Citrus className="w-6 h-6 text-orange-500" />
                      <div>
                        <p className="text-xs text-[var(--color-muted)]">Vitamina C</p>
                        <p className="text-sm font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.vitaminC}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beneficios y recomendaciones */}
                <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--gd-color-forest)] mb-1">{t("combos.benefit")}</p>
                    <p className="text-sm text-[var(--color-foreground)]">{tData(comboDetailsModal.benefitDetail)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--gd-color-forest)] mb-1">{t("combos.recommended")}</p>
                    <p className="text-sm text-[var(--color-foreground)] leading-relaxed">{tData(comboDetailsModal.recommendedFor)}</p>
                  </div>
                  {comboDetailsModal.glutenFree && (
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--gd-color-sprout)]/30 p-2 border border-[var(--gd-color-leaf)]/20">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{t("combos.gluten_free")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredientes de la ensalada */}
              <div className="rounded-xl bg-white/80 p-6 border-2 border-[var(--gd-color-leaf)]/30">
                <h3 className="text-lg font-bold text-[var(--gd-color-forest)] uppercase mb-4 text-center flex items-center justify-center gap-2">
                  <Salad className="w-4 h-4 text-green-600" />
                  <span>{t("combos.ingredients")}</span>
                </h3>
                <p className="text-xs text-[var(--color-muted)] text-center mb-4">
                  {t("combos.exclude_hint")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comboDetailsModal.ingredients.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 rounded-lg bg-[var(--gd-color-sprout)]/20 px-3 py-2.5 border border-[var(--gd-color-leaf)]/20 min-h-[2.5rem] ${excludedIngredientIndexes.has(idx)
                        ? "opacity-80"
                        : ""}`}
                    >
                      <span className="text-[var(--gd-color-leaf)] text-sm flex-shrink-0 mt-0.5">•</span>
                      <span
                        className={`text-sm font-medium leading-relaxed break-words flex-1 ${excludedIngredientIndexes.has(idx)
                          ? "text-[var(--color-muted)] line-through"
                          : "text-[var(--color-foreground)]"}`}
                      >
                        {getIngredientLabel(ingredient)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExcludedIngredient(comboDetailsModal.id, idx)}
                        className={`ml-auto rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${excludedIngredientIndexes.has(idx)
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-[var(--gd-color-leaf)]/30 bg-white text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30"}`}
                      >
                        {excludedIngredientIndexes.has(idx) ? t("combos.excluded") : t("combos.exclude")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas del combo */}
              <div className="rounded-xl bg-white/80 p-6 border-2 border-[var(--gd-color-leaf)]/30 space-y-3">
                <h3 className="text-lg font-bold text-[var(--gd-color-forest)] uppercase text-center">
                  {t("combos.notes_title")}
                </h3>
                <textarea
                  value={comboNotesValue}
                  onChange={(event) =>
                    setComboNotes((prev) => ({
                      ...prev,
                      [comboDetailsModal.id]: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder={t("combos.notes_placeholder")}
                  className="w-full rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--gd-color-leaf)]"
                />
              </div>

              {/* Botón de agregar al carrito */}
              <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20">
                <button
                  type="button"
                  onClick={() => {
                    const excludedIngredients = (comboExcludedIngredients[comboDetailsModal.id] ?? [])
                      .map((index) => comboDetailsModal.ingredients[index])
                      .filter(Boolean)
                      .map(getIngredientLabel);
                    handleAddCombo(comboDetailsModal, {
                      notes: comboNotesValue,
                      excludedIngredients,
                    });
                    setComboDetailsModal(null);
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-white" />
                    {t("common.add_to_cart")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
