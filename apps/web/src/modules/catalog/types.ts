export type LocaleCode = "es" | "en";

/**
 * Localized display strings. Matches API/Firestore shape: { es, en }.
 * Used for product/box/combo names and descriptions (no name_es/name_en legacy).
 */
export type LocalizedString = {
  es: string;
  en: string;
};

export type Price = {
  amount: number;
  currency: string;
};

export type ProductCategory = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: Partial<LocalizedString>;
  sortOrder: number;
  status: "active" | "inactive";
};

export type ProductType = "simple" | "box" | "salad" | "prepared";

export interface RecipeIngredient {
  productId?: string;  // ID de producto (GD-VEGE-053)
  supplyId?: string;   // ID de insumo (GD-SUPP-001)
  quantity: number;
  unit: string;
  name?: LocalizedString;
}

export interface Recipe {
  yields: number;
  ingredients: RecipeIngredient[];
}

/**
 * Product from catalog API. `name` (and optional `description`, `unit`) use LocalizedString
 * { es, en } — aligned with API catalog schema and gd-locale for SSR/CSR.
 */
export type Product = {
  id: string;
  slug: string;
  sku?: string;
  name: LocalizedString;
  description?: LocalizedString;
  unit?: string | LocalizedString;
  attributes?: {
    marketingTier?: string;
    duration?: string;
    unitSize?: string;
  };
  isActive: boolean;
  categoryId?: string;
  price: number;
  salePrice?: number;
  status?: "active" | "inactive" | "coming_soon" | "discontinued" | "hidden";
  type?: ProductType;
  recipe?: Recipe;
  image?: string;
  tags?: string[];
  isFeatured?: boolean;
  metadata?: {
    slotValue?: number;
    wholesaleCost?: number;
    stock?: number;
    minStock?: number;
    billOfMaterials?: Array<{
      supplyId: string;
      name: string;
      quantity: number;
    }>;
  };
  presentation?: {
    benefit?: Partial<LocalizedString>;
    benefitDetail?: Partial<LocalizedString>;
    vitamins?: {
      vitaminA?: string;
      vitaminC?: string;
    };
  };
  nutrition?: {
    vegan?: boolean;
    glutenFree?: boolean;
    organic?: boolean;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    fiber?: number;
    sugars?: number;
    detailDescription?: Partial<LocalizedString>;
    detailIngredients?: string[];
    detailBenefits?: string[];
    detailPerfectFor?: Partial<LocalizedString>;
    detailNote?: Partial<LocalizedString>;
  };
  logistics?: {
    weightKg?: number;
    dimensionsCm?: {
      length: number;
      width: number;
      height: number;
    };
    storage?: Partial<LocalizedString>;
  };
};

export type BoxVariant = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: Partial<LocalizedString>;
  highlights: Partial<LocalizedString>[];
  referenceContents: Array<{
    productId?: string;
    name: LocalizedString;
    quantity?: string;
  }>;
};

export type Box = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: Partial<LocalizedString>;
  price: Price;
  durationDays?: number;
  ruleId?: string;
  dimensionsLabel?: string;
  weightLabel?: string;
  heroImage?: string;
  isFeatured: boolean;
  variants: BoxVariant[];
  metadata?: {
    billOfMaterials?: Array<{
      supplyId: string;
      name: string;
      quantity: number;
    }>;
  };
};

export type BoxRule = {
  id: string;
  displayName: string;
  slotBudget: number;
  targetWeightKg: number;
  minMargin?: number;
  categoryBudget: Record<string, { min: number; max: number }>;
  baseContents: Array<{ productSku: string; quantity: number }>;
  variantContents?: Partial<Record<"mix" | "fruity" | "veggie", Array<{ productSku: string; quantity: number }>>>;
};

export type Salad = {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  cost?: number;
  margin?: number;
  calories: number;
  protein: number;
  glutenFree: boolean;
  benefit: LocalizedString;
  benefitDetail: LocalizedString;
  recommendedFor: LocalizedString;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  vitaminA?: string;
  vitaminC?: string;
  image?: string;
  ingredients: LocalizedString[];
  status: "active" | "inactive" | "coming_soon";
  isFeatured: boolean;
};

export type BoxDefinition = {
  id: string;
  variants: Array<{
    name: string;
    items: Array<{
      product: string;
      quantity: number;
    }>;
  }>;
};

/** @deprecated Use Salad instead */
export type Combo = Salad;
