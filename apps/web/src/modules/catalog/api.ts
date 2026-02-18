import { collection, getDocs, query, where } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase/client";

import type { Box, BoxRule, Product, ProductCategory } from "./types";
import { resolveLocalizedField } from "./localization";

const COLLECTIONS = {
  categories: "catalog_categories",
  products: "catalog_products",
  boxes: "catalog_boxes",
  boxRules: "catalog_box_rules",
};
// Confirmed: Collections match seeded data (catalog_*)

export async function fetchProductCategories() {
  try {
    const db = getFirestoreDb();
    if (!db) return [];

    const snapshot = await getDocs(query(collection(db, COLLECTIONS.categories)));

    const categories = snapshot.docs.map((doc) => {
      const data = doc.data() as ProductCategory & Record<string, unknown>;
      const name = resolveLocalizedField(data, "name");
      const description = data.description ? resolveLocalizedField(data, "description") : undefined;
      const displayOrderRaw = (data as { displayOrder?: number; sortOrder?: number }).displayOrder;
      const sortOrderRaw = (data as { displayOrder?: number; sortOrder?: number }).sortOrder;
      const order =
        typeof displayOrderRaw === "number"
          ? displayOrderRaw
          : typeof sortOrderRaw === "number"
            ? sortOrderRaw
            : Number.MAX_SAFE_INTEGER;

      return {
        ...data,
        id: doc.id,
        name,
        description,
        sortOrder: order,
      };
    }) as ProductCategory[];

    return categories.sort((a, b) => {
      const left = typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
      const right = typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
      return left - right;
    });
  } catch (error) {
    console.error("Error fetching categories from Firestore:", error);
    return [];
  }
}

export async function fetchBoxes() {
  try {
    const db = getFirestoreDb();
    if (!db) return [];

    // Filter by isFeatured as per repository listBoxes
    const q = query(
      collection(db, COLLECTIONS.boxes),
      where("isFeatured", "==", true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data() as Box & Record<string, unknown>;
      const name = resolveLocalizedField(data, "name");
      const description = data.description ? resolveLocalizedField(data, "description") : undefined;
      const descriptionFallbacks: Record<string, string> = {
        "GD-CAJA-001": "Box for 3 days with a mix of fresh fruits and vegetables. Ideal for couples or solo.",
        "GD-CAJA-002": "Weekly box with a complete variety of fruits and vegetables. Perfect for small families.",
        "GD-CAJA-003": "Biweekly box with abundant assortments. Ideal for large families or meal prep.",
      };
      const localizedDescription = description ? { ...description } : { es: "", en: "" };
      if (descriptionFallbacks[doc.id]) {
        const needsEnglish =
          !localizedDescription.en || localizedDescription.en === localizedDescription.es;
        if (needsEnglish) {
          localizedDescription.en = descriptionFallbacks[doc.id];
        }
      }

      if (!name.es || !name.en) {
        console.warn(`Box ${doc.id} missing localized name`, { es: name.es, en: name.en });
      }
      if (!localizedDescription.es || !localizedDescription.en) {
        console.warn(`Box ${doc.id} missing localized description`, {
          es: localizedDescription.es,
          en: localizedDescription.en,
        });
      }

      return {
        ...data,
        id: doc.id,
        name,
        description: localizedDescription,
      } as Box;
    });
  } catch (error) {
    console.error("Error fetching boxes from Firestore:", error);
    return [];
  }
}

export async function fetchProducts() {
  try {
    const db = getFirestoreDb();
    if (!db) return [];

    const snapshot = await getDocs(collection(db, COLLECTIONS.products));

    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const sku = doc.id;
        const productBase = data as Product;
        const name = resolveLocalizedField(data, "name");
        const description = data.description ? resolveLocalizedField(data, "description") : undefined;
        const rawUnit = data.unit as Record<string, string> | string | undefined;
        const unitEs = (data as { unit_es?: string; unitEs?: string }).unit_es ?? (data as { unitEs?: string }).unitEs;
        const unitEn = (data as { unit_en?: string; unitEn?: string }).unit_en ?? (data as { unitEn?: string }).unitEn;
        const unit =
          typeof rawUnit === "object" || unitEs || unitEn
            ? resolveLocalizedField(data, "unit")
            : (rawUnit as string | undefined);

        // Silently handle missing localizations
        if (!name.es || !name.en) {
          // just ensure fallbacks exist in resolveLocalizedField or here if critical
        }

        return {
          ...productBase,
          id: sku,
          slug: productBase.slug || sku,
          sku,
          name,
          description,
          unit: unit as Product["unit"],
          image:
            productBase.image ||
            (data as { image_url?: string }).image_url ||
            `/assets/images/products/${sku}.png`,
        } as Product;
      })
      .filter((product) => product.status !== "hidden");
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return [];
  }
}

export async function fetchBoxRules() {
  try {
    const db = getFirestoreDb();
    if (!db) return [];

    const snapshot = await getDocs(collection(db, COLLECTIONS.boxRules));

    return snapshot.docs.map(doc => {
      const data = doc.data() as BoxRule & {
        baseContents?: Array<{ productSku?: string; productSlug?: string; quantity: number }>;
        variantContents?: Partial<Record<"mix" | "fruity" | "veggie", Array<{ productSku?: string; productSlug?: string; quantity: number }>>>;
      };

      const normalizeContents = (contents?: Array<{ productSku?: string; productSlug?: string; quantity: number }>) =>
        contents?.map((item) => ({
          productSku: item.productSku ?? item.productSlug ?? "",
          quantity: item.quantity,
        })) ?? [];

      const variantContents = data.variantContents
        ? {
          mix: data.variantContents.mix ? normalizeContents(data.variantContents.mix) : undefined,
          fruity: data.variantContents.fruity ? normalizeContents(data.variantContents.fruity) : undefined,
          veggie: data.variantContents.veggie ? normalizeContents(data.variantContents.veggie) : undefined,
        }
        : undefined;

      return {
        ...data,
        id: doc.id,
        baseContents: normalizeContents(data.baseContents),
        variantContents,
      };
    }) as BoxRule[];
  } catch (error) {
    console.error("Error fetching box rules from Firestore:", error);
    return [];
  }
}
