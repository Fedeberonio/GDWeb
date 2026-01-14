import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

import type { UserProfile, CartItemFromFirestore } from "./types";

export async function getUserProfile(
  db: Firestore,
  userId: string
): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    return null;
  }
}

export async function createUserProfile(
  db: Firestore,
  userId: string,
  profile: Omit<UserProfile, "fechaCreacion">
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...profile,
      fechaCreacion: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al crear perfil de usuario:", error);
    throw error;
  }
}

export async function updateUserProfile(
  db: Firestore,
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error("Error al actualizar perfil de usuario:", error);
    throw error;
  }
}

export async function syncCartToFirestore(
  db: Firestore,
  userId: string,
  cart: CartItemFromFirestore[]
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      carrito: cart,
    });
  } catch (error) {
    console.error("Error al sincronizar carrito con Firestore:", error);
    // No lanzar error para no bloquear la UX
  }
}
