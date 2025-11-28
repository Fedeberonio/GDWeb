import { apiFetch } from "@/lib/api/client";

export type BuilderValidationPayload = {
  boxId: string;
  selectedProducts: Record<string, number>;
  mix?: "mix" | "frutas" | "vegetales";
  likes?: string[];
  dislikes?: string[];
  notes?: string;
  deliveryZone?: string;
  deliveryDay?: string;
};

export type BuilderValidationResult = {
  boxId: string;
  valid: boolean;
  issues: {
    errors: string[];
    warnings: string[];
  };
  metrics: {
    slotsUsed: number;
    slotBudget?: number;
    weightUsedKg: number;
    targetWeightKg?: number;
    costEstimate: number;
    productCount: number;
  };
};

export async function validateBuilderSelection(payload: BuilderValidationPayload) {
  return apiFetch<BuilderValidationResult>("/boxes/validate", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export type BuilderRequestPayload = BuilderValidationPayload & {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
};

export type BuilderRequestResponse = {
  id: string;
  metrics: BuilderValidationResult["metrics"];
  issues: BuilderValidationResult["issues"];
};

export async function submitBuilderRequest(payload: BuilderRequestPayload) {
  return apiFetch<BuilderRequestResponse>("/boxes/requests", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}
