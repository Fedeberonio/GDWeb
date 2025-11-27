export type BuilderRequestMetrics = {
  slotsUsed: number;
  slotBudget?: number;
  weightUsedKg: number;
  targetWeightKg?: number;
  costEstimate: number;
  productCount: number;
};

export type BoxBuilderRequestStatus = "pending" | "confirmed" | "cancelled";

export type BoxBuilderRequest = {
  id: string;
  boxId: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone: string;
  deliveryZone?: string | null;
  deliveryDay?: string | null;
  mix?: "mix" | "frutas" | "vegetales" | null;
  likes: string[];
  dislikes: string[];
  notes?: string;
  selection: Record<string, number>;
  metrics: BuilderRequestMetrics;
  status: BoxBuilderRequestStatus;
  createdAt?: string;
};
