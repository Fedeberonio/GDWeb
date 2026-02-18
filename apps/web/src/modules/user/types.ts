export type UserProfile = {
  displayName: string;
  email: string;
  telefono?: string;
  direccion?: string;
  pagoPreferido?: "Cash" | "Transferencia" | "PayPal";
  likes?: string;
  dislikes?: string;
  comoNosConocio?: string;
  fechaCreacion?: Date;
  carrito?: CartItemFromFirestore[];
  returnStats?: {
    totalReturns: number;
    qualifiesForSpecialReward: boolean;
    lastReturnAt?: Date | string;
  };
  returnHistory?: Array<{
    orderId: string;
    returnedAt: Date | string;
    discountAmount: number;
  }>;
};

export type CartItemFromFirestore = {
  slug: string;
  tipo: "caja" | "producto";
  nombre: string;
  precio: number;
  variedad?: string;
  preferencias?: {
    like: string[];
    dislike: string[];
  };
  cantidad: number;
  autoMode?: boolean;
  notas?: string;
  ingredientesExcluidos?: string[];
};
