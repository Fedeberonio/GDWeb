export type SupplyMeta = {
  material?: string;
  dimensions?: string;
  capacity?: string;
  notes?: string;
};

export type Supply = {
  id: string;
  name: string;
  category: "Packaging" | "Glass" | "Labels" | "Ingredients" | "Other";
  unit?: string;
  supplier?: string;
  imageUrl?: string;
  unitPrice?: number;
  currency?: string;
  stock: number;
  minStock: number;
  isReturnable: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
