
import { Box, Product, ProductCategory } from "./types";

export const MOCK_CATEGORIES: ProductCategory[] = [
    { id: "vegetables", name: { es: "Vegetales", en: "Vegetables" }, slug: "vegetables", sortOrder: 1, status: "active" },
    { id: "fruits", name: { es: "Frutas", en: "Fruits" }, slug: "fruits", sortOrder: 2, status: "active" },
];

export const MOCK_BOXES: Box[] = [
    {
        id: "box-1",
        name: { es: "Caja Semanal", en: "Weekly Box" },
        slug: "caja-semanal",
        description: { es: "Nuestra selección semanal de frutas y verduras frescas.", en: "Our weekly selection of fresh fruits and vegetables." },
        price: { amount: 1500, currency: "DOP" },
        heroImage: "/legacy/assets/box1.jpeg",
        variants: [],
        isFeatured: true,
    },
];

export const MOCK_PRODUCTS: Product[] = [
    {
        id: "prod-1",
        name: { es: "Tomate", en: "Tomato" },
        slug: "tomate",
        description: { es: "Tomate fresco de granja.", en: "Fresh farm tomato." },
        price: { amount: 50, currency: "DOP" },
        unit: { es: "lb", en: "lb" },
        categoryId: "vegetables",
        image: "/legacy/assets/tomate.png",
        status: "active",
        tags: [],
        isFeatured: false,
    },
];
