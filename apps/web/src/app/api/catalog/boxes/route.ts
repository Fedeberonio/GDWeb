import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";

// Datos estáticos de fallback
const staticBoxes = [
  {
    id: "box-1",
    slug: "caribbean-fresh-pack",
    name: {
      es: "Caribbean fresh pack",
      en: "Caribbean fresh pack",
    },
    description: {
      es: "Ideal para 3 días de comidas balanceadas",
      en: "Perfect for 3 days of balanced meals",
    },
    price: {
      amount: 650,
      currency: "DOP",
    },
    durationDays: 3,
    heroImage: "/images/boxes/box1.jpg",
    isFeatured: true,
    variants: [
      {
        id: "mix",
        slug: "mix",
        name: {
          es: "Mix",
          en: "Mix",
        },
        description: {
          es: "Balance ideal de frutas y vegetales",
          en: "Balanced mix of fruits and vegetables",
        },
        highlights: [],
        referenceContents: [],
      },
      {
        id: "fruity",
        slug: "fruity",
        name: {
          es: "Fruity",
          en: "Fruity",
        },
        description: {
          es: "Pensado para desayunos y batidos",
          en: "Perfect for breakfasts and smoothies",
        },
        highlights: [],
        referenceContents: [],
      },
      {
        id: "veggie",
        slug: "veggie",
        name: {
          es: "Veggie",
          en: "Veggie",
        },
        description: {
          es: "Vegetales listos para meal prep",
          en: "Meal-prep ready vegetables",
        },
        highlights: [],
        referenceContents: [],
      },
    ],
  },
  {
    id: "box-2",
    slug: "island-weekssential",
    name: {
      es: "Island weekssential",
      en: "Island weekssential",
    },
    description: {
      es: "Hasta una semana de recetas frescas",
      en: "Up to a week of fresh recipes",
    },
    price: {
      amount: 990,
      currency: "DOP",
    },
    durationDays: 7,
    heroImage: "/images/boxes/box2.jpg",
    isFeatured: true,
    variants: [
      {
        id: "mix",
        slug: "mix",
        name: {
          es: "Mix",
          en: "Mix",
        },
        description: {
          es: "Balance ideal de frutas y vegetales",
          en: "Balanced mix of fruits and vegetables",
        },
        highlights: [],
        referenceContents: [],
      },
      {
        id: "fruity",
        slug: "fruity",
        name: {
          es: "Fruity",
          en: "Fruity",
        },
        description: {
          es: "Desayunos, smoothies y snacks dulces",
          en: "Breakfast, smoothies and sweet snacks",
        },
        highlights: [],
        referenceContents: [],
      },
      {
        id: "veggie",
        slug: "veggie",
        name: {
          es: "Veggie",
          en: "Veggie",
        },
        description: {
          es: "Vegetales para meal prep semanal",
          en: "Vegetables for weekly meal prep",
        },
        highlights: [],
        referenceContents: [],
      },
    ],
  },
  {
    id: "box-3",
    slug: "allgreenxclusive",
    name: {
      es: "All greenxclusive",
      en: "All greenxclusive",
    },
    description: {
      es: "Hasta dos semanas de frutas y vegetales",
      en: "Up to two weeks of fruits and vegetables",
    },
    price: {
      amount: 1990,
      currency: "DOP",
    },
    durationDays: 14,
    heroImage: "/images/boxes/box3.jpg",
    isFeatured: true,
    variants: [
      {
        id: "mix",
        slug: "mix",
        name: {
          es: "Mix",
          en: "Mix",
        },
        description: {
          es: "Selección súper completa frutas + veggies",
          en: "Super complete mix of fruits and veggies",
        },
        highlights: [],
        referenceContents: [],
      },
      {
        id: "fruity",
        slug: "fruity",
        name: {
          es: "Fruity",
          en: "Fruity",
        },
        description: {
          es: "Frutas premium para licuados y postres",
          en: "Premium fruits for smoothies and desserts",
        },
        highlights: [],
        referenceContents: [],
      },
      {
        id: "veggie",
        slug: "veggie",
        name: {
          es: "Veggie",
          en: "Veggie",
        },
        description: {
          es: "Vegetales variados para grandes preparaciones",
          en: "Varied vegetables for big meal preps",
        },
        highlights: [],
        referenceContents: [],
      },
    ],
  },
];

export async function GET() {
  // Durante build time, usar datos estáticos directamente
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
    return NextResponse.json({ data: staticBoxes });
  }

  try {
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

    // Si no hay URL de API configurada, usar datos estáticos
    if (!NEXT_PUBLIC_API_BASE_URL || NEXT_PUBLIC_API_BASE_URL.includes("localhost")) {
      return NextResponse.json({ data: staticBoxes });
    }

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/catalog/boxes`, {
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
    console.warn("Failed to fetch boxes from API, using static data:", error);
    return NextResponse.json({ data: staticBoxes });
  }
}

