export type CartItemType = "product" | "box";

export type BoxConfiguration = {
  boxId: string;
  mix?: "mix" | "frutas" | "vegetales";
  variant?: "mix" | "fruity" | "veggie";
  selectedProducts: Record<string, number>;
  likes: string[];
  dislikes: string[];
  notes?: string;
  deliveryZone?: string;
  deliveryDay?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  price: {
    base: number;
    extras: number;
    final: number;
    isACarta: boolean;
  };
};

export type CartItem = {
  slug: string;
  name: string;
  type: CartItemType;
  quantity: number;
  slotValue: number;
  weightKg: number;
  price: number;
  image?: string;
  configuration?: BoxConfiguration;
};

export type CartMetrics = {
  totalSlots: number;
  totalWeightKg: number;
  totalCost: number;
  itemCount: number;
};
