import type { BoxRule, Product } from "@/modules/catalog/types";

type VariantContents = Record<"mix" | "fruity" | "veggie", Array<{ productSlug: string; quantity: number }>>;
type PriceLookup = Record<string, number | undefined>;

export type ProductMeta = {
  slug: string;
  name: string;
  categoryId?: string;
  tags?: string[];
  weightKg?: number;
  slotValue?: number;
  wholesaleCost?: number;
};

let productMetaMap = new Map<string, ProductMeta>();
let boxRulesMap: Record<string, BoxRule> = {};

export function buildProductMetaMap(products: Product[]) {
  return new Map(
    products.map((product) => [
      product.slug,
      {
        slug: product.slug,
        name: product.name.es,
        categoryId: product.categoryId,
        tags: product.tags,
        weightKg: product.logistics?.weightKg,
        slotValue: product.metadata?.slotValue,
        wholesaleCost: product.metadata?.wholesaleCost,
      },
    ]),
  );
}

export function setProductMetaMap(products: Product[]) {
  productMetaMap = buildProductMetaMap(products);
}

export function setBoxRulesMap(rules: BoxRule[]) {
  boxRulesMap = Object.fromEntries(rules.map((rule) => [rule.id, rule]));
}

export function getBoxRule(boxId?: string, rulesMap: Record<string, BoxRule> = boxRulesMap): BoxRule | undefined {
  if (!boxId) return undefined;
  if (rulesMap[boxId]) return rulesMap[boxId];

  const upper = boxId.toUpperCase();
  return rulesMap[upper];
}

/**
 * Obtiene el contenido base de una caja según la variante seleccionada
 * Si existe variantContents para la variante, lo usa; si no, filtra baseContents
 */
export function getBoxContentsForVariant(
  boxId: string,
  variant: "mix" | "fruity" | "veggie",
  rulesMap: Record<string, BoxRule> = boxRulesMap,
): Array<{ productSlug: string; quantity: number }> {
  const rule = getBoxRule(boxId, rulesMap);
  if (!rule) return [];

  const variantContents = (rule as BoxRule & { variantContents?: VariantContents }).variantContents;

  // Si existe contenido específico para la variante, usarlo
  if (variantContents && variantContents[variant]) {
    return variantContents[variant];
  }

  // Si no, usar baseContents (para mix) o filtrar según la variante
  if (variant === "mix") {
    return rule.baseContents ?? [];
  }

  // Para fruity y veggie, filtrar baseContents
  return rule.baseContents?.filter((item) => {
    const meta = getProductMeta(item.productSlug);
    if (!meta) return false;

    const nameLower = meta.name.toLowerCase();
    const slugLower = item.productSlug.toLowerCase();

    if (variant === "fruity") {
      // Excluir aromáticas de cocina
      const isCookingAromatic =
        slugLower.includes("ajo") ||
        slugLower.includes("cebolla") ||
        slugLower.includes("apio") ||
        slugLower.includes("perejil") ||
        slugLower.includes("cilantro") ||
        nameLower.includes("ajo") ||
        nameLower.includes("cebolla") ||
        nameLower.includes("apio") ||
        nameLower.includes("perejil") ||
        nameLower.includes("cilantro");

      // Solo frutas y cítricos
      const category = meta.categoryId?.toLowerCase() || "";
      return (
        (category.includes("fruta") ||
          category.includes("citr") ||
          nameLower.includes("limón") ||
          nameLower.includes("limon") ||
          nameLower.includes("naranja")) &&
        !isCookingAromatic
      );
    } else {
      // veggie: solo vegetales, sin frutas
      const category = meta.categoryId?.toLowerCase() || "";
      const isVegetable = category.includes("veget") || category.includes("hierb");
      const isFruit = category.includes("fruta") ||
        nameLower.includes("mango") ||
        nameLower.includes("piña") ||
        nameLower.includes("pina") ||
        nameLower.includes("banana") ||
        nameLower.includes("chinola");
      return isVegetable && !isFruit;
    }
  }) ?? [];
}

export function getProductMeta(slug: string, metaMap: Map<string, ProductMeta> = productMetaMap): ProductMeta | undefined {
  return metaMap.get(slug);
}

function resolveUnitPrice(slug: string, priceLookup?: PriceLookup): number {
  const lookupPrice = priceLookup?.[slug];
  if (typeof lookupPrice === "number" && Number.isFinite(lookupPrice)) {
    return lookupPrice;
  }
  const meta = getProductMeta(slug);
  return meta?.wholesaleCost ? meta.wholesaleCost * 1.5 : 0;
}

export function computeSlots(selection: Record<string, number | undefined>, metaMap: Map<string, ProductMeta> = productMetaMap) {
  return Object.entries(selection).reduce((total, [slug, quantity]) => {
    if (!quantity) return total;
    const meta = getProductMeta(slug, metaMap);
    const slotValue = meta?.slotValue ?? 1;
    return total + slotValue * quantity;
  }, 0);
}

export function computeWeight(selection: Record<string, number | undefined>, metaMap: Map<string, ProductMeta> = productMetaMap) {
  return Object.entries(selection).reduce((total, [slug, quantity]) => {
    if (!quantity) return total;
    const meta = getProductMeta(slug, metaMap);
    const weight = meta?.weightKg ?? 0.5;
    return total + weight * quantity;
  }, 0);
}

export function computeCost(selection: Record<string, number | undefined>, metaMap: Map<string, ProductMeta> = productMetaMap) {
  return Object.entries(selection).reduce((total, [slug, quantity]) => {
    if (!quantity) return total;
    const meta = getProductMeta(slug, metaMap);
    const cost = meta?.wholesaleCost ?? 0;
    return total + cost * quantity;
  }, 0);
}

/**
 * Detecta si hay problemas críticos en el balance de la caja
 * Retorna un objeto con información sobre los problemas encontrados
 */
export function checkBalanceIssues(
  boxId: string,
  selectedProducts: Record<string, number>,
  metaMap: Map<string, ProductMeta> = productMetaMap,
  rulesMap: Record<string, BoxRule> = boxRulesMap,
): {
  hasCriticalIssues: boolean;
  issues: Array<{ category: string; message: string; type: "missing" | "excess" }>;
} {
  const rule = getBoxRule(boxId, rulesMap);
  const categoryBudget = rule?.categoryBudget ?? {};
  const issues: Array<{ category: string; message: string; type: "missing" | "excess" }> = [];

  // Contar productos por categoría
  const counts: Record<string, number> = {
    leafy: 0,
    fruit_large: 0,
    aromatic: 0,
    root: 0,
    citrus: 0,
  };

  Object.entries(selectedProducts).forEach(([slug, quantity]) => {
    if (!quantity || quantity <= 0) return;
    const meta = getProductMeta(slug, metaMap);
    if (!meta) return;

    const productCategory = meta.categoryId?.toLowerCase() || "";
    if (productCategory.includes("hoja") || productCategory.includes("leafy") || productCategory.includes("lechuga") || productCategory.includes("espinaca")) {
      counts.leafy += quantity;
    } else if (productCategory.includes("fruta") || productCategory.includes("fruit") || productCategory.includes("mango") || productCategory.includes("piña")) {
      counts.fruit_large += quantity;
    } else if (productCategory.includes("aromática") || productCategory.includes("aromatic") || productCategory.includes("hierba") || productCategory.includes("ajo")) {
      counts.aromatic += quantity;
    } else if (productCategory.includes("raíz") || productCategory.includes("root") || productCategory.includes("tubérculo") || productCategory.includes("papa") || productCategory.includes("yuca")) {
      counts.root += quantity;
    } else if (productCategory.includes("cítrico") || productCategory.includes("citrus") || productCategory.includes("limón") || productCategory.includes("naranja")) {
      counts.citrus += quantity;
    }
  });

  // Verificar problemas críticos (solo faltantes, no excesos)
  const labels: Record<string, string> = {
    leafy: "Hojas",
    fruit_large: "Frutas grandes",
    aromatic: "Aromáticas",
    root: "Raíces",
    citrus: "Cítricos",
  };

  Object.entries(categoryBudget).forEach(([category, budget]) => {
    const current = counts[category as keyof typeof counts] || 0;
    const budgetTyped = budget as { min?: number; max?: number };
    const min = budgetTyped.min || 0;
    if (current < min) {
      issues.push({
        category: labels[category as keyof typeof labels] || category,
        message: `Falta ${min - current} ${labels[category as keyof typeof labels]?.toLowerCase() || category}`,
        type: "missing",
      });
    }
  });

  return {
    hasCriticalIssues: issues.length > 0,
    issues,
  };
}

/**
 * Calcula si una caja personalizada pasa a ser "A la Carta"
 * Retorna true si se modificó más del 50% del contenido base
 */
export function isCustomizedToACarta(boxId: string, selectedProducts: Record<string, number>): boolean {
  const rule = getBoxRule(boxId);
  if (!rule || !rule.baseContents) return false;
  
  const baseContents = rule.baseContents;
  const modifiedCount = baseContents.filter((item) => {
    return selectedProducts[item.productSlug] !== undefined && 
           selectedProducts[item.productSlug] !== item.quantity;
  }).length;
  
  return modifiedCount > baseContents.length * 0.5;
}

/**
 * Calcula el precio cuando pasa a "A la Carta"
 * Precio individual = precio de catálogo (fallback wholesaleCost * 1.5)
 */
export function computeACartaPrice(
  selection: Record<string, number | undefined>,
  priceLookup?: PriceLookup,
): number {
  return Object.entries(selection).reduce((total, [slug, quantity]) => {
    if (!quantity) return total;
    const unitPrice = resolveUnitPrice(slug, priceLookup);
    return total + unitPrice * quantity;
  }, 0);
}

/**
 * Calcula el costo extra de los swaps (productos intercambiados que cuestan más)
 * Compara los productos seleccionados con los productos base de la caja
 */
export function computeSwapExtras(
  boxId: string,
  selectedProducts: Record<string, number>,
  priceLookup?: PriceLookup,
): number {
  const rule = getBoxRule(boxId);
  if (!rule || !rule.baseContents) return 0;
  
  const PRICE_TOLERANCE = 10; // RD$ tolerancia para swaps sin recargo
  let totalExtras = 0;
  
  // Crear un mapa de productos base con sus cantidades
  const baseProductsMap = new Map<string, number>();
  rule.baseContents.forEach((item) => {
    baseProductsMap.set(item.productSlug, item.quantity);
  });
  
  // Calcular extras por cada producto seleccionado
  Object.entries(selectedProducts).forEach(([slug, quantity]) => {
    if (!quantity || quantity <= 0) return;
    
    const baseQuantity = baseProductsMap.get(slug) ?? 0;
    const productPrice = resolveUnitPrice(slug, priceLookup);
    
    // Si el producto está en la base, no es un swap
    if (baseQuantity > 0) {
      // Si la cantidad es diferente, calcular la diferencia
      if (quantity !== baseQuantity) {
        const diff = quantity - baseQuantity;
        if (diff > 0) {
          // Producto agregado (no es swap, es extra)
          // No contar como extra de swap
        } else {
          // Producto removido parcialmente, no hay costo extra
        }
      }
      return;
    }
    
    // El producto no está en la base, es un swap o producto nuevo
    // Necesitamos encontrar qué producto base fue reemplazado
    // Por ahora, asumimos que si no está en la base y tiene precio, es un swap
    // Pero no podemos calcular el extra sin saber qué producto reemplazó
    
    // Buscar productos base que ya no están en selectedProducts
    baseProductsMap.forEach((baseQty, baseSlug) => {
      const currentQty = selectedProducts[baseSlug] ?? 0;
      if (currentQty === 0 && baseQty > 0) {
        // Este producto base fue removido completamente
        // Podría haber sido reemplazado por el producto actual
        const basePrice = resolveUnitPrice(baseSlug, priceLookup);
        
        // Si el nuevo producto cuesta más, calcular la diferencia
        if (productPrice > basePrice + PRICE_TOLERANCE) {
          const extra = (productPrice - basePrice) * Math.min(quantity, baseQty);
          totalExtras += extra;
        }
      }
    });
  });
  
  return totalExtras;
}

/**
 * Calcula el costo extra de swaps de manera más precisa
 * Compara el precio total de productos seleccionados vs productos base
 * Solo cuenta como extra si la diferencia es mayor a la tolerancia
 */
export function computeSwapExtrasV2(
  boxId: string,
  selectedProducts: Record<string, number>,
  variant?: "mix" | "fruity" | "veggie",
  priceLookup?: PriceLookup,
): number {
  const rule = getBoxRule(boxId);
  if (!rule) return 0;
  const variantContents = (rule as BoxRule & { variantContents?: VariantContents }).variantContents;
  
  const PRICE_TOLERANCE = 10; // RD$ tolerancia para swaps sin recargo
  
  // Obtener productos base según la variante
  let baseContents: Array<{ productSlug: string; quantity: number }> = [];
  if (variant && variantContents && variantContents[variant]) {
    baseContents = variantContents[variant];
  } else {
    baseContents = rule.baseContents ?? [];
  }
  
  if (baseContents.length === 0) return 0;
  
  // Calcular precio total de productos base (precio de catálogo; fallback wholesaleCost * 1.5)
  let baseTotalPrice = 0;
  baseContents.forEach((item) => {
    const basePrice = resolveUnitPrice(item.productSlug, priceLookup);
    baseTotalPrice += basePrice * item.quantity;
  });
  
  // Calcular precio total de productos seleccionados (precio de catálogo; fallback wholesaleCost * 1.5)
  let selectedTotalPrice = 0;
  Object.entries(selectedProducts).forEach(([slug, quantity]) => {
    if (!quantity || quantity <= 0) return;
    const productPrice = resolveUnitPrice(slug, priceLookup);
    selectedTotalPrice += productPrice * quantity;
  });
  
  // Si el precio seleccionado es mayor que el base + tolerancia, hay extra
  const priceDiff = selectedTotalPrice - baseTotalPrice;
  if (priceDiff > PRICE_TOLERANCE) {
    return priceDiff;
  }
  
  return 0;
}

/**
 * Calcula el precio de la caja considerando si pasa a A la Carta y extras de swaps
 */
export function computeBoxPrice(
  boxId: string,
  boxBasePrice: number,
  selectedProducts: Record<string, number>,
  variant?: "mix" | "fruity" | "veggie",
  priceLookup?: PriceLookup,
): { price: number; isACarta: boolean; extras: number; savings?: number } {
  const isACarta = isCustomizedToACarta(boxId, selectedProducts);
  
  // Calcular extras de swaps (usando la variante si está disponible)
  const swapExtras = computeSwapExtrasV2(boxId, selectedProducts, variant, priceLookup);
  
  if (isACarta) {
    const aCartaPrice = computeACartaPrice(selectedProducts, priceLookup);
    const savings = aCartaPrice - boxBasePrice;
    return {
      price: aCartaPrice,
      isACarta: true,
      extras: 0, // Si es A la Carta, los extras ya están incluidos en el precio
      savings: savings > 0 ? savings : undefined,
    };
  }
  
  return {
    price: boxBasePrice,
    isACarta: false,
    extras: swapExtras,
  };
}
