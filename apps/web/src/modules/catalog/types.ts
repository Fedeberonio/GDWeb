export type LocaleCode = "es" | "en";

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

export type Product = {
  id: string;
  slug: string;
  sku?: string;
  name: LocalizedString;
  description?: Partial<LocalizedString>;
  unit?: Partial<LocalizedString>;
  categoryId: string;
  price: Price;
  salePrice?: Price;
  status: "active" | "inactive" | "coming_soon" | "discontinued";
  image?: string;
  tags: string[];
  isFeatured: boolean;
  metadata?: {
    slotValue?: number;
    wholesaleCost?: number;
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
};

export type BoxRule = {
  id: string;
  displayName: string;
  slotBudget: number;
  targetWeightKg: number;
  minMargin?: number;
  categoryBudget: Record<string, { min: number; max: number }>;
  baseContents: Array<{ productSlug: string; quantity: number }>;
  variantContents?: Partial<Record<"mix" | "fruity" | "veggie", Array<{ productSlug: string; quantity: number }>>>;
};

export type Combo = {
  id: string;
  name: LocalizedString;
  salad: LocalizedString;
  juice: LocalizedString;
  dessert: LocalizedString;
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
