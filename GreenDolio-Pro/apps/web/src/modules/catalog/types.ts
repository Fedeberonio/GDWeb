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
  nutrition?: {
    vegan?: boolean;
    glutenFree?: boolean;
    organic?: boolean;
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
  heroImage?: string;
  isFeatured: boolean;
  variants: BoxVariant[];
};
