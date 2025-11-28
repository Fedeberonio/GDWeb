import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

// Datos estáticos de fallback
const staticCategories = [
  {
    id: "cajas",
    slug: "cajas",
    name: {
      es: "Cajas",
      en: "Boxes",
    },
    description: {
      es: "Selección curada de cajas Green Dolio",
      en: "Curated Green Dolio boxes",
    },
    sortOrder: 0,
    status: "active" as const,
  },
  {
    id: "frutas",
    slug: "frutas",
    name: {
      es: "Frutas",
      en: "Fruits",
    },
    description: {
      es: "Frutas frescas de temporada",
      en: "Seasonal fresh fruits",
    },
    sortOrder: 1,
    status: "active" as const,
  },
  {
    id: "vegetales",
    slug: "vegetales",
    name: {
      es: "Vegetales",
      en: "Vegetables",
    },
    description: {
      es: "Vegetales y raíces",
      en: "Vegetables and roots",
    },
    sortOrder: 2,
    status: "active" as const,
  },
  {
    id: "productos-caseros",
    slug: "productos-caseros",
    name: {
      es: "Productos caseros",
      en: "Homemade products",
    },
    description: {
      es: "Hummus, dips y más",
      en: "Hummus, dips and more",
    },
    sortOrder: 3,
    status: "active" as const,
  },
  {
    id: "jugos-naturales",
    slug: "jugos-naturales",
    name: {
      es: "Jugos naturales",
      en: "Natural juices",
    },
    description: {
      es: "Jugos prensados y smoothies",
      en: "Cold press juices and smoothies",
    },
    sortOrder: 4,
    status: "active" as const,
  },
  {
    id: "productos-de-granja",
    slug: "productos-de-granja",
    name: {
      es: "Productos de granja",
      en: "Farm products",
    },
    description: {
      es: "Huevos, miel y más",
      en: "Eggs, honey and more",
    },
    sortOrder: 5,
    status: "active" as const,
  },
  {
    id: "hierbas-y-especias",
    slug: "hierbas-y-especias",
    name: {
      es: "Hierbas y especias",
      en: "Herbs and spices",
    },
    description: {
      es: "Hierbas frescas y especias",
      en: "Fresh herbs and spices",
    },
    sortOrder: 6,
    status: "active" as const,
  },
  {
    id: "otros",
    slug: "otros",
    name: {
      es: "Otros",
      en: "Others",
    },
    description: {
      es: "Granos, aceites y complementos",
      en: "Grains, oils and pantry items",
    },
    sortOrder: 7,
    status: "active" as const,
  },
];

export async function GET() {
  // Durante build time, usar datos estáticos directamente
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
    return NextResponse.json({ data: staticCategories });
  }

  try {
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

    // Si no hay URL de API configurada, usar datos estáticos
    if (!NEXT_PUBLIC_API_BASE_URL || NEXT_PUBLIC_API_BASE_URL.includes("localhost")) {
      return NextResponse.json({ data: staticCategories });
    }

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/catalog/categories`, {
      cache: "force-cache",
      signal: AbortSignal.timeout(2000), // Timeout de 2 segundos
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // Si falla, usar datos estáticos
    console.warn("Failed to fetch categories from API, using static data:", error);
    return NextResponse.json({ data: staticCategories });
  }
}
