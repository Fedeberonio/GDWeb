"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/modules/cart/context";

type Combo = {
  id: number;
  name: string;
  salad: string;
  juice: string;
  dessert: string;
  price: number;
  cost: number;
  margin: number;
  calories: number;
  protein: number;
  glutenFree: boolean;
  benefit: string;
  benefitDetail: string;
  recommendedFor: string;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  vitaminA: string;
  vitaminC: string;
  image?: string; // Ruta de la imagen de la ensalada
  ingredients: string[]; // Lista completa de ingredientes de la ensalada
};

const COMBOS: Combo[] = [
  {
    id: 1,
    name: "DETOX VERDE",
    salad: "Verde Detox con Arroz Integral y Berenjenas",
    juice: "Pepinada",
    dessert: "Melón en cubos",
    price: 500,
    cost: 187,
    margin: 63,
    calories: 420,
    protein: 12,
    glutenFree: false,
    benefit: "Depuración y alcalinización",
    benefitDetail: "Depuración y alcalinización del organismo",
    recommendedFor: "Personas con retención de líquidos, hinchazón, digestión lenta",
    carbs: 62,
    fats: 14,
    fiber: 11,
    sugars: 18,
    vitaminA: "Alto",
    vitaminC: "Alto",
    image: "/images/combos/01_VERDE_DETOX_ARROZ_BERENJENAS.png",
    ingredients: [
      "Lechuga repollada (50g)",
      "Arroz integral cocido (80g)",
      "Berenjenas asadas (60g)",
      "Apio fresco (30g)",
      "Aguacate (0.25 unidad)",
      "Pepino (40g)",
      "Zanahoria rallada (30g)",
      "Semillas ajonjolí (5g)",
      "Cebolla morada (15g)",
      "Perejil y cilantro (10g)",
      "Limón (jugo) (0.5 unidad)",
      "Aceite oliva (20ml)",
      "Jengibre (5g)",
    ],
  },
  {
    id: 2,
    name: "MEDITERRÁNEO FRESH",
    salad: "Griega con Trigo Burgol y Maíz",
    juice: "Rosa Maravillosa",
    dessert: "Naranja en gajos",
    price: 600,
    cost: 313,
    margin: 48,
    calories: 485,
    protein: 18,
    glutenFree: false,
    benefit: "Antioxidante y cardioprotector",
    benefitDetail: "Salud cardiovascular y antioxidante",
    recommendedFor: "Prevención cardiovascular, control colesterol, antiaging",
    carbs: 58,
    fats: 18,
    fiber: 9,
    sugars: 22,
    vitaminA: "Alto",
    vitaminC: "Muy Alto",
    image: "/images/combos/02_GRIEGA_BULGUR_MAIZ_v1.png",
    ingredients: [
      "Queso feta (60g)",
      "Tomates bugalú (80g)",
      "Pepino (50g)",
      "Cebolla morada (20g)",
      "Aceitunas mixtas (30g)",
      "Pimiento verde (40g)",
      "Trigo burgol cocido (80g)",
      "Maíz dulce (40g)",
      "Semillas chía (5g)",
      "Orégano fresco (5g)",
      "Aceite oliva (20ml)",
      "Limón (0.5 unidad)",
      "Vinagre balsámico (5ml)",
      "Miel (5ml)",
    ],
  },
  {
    id: 3,
    name: "TROPICAL POWER",
    salad: "Tropical con Quinoa y Pitahaya",
    juice: "Tropicalote",
    dessert: "Mango en cubos",
    price: 600,
    cost: 281,
    margin: 53,
    calories: 520,
    protein: 16,
    glutenFree: true,
    benefit: "Energizante y sistema inmune",
    benefitDetail: "Fortalecimiento sistema inmune y energía",
    recommendedFor: "Deportistas, personas con defensas bajas, necesidad de energía sostenida",
    carbs: 72,
    fats: 16,
    fiber: 13,
    sugars: 28,
    vitaminA: "Muy Alto",
    vitaminC: "Muy Alto",
    image: "/images/combos/03_TROPICAL_QUINOA_PITAHAYA.png",
    ingredients: [
      "Quinoa cocida (80g)",
      "Mango (80g)",
      "Pitahaya (60g)",
      "Garbanzos cocidos (60g)",
      "Aguacate (0.25 unidad)",
      "Repollo colorado (40g)",
      "Zanahoria rallada (30g)",
      "Semillas chía (5g)",
      "Cebolla morada (15g)",
      "Cilantro (10g)",
      "Limón (0.5 unidad)",
      "Miel (5ml)",
      "Aceite oliva (15ml)",
    ],
  },
  {
    id: 4,
    name: "ENERGY BOOST",
    salad: "Verde Detox Simplificada",
    juice: "Zanahoria Manzana Limón",
    dessert: "Piña en cubos",
    price: 500,
    cost: 161,
    margin: 68,
    calories: 380,
    protein: 9,
    glutenFree: true,
    benefit: "Energía y digestión",
    benefitDetail: "Mejora de visión y energía sostenida",
    recommendedFor: "Problemas de visión, cansancio, necesidad de concentración",
    carbs: 68,
    fats: 9,
    fiber: 9,
    sugars: 24,
    vitaminA: "Muy Alto",
    vitaminC: "Alto",
    image: "/images/combos/04_VERDE_DETOX_SIMPLIFICADA_v2.png",
    ingredients: [
      "Lechuga repollada (60g)",
      "Arroz integral (80g)",
      "Apio (30g)",
      "Pepino (50g)",
      "Zanahoria rallada (40g)",
      "Cebolla morada (15g)",
      "Cilantro (10g)",
      "Limón (0.5 unidad)",
      "Aceite oliva (20ml)",
    ],
  },
  {
    id: 5,
    name: "GREEK DOLIO",
    salad: "Griega Simplificada",
    juice: "Sandía y Manzana",
    dessert: "Banana",
    price: 500,
    cost: 156,
    margin: 69,
    calories: 340,
    protein: 8,
    glutenFree: true,
    benefit: "Hidratación y recuperación muscular",
    benefitDetail: "Hidratación profunda y recuperación muscular",
    recommendedFor: "Post-ejercicio, calor intenso, calambres, deshidratación",
    carbs: 58,
    fats: 8,
    fiber: 7,
    sugars: 26,
    vitaminA: "Alto",
    vitaminC: "Alto",
    image: "/images/combos/05_GRIEGA_SIMPLIFICADA.png",
    ingredients: [
      "Tomates bugalú (100g)",
      "Pepino (60g)",
      "Cebolla morada (20g)",
      "Pimiento verde (50g)",
      "Lechuga repollada (40g)",
      "Maíz dulce (40g)",
      "Orégano (5g)",
      "Aceite oliva (20ml)",
      "Limón (0.5 unidad)",
    ],
  },
  {
    id: 6,
    name: "JARDÍN ASADO",
    salad: "Endivia con Tomate Asado y Mozzarella",
    juice: "Melón y Pepino",
    dessert: "Naranja en gajos",
    price: 500,
    cost: 189,
    margin: 62,
    calories: 410,
    protein: 15,
    glutenFree: true,
    benefit: "Salud cardiovascular y piel",
    benefitDetail: "Salud cardiovascular y piel radiante",
    recommendedFor: "Salud de la piel, prevención cardiovascular, antiaging",
    carbs: 48,
    fats: 16,
    fiber: 8,
    sugars: 20,
    vitaminA: "Alto",
    vitaminC: "Muy Alto",
    image: "/images/combos/Ensalada_Jardin_asado.png",
    ingredients: [
      "Lechuga endivia (40g)",
      "Lechuga repollada (40g)",
      "Tomate asado (100g)",
      "Mozzarella fresca (50g)",
      "Cebolla caramelizada (30g)",
      "Pepino (40g)",
      "Maíz dulce (30g)",
      "Aceitunas negras (20g)",
      "Albahaca fresca (5g)",
      "Aceite oliva (20ml)",
      "Vinagre balsámico (5ml)",
      "Ajo (2g)",
      "Orégano (2g)",
    ],
  },
  {
    id: 7,
    name: "LA AUYAMA QUE LLAMA",
    salad: "Lechuga Rizada con Auyama Salteada",
    juice: "China Chinola",
    dessert: "Mango en cubos",
    price: 500,
    cost: 185,
    margin: 63,
    calories: 395,
    protein: 11,
    glutenFree: true,
    benefit: "Visión y salud de la piel",
    benefitDetail: "Salud ocular y piel (beta-caroteno)",
    recommendedFor: "Problemas de visión, piel seca, necesidad de vitamina A",
    carbs: 58,
    fats: 12,
    fiber: 10,
    sugars: 22,
    vitaminA: "Muy Alto",
    vitaminC: "Alto",
    image: "/images/combos/Ensaladaa_Auyama_que_llama.png",
    ingredients: [
      "Lechuga rizada (60g)",
      "Auyama salteada (100g)",
      "Ajo (5g)",
      "Garbanzos tostados (40g)",
      "Ajonjolí tostado (10g)",
      "Tomate bugalú (80g)",
      "Cebolla morada (30g)",
      "Zanahoria rallada (30g)",
      "Cilantro y perejil (15g)",
      "Aceite oliva (20ml)",
      "Miel (5ml)",
      "Limón (0.5 unidad)",
      "Sal (2g)",
    ],
  },
];

export function LunchCombosSection() {
  const { addItem } = useCart();
  const [comboDetailsModal, setComboDetailsModal] = useState<Combo | null>(null);
  const [visibleCombos, setVisibleCombos] = useState<Set<number>>(new Set());
  const comboRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  const handleAddCombo = (combo: Combo) => {
    addItem({
      type: "product",
      slug: `combo-${combo.id}`,
      name: combo.name,
      price: combo.price,
      quantity: 1,
      slotValue: 1,
      weightKg: 0,
      image: combo.image,
    });
  };

  return (
    <div className="relative">
      {/* Header compacto */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/30 to-[var(--gd-color-citrus)]/20 px-4 py-1.5 border-2 border-[var(--gd-color-leaf)]/30">
          <span className="text-sm">🥗</span>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gd-color-forest)]">
            Combos de Almuerzo
          </span>
        </div>
        <h2 className="font-display text-xl bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent sm:text-2xl">
          Comidas completas, frescas y nutritivas
        </h2>
        <p className="max-w-2xl mx-auto text-sm text-[var(--gd-color-forest)] leading-relaxed">
          Cada combo incluye una ensalada gourmet, jugo natural fresco y postre. 
          <strong className="text-[var(--gd-color-leaf)]"> Perfectos para grupos de turistas, oficinas y eventos.</strong>
        </p>
      </div>

      {/* Grid de Combos - Mismo diseño que las cajas */}
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          {COMBOS.map((combo, index) => {
            const isVisible = visibleCombos.has(index);
            return (
            <article
              key={combo.id}
              ref={(el) => {
                comboRefs.current[index] = el as HTMLDivElement | null;
              }}
              className={`group relative flex h-full flex-col overflow-hidden rounded-[32px] border-2 border-[var(--gd-color-leaf)]/50 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white shadow-2xl transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_30px_60px_rgba(45,80,22,0.25)] hover:border-[var(--gd-color-leaf)] hover:scale-[1.02] ${
                isVisible 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                transitionDuration: "700ms",
                transitionTimingFunction: "ease-out",
              }}
            >
              {/* Efecto de brillo sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--gd-color-leaf)]/0 via-transparent to-[var(--gd-color-sky)]/0 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              
              {/* Imagen del combo - Mismo tamaño que las cajas */}
              <div className="relative h-80 w-full overflow-hidden bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white rounded-t-[28px]">
                {combo.image ? (
                  <>
                    <Image
                      src={combo.image}
                      alt={combo.salad}
                      fill
                      sizes="(max-width:768px) 100vw, 400px"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]"
                      priority={combo.id <= 3}
                    />
                  </>
                ) : (
                  <div className="relative h-full w-full bg-gradient-to-br from-[var(--gd-color-sprout)]/50 via-[var(--gd-color-leaf)]/30 to-[var(--gd-color-citrus)]/20 flex items-center justify-center">
                    <div className="text-center space-y-3 relative z-10">
                      <div className="text-7xl mb-2 group-hover:scale-110 transition-transform duration-300">🥗</div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[var(--gd-color-forest)] uppercase tracking-wider">
                          {combo.name}
                        </p>
                        <p className="text-xs text-[var(--gd-color-forest)]/70 font-medium">
                          Foto próximamente
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Badges superiores - Mismo estilo que las cajas */}
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                  {combo.margin >= 65 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--gd-color-citrus)]/95 to-[var(--gd-color-apple)]/95 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                      <span>⭐</span>
                      <span>{combo.margin}% margen</span>
                    </div>
                  )}
                  {combo.glutenFree && (
                    <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--gd-color-forest)]/95 to-[var(--gd-color-leaf)]/95 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      <span>🌾</span>
                      <span>Sin Gluten</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido - Mismo padding y estructura que las cajas */}
              <div className="flex flex-1 flex-col p-3 space-y-2">
                {/* Nombre del combo */}
                <div className="text-center">
                  <h3 className="font-display text-lg font-bold text-[var(--color-foreground)] mb-1">
                    {combo.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed line-clamp-2">
                    {combo.salad}
                  </p>
                </div>

                {/* Precio - Mismo diseño que las cajas */}
                <div className="relative rounded-xl bg-gradient-to-br from-[var(--gd-color-leaf)]/40 via-[var(--gd-color-sprout)]/50 to-[var(--gd-color-avocado)]/30 p-4 border-2 border-[var(--gd-color-leaf)]/40 shadow-lg">
                  <div className="relative z-10 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--gd-color-forest)] font-bold mb-1">
                      Precio
                    </p>
                    <p className="font-display text-3xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-white to-[var(--gd-color-forest)] bg-clip-text text-transparent">
                      RD${combo.price.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-[0.6rem] text-[var(--color-muted)] line-through">
                        RD${(combo.price * 1.1).toLocaleString("es-DO")}
                      </span>
                      <span className="text-[0.6rem] font-semibold text-[var(--gd-color-citrus)]">
                        -10%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción - Mismo estilo que las cajas */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddCombo(combo)}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <span>🛒</span>
                    <span>Agregar al carrito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComboDetailsModal(combo)}
                    className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-[var(--gd-color-leaf)] bg-white px-4 py-2 text-xs font-semibold text-[var(--gd-color-forest)] transition-all duration-300 hover:bg-[var(--gd-color-sprout)]/20 hover:border-[var(--gd-color-forest)]"
                  >
                    <span>👁️</span>
                    <span>Ver detalles</span>
                  </button>
                </div>

              </div>
            </article>
            );
          })}
        </div>

      {/* Modal de detalles del combo */}
      {comboDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-20">
          <div className="relative w-full max-w-3xl max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b-2 border-[var(--gd-color-leaf)]/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
                  {comboDetailsModal.name}
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
                    alt={comboDetailsModal.salad}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover object-center"
                  />
                </div>
              )}

              {/* Componentes del combo */}
              <div className="grid md:grid-cols-3 gap-4 rounded-xl bg-gradient-to-br from-[var(--gd-color-sprout)]/30 to-white p-4 border-2 border-[var(--gd-color-leaf)]/30">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-4xl">🥬</span>
                  <p className="text-xs font-semibold text-[var(--gd-color-forest)] uppercase">Ensalada</p>
                  <p className="text-sm text-[var(--color-foreground)] font-medium">{comboDetailsModal.salad}</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-4xl">🥤</span>
                  <p className="text-xs font-semibold text-[var(--gd-color-forest)] uppercase">Jugo</p>
                  <p className="text-sm text-[var(--color-foreground)] font-medium">{comboDetailsModal.juice}</p>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-4xl">🍓</span>
                  <p className="text-xs font-semibold text-[var(--gd-color-forest)] uppercase">Postre</p>
                  <p className="text-sm text-[var(--color-foreground)] font-medium">{comboDetailsModal.dessert}</p>
                </div>
              </div>

              {/* Precio destacado */}
              <div className="rounded-xl bg-gradient-to-br from-[var(--gd-color-leaf)]/40 via-[var(--gd-color-sprout)]/50 to-[var(--gd-color-avocado)]/30 p-6 border-2 border-[var(--gd-color-leaf)]/40 shadow-lg text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--gd-color-forest)] font-bold mb-1">
                  Precio
                </p>
                <p className="font-display text-4xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-white to-[var(--gd-color-forest)] bg-clip-text text-transparent">
                  RD${comboDetailsModal.price.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                </p>
              </div>

              {/* Información nutricional completa */}
              <div className="rounded-xl bg-gradient-to-br from-[var(--gd-color-sprout)]/40 to-white p-6 border-2 border-[var(--gd-color-leaf)]/30 space-y-4">
                <h3 className="text-lg font-bold text-[var(--gd-color-forest)] uppercase text-center mb-4">
                  📊 Información Nutricional Completa
                </h3>
                
                {/* Estadísticas principales */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center rounded-lg bg-white/80 p-4 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">Calorías</p>
                    <p className="text-2xl font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.calories}</p>
                  </div>
                  <div className="text-center rounded-lg bg-white/80 p-4 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">Proteínas</p>
                    <p className="text-2xl font-bold text-[var(--gd-color-leaf)]">{comboDetailsModal.protein}g</p>
                  </div>
                  <div className="text-center rounded-lg bg-white/80 p-4 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">Beneficio</p>
                    <p className="text-sm font-semibold text-[var(--gd-color-forest)] leading-tight">{comboDetailsModal.benefit}</p>
                  </div>
                </div>

                {/* Macros detallados */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">Carbohidratos</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.carbs}g</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">Grasas</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.fats}g</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">Fibra</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.fiber}g</p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-[var(--gd-color-leaf)]/20">
                    <p className="text-xs text-[var(--color-muted)] mb-1">Azúcares</p>
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.sugars}g</p>
                  </div>
                </div>

                {/* Vitaminas */}
                <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20">
                  <p className="text-sm font-bold text-[var(--gd-color-forest)] mb-3 text-center">Vitaminas</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥕</span>
                      <div>
                        <p className="text-xs text-[var(--color-muted)]">Vitamina A</p>
                        <p className="text-sm font-bold text-[var(--gd-color-forest)]">{comboDetailsModal.vitaminA}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🍋</span>
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
                    <p className="text-sm font-bold text-[var(--gd-color-forest)] mb-1">Beneficio Principal</p>
                    <p className="text-sm text-[var(--color-foreground)]">{comboDetailsModal.benefitDetail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--gd-color-forest)] mb-1">Recomendado para</p>
                    <p className="text-sm text-[var(--color-foreground)] leading-relaxed">{comboDetailsModal.recommendedFor}</p>
                  </div>
                  {comboDetailsModal.glutenFree && (
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--gd-color-sprout)]/30 p-2 border border-[var(--gd-color-leaf)]/20">
                      <span className="text-xl">🌾</span>
                      <p className="text-sm font-semibold text-[var(--gd-color-forest)]">Sin Gluten</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredientes de la ensalada */}
              <div className="rounded-xl bg-white/80 p-6 border-2 border-[var(--gd-color-leaf)]/30">
                <h3 className="text-lg font-bold text-[var(--gd-color-forest)] uppercase mb-4 text-center">
                  🥗 Ingredientes de la Ensalada
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {comboDetailsModal.ingredients.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg bg-[var(--gd-color-sprout)]/20 px-3 py-2 border border-[var(--gd-color-leaf)]/20"
                    >
                      <span className="text-[var(--gd-color-leaf)] text-sm">•</span>
                      <span className="text-sm text-[var(--color-foreground)] font-medium">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de agregar al carrito */}
              <div className="pt-4 border-t border-[var(--gd-color-leaf)]/20">
                <button
                  type="button"
                  onClick={() => {
                    handleAddCombo(comboDetailsModal);
                    setComboDetailsModal(null);
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  🛒 Agregar al carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
