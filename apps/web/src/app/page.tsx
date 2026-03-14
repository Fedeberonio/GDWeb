import { PrimaryNav } from "./_components/primary-nav";
import { HomePageClient } from "./_components/home-page-client";
import { Footer } from "./_components/footer";

import { Container } from "./_components/container";
import { RecienPreparadoSection } from "./_components/recien-preparado-section";
import { BoxesGrid } from "./_components/boxes-grid";
import { UnifiedCatalogSection } from "./_components/unified-catalog-section";
import { HomeSections } from "./_components/home-sections";
import {
  fetchProductCategories,
  fetchBoxes,
  fetchProducts,
  fetchBoxRules,
} from "@/modules/catalog/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [categories, boxes, products, boxRules] = await Promise.all([
    fetchProductCategories(),
    fetchBoxes(),
    fetchProducts(),
    fetchBoxRules(),
  ]);

  const productMap = new Map();
  products.forEach((product) => {
    if (product.slug) productMap.set(product.slug, product);
    if (product.sku) productMap.set(product.sku, product);
    productMap.set(product.id, product);
  });
  const rulesById = new Map(boxRules.map((rule) => [rule.id, rule]));

  const prebuiltBoxes = boxes.map((box) => {
    const ruleKey = box.ruleId ?? box.id ?? box.slug;
    const rule = ruleKey ? rulesById.get(ruleKey) : undefined;
    return {
      box,
      rule,
      baseContents:
        rule?.baseContents.map((content) => ({
          ...content,
          name: productMap.get(content.productSku)?.name?.es ?? content.productSku,
        })) ?? [],
    };
  });

  return (
    <div className="min-h-screen bg-gd-beige text-slate-950">
      <PrimaryNav />
      <main>
        <HomePageClient />

        {/* SECCIÓN DE CAJAS */}
        <section id="cajas" className="relative isolate bg-white py-4 md:py-6 overflow-visible scroll-mt-20 md:scroll-mt-24">
          <Container className="relative space-y-3">
            {/* Grid de Cajas */}
            <BoxesGrid boxes={boxes} prebuiltBoxes={prebuiltBoxes} products={products} boxRules={boxRules} />
          </Container>
        </section>

        <RecienPreparadoSection products={products} />

        {/* CATÁLOGO UNIFICADO - Frutas y Vegetales, Granja, Elaborados */}
        <UnifiedCatalogSection products={products} categories={categories} />

        {/* SECCIONES ESTÁTICAS Y CONTACTO */}
        <HomeSections />
      </main>
      <Footer />
    </div>
  );
}
