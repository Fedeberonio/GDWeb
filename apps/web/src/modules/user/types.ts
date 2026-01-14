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
};

export type CartItemFromFirestore = {
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
};
