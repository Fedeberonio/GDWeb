import { Suspense } from "react";
import { fetchBoxes, fetchProducts } from "@/modules/catalog/api";
import { BuilderClient } from "./builder-client";

export const dynamic = "force-dynamic";

export default async function BoxBuilderPage() {
  const boxes = await fetchBoxes();
  const products = await fetchProducts();
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <BuilderClient boxes={boxes} products={products} />
    </Suspense>
  );
}
