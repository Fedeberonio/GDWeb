import { translations } from "@/modules/i18n/translations";
import type { Locale } from "@/modules/i18n/locales";
import type { BoxVariant } from "@/modules/catalog/types";

// Función para determinar categoría visual basada en el nombre del producto
export function getVisualCategory(slug: string, name: string, catalogCategory?: string): string {
  const nameLower = name.toLowerCase();
  const catalogLower = catalogCategory?.toLowerCase() || "";
  
  // Mapeo específico por nombre
  if (nameLower.includes("lechuga") || nameLower.includes("espinaca") || nameLower.includes("acelga") || nameLower.includes("repollo")) {
    return "leafy";
  }
  if (nameLower.includes("limón") || nameLower.includes("limon") || nameLower.includes("naranja") || nameLower.includes("toronja")) {
    return "citrus";
  }
  if (nameLower.includes("ajo") || nameLower.includes("cebolla") || nameLower.includes("cilantro") || nameLower.includes("perejil") || nameLower.includes("jengibre") || nameLower.includes("apio")) {
    return "aromatic";
  }
  if (
    nameLower.includes("zanahoria") ||
    nameLower.includes("batata") ||
    nameLower.includes("yuca") ||
    nameLower.includes("papas") ||
    nameLower.includes("papa") ||
    nameLower.includes("patata") ||
    nameLower.includes("yautia") ||
    nameLower.includes("ñame") ||
    nameLower.includes("malanga") ||
    nameLower.includes("calabaza")
  ) {
    return "root";
  }
  if (nameLower.includes("mango") || nameLower.includes("piña") || nameLower.includes("pina") || nameLower.includes("aguacate") || nameLower.includes("papaya") || nameLower.includes("lechosa") || nameLower.includes("banana") || nameLower.includes("platano")) {
    return "fruit_large";
  }
  if (nameLower.includes("chinola") || nameLower.includes("fresa") || nameLower.includes("mora")) {
    return "fruit_small";
  }

  // Mapeo por categoría del catálogo/metadata
  if (catalogLower.includes("frut")) {
    return "fruit_large";
  }
  if (catalogLower.includes("citr")) {
    return "citrus";
  }
  if (catalogLower.includes("hoja") || catalogLower.includes("leaf")) {
    return "leafy";
  }
  if (catalogLower.includes("hierb") || catalogLower.includes("arom") || catalogLower.includes("especia")) {
    return "aromatic";
  }
  if (catalogLower.includes("tuberc") || catalogLower.includes("raiz") || catalogLower.includes("raíz") || catalogLower.includes("veget")) {
    return "root";
  }
  
  return "otros";
}

export type VariantComposition = {
  aromatic: number;
  leafy: number;
  fruit: number;
  root: number;
  citrus: number;
  total: number;
};

export type VariantType = "mix" | "fruity" | "veggie";

/**
 * Calcula la composición de una variante basándose en el contenido base
 */
export function calculateVariantComposition(
  baseContents: Array<{ productSku: string; quantity: number; name: string }>
): VariantComposition {
  const counts: VariantComposition = {
    aromatic: 0,
    leafy: 0,
    fruit: 0,
    root: 0,
    citrus: 0,
    total: 0,
  };

  baseContents.forEach((item) => {
    const category = getVisualCategory(item.productSku, item.name);
    const quantity = item.quantity;

    // Para todas las variantes, contar todas las categorías del contenido base
    // La diferencia está en cómo se presenta, no en el filtrado real
    if (category === "aromatic") {
      counts.aromatic += quantity;
      counts.total += quantity;
    } else if (category === "leafy") {
      counts.leafy += quantity;
      counts.total += quantity;
    } else if (category === "fruit_large" || category === "fruit_small") {
      counts.fruit += quantity;
      counts.total += quantity;
    } else if (category === "root") {
      counts.root += quantity;
      counts.total += quantity;
    } else if (category === "citrus") {
      counts.citrus += quantity;
      counts.total += quantity;
    } else {
      // Otros productos también cuentan
      counts.total += quantity;
    }
  });

  return counts;
}

/**
 * Obtiene la descripción y tagline de una variante
 */
export function getVariantInfo(
  variant: VariantType,
  locale: Locale = "es",
  variantData?: BoxVariant | null,
): { tagline: string; description: string; icon: VariantType } {
  const info = {
    mix: {
      tagline: translations[locale]["variants.mix_tagline"],
      description: translations[locale]["variants.mix_description"],
      icon: "mix" as const,
    },
    fruity: {
      tagline: translations[locale]["variants.fruity_tagline"],
      description: translations[locale]["variants.fruity_description"],
      icon: "fruity" as const,
    },
    veggie: {
      tagline: translations[locale]["variants.veggie_tagline"],
      description: translations[locale]["variants.veggie_description"],
      icon: "veggie" as const,
    },
  };

  const defaults = info[variant];
  const localizedName = variantData?.name?.[locale] ?? variantData?.name?.es ?? variantData?.name?.en;
  const localizedDescription =
    variantData?.description?.[locale] ?? variantData?.description?.es ?? variantData?.description?.en;

  return {
    tagline: localizedName || defaults.tagline,
    description: localizedDescription || defaults.description,
    icon: defaults.icon,
  };
}
