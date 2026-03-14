import type { Box, ProductCategory } from "./schemas";

export const productCategories: ProductCategory[] = [
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
    status: "active",
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
    status: "active",
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
    status: "active",
  },
  {
    id: "ensaladas",
    slug: "ensaladas",
    name: {
      es: "Ensaladas",
      en: "Salads",
    },
    description: {
      es: "Ensaladas listas para disfrutar",
      en: "Ready-to-eat salads",
    },
    sortOrder: 3,
    status: "active",
  },
  {
    id: "jugos",
    slug: "jugos",
    name: {
      es: "Jugos naturales",
      en: "Natural juices",
    },
    description: {
      es: "Jugos prensados y smoothies",
      en: "Cold press juices and smoothies",
    },
    sortOrder: 4,
    status: "active",
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
    status: "active",
  },
  {
    id: "hierbas-y-especias",
    slug: "hierbas-y-especias",
    name: {
      es: "Hierbas y especias",
      en: "Herbs and spices",
    },
    description: {
      es: "Hierbas frescas y especias aromáticas",
      en: "Fresh herbs and aromatic spices",
    },
    sortOrder: 6,
    status: "active",
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
    status: "active",
  },
];

export const boxes: Box[] = [
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
    ruleId: "GD-CAJA-001",
    dimensionsLabel: "8\" x 8\" x 8\"",
    weightLabel: "7.7 lb (3.5 kg)",
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
    ruleId: "GD-CAJA-002",
    dimensionsLabel: "10\" x 10\" x 10\"",
    weightLabel: "13.2 lb (6 kg)",
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
    slug: "all-greenxclusive",
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
    ruleId: "GD-CAJA-003",
    dimensionsLabel: "12\" x 12\" x 12\"",
    weightLabel: "26.4 lb (12 kg)",
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
