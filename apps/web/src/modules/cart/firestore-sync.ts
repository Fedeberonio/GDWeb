import type { CartItem } from "./types";
import type { CartItemFromFirestore } from "@/modules/user/types";

/**
 * Convierte un CartItem del formato actual al formato de Firestore
 */
export function cartItemToFirestore(item: CartItem): CartItemFromFirestore {
  if (item.type === "box" && item.configuration) {
    const likes = item.configuration.likes ?? [];
    const dislikes = item.configuration.dislikes ?? [];
    return {
      slug: item.slug,
      tipo: "caja",
      nombre: item.name,
      precio: item.configuration.price?.final ?? item.price,
      variedad: item.configuration.variant || item.configuration.mix || "mix",
      preferencias: {
        like: likes,
        dislike: dislikes,
      },
      cantidad: item.quantity,
      autoMode: likes.length === 0 && dislikes.length === 0,
    };
  }

  const base: CartItemFromFirestore = {
    slug: item.slug,
    tipo: "producto",
    nombre: item.name,
    precio: item.price,
    cantidad: item.quantity,
  };
  if (item.notes) {
    base.notas = item.notes;
  }
  if (item.excludedIngredients?.length) {
    base.ingredientesExcluidos = item.excludedIngredients;
  }
  return base;
}

/**
 * Convierte un CartItem desde Firestore al formato actual del carrito
 */
export function firestoreToCartItem(item: CartItemFromFirestore): CartItem {
  if (item.tipo === "caja") {
    const isMix = item.variedad === "mix";
    const isFruity = item.variedad === "fruity" || item.variedad === "frutas";
    const isVeggie = item.variedad === "veggie" || item.variedad === "vegetales";

    const variantResolved = isFruity ? "fruity" : isVeggie ? "veggie" : "mix";
    const mixResolved = isFruity ? "frutas" : isVeggie ? "vegetales" : "mix";

    return {
      slug: item.slug,
      name: item.nombre,
      type: "box",
      quantity: item.cantidad,
      price: item.precio,
      slotValue: 0,
      weightKg: 0,
      configuration: {
        boxId: item.slug, // Assumes slug matches ID for boxes in this simple mapping
        variant: variantResolved,
        mix: mixResolved,
        selectedProducts: {},
        likes: item.preferencias?.like || [],
        dislikes: item.preferencias?.dislike || [],
        price: {
          base: item.precio,
          extras: 0,
          final: item.precio,
          isACarta: false,
        },
      },
    };
  }

  return {
    slug: item.slug,
    name: item.nombre,
    type: "product",
    quantity: item.cantidad,
    price: item.precio,
    slotValue: 0, // Fallback if not provided, usually hydrated by UI
    weightKg: 0,
    notes: item.notas,
    excludedIngredients: item.ingredientesExcluidos,
  };
}

/**
 * Convierte un array de CartItems al formato de Firestore
 */
export function cartItemsToFirestore(items: CartItem[]): CartItemFromFirestore[] {
  return items.map(cartItemToFirestore);
}

/**
 * Convierte un array de CartItems desde Firestore
 */
export function firestoreToCartItems(items: CartItemFromFirestore[]): CartItem[] {
  return items.map(firestoreToCartItem);
}
