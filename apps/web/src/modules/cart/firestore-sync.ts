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
 * Convierte un array de CartItems al formato de Firestore
 */
export function cartItemsToFirestore(items: CartItem[]): CartItemFromFirestore[] {
  return items.map(cartItemToFirestore);
}
