import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

export type OrderData = {
  userId: string;
  cliente: string;
  telefono: string;
  email?: string;
  direccion: string;
  diaEntrega: string;
  observaciones?: string;
  metodoPago: string;
  items: any[];
  total: number;
  totalUSD?: number;
  paypalLink?: string;
  estado: string;
  [key: string]: any; // Permitir campos adicionales
};

export async function saveOrderToFirestore(
  db: Firestore,
  orderData: OrderData
): Promise<string> {
  try {
    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      fecha: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar pedido en Firestore:", error);
    throw error;
  }
}
