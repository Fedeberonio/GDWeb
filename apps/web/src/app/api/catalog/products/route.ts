import { NextResponse } from "next/server";
import { fetchProducts } from "@/modules/catalog/api";

export async function GET() {
  try {
    const data = await fetchProducts();

    // Public storefront must not expose internal ingredient SKUs or items without sellable price.
    const sellableProducts = data.filter((product) => {
      const categoryId = (product.categoryId ?? "").toLowerCase();
      const skuOrId = String(product.sku ?? product.id ?? "").toUpperCase();
      const status = String(product.status ?? (product.isActive ? "active" : "inactive")).toLowerCase();
      const price = Number(product.price);

      const isInternalIngredient =
        categoryId === "ingredientes" || skuOrId.startsWith("GD-ING-") || skuOrId.startsWith("GD-INGR-");

      return status === "active" && Number.isFinite(price) && price > 0 && !isInternalIngredient;
    });

    return NextResponse.json({ data: sellableProducts }, { status: 200 });
  } catch (error) {
    console.warn("Failed to fetch products from Firestore:", error);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 502 });
  }
}
