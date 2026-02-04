import { PrimaryNav } from "./_components/primary-nav";
import { HomePageClient } from "./_components/home-page-client";
import { Footer } from "./_components/footer";

import { Container } from "./_components/container";
import { LunchCombosSection } from "./_components/lunch-combos-section";
import { BoxesGrid } from "./_components/boxes-grid";
import { HowItWorksImage } from "./_components/how-it-works-image";
import { UnifiedCatalogSection } from "./_components/unified-catalog-section";
import { HomeSections } from "./_components/home-sections";
import type { Box, BoxRule, Product, ProductCategory } from "@/modules/catalog/types";
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

  const categoriesWithCounts = categories.map((category) => {
    if (category.id === "cajas") {
      return {
        category,
        productCount: boxes.length,
      };
    }
    return {
      category,
      productCount: products.filter((product) => product.categoryId === category.id).length,
    };
  });

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

        {/* SECCIÓN UNIFICADA: CAJAS + CÓMO FUNCIONA */}
        <section id="cajas" className="relative bg-white py-3 md:py-4 overflow-hidden">
          <Container className="relative z-10 space-y-3">
            {/* Grid de Cajas */}
            <BoxesGrid boxes={boxes} prebuiltBoxes={prebuiltBoxes} products={products} boxRules={boxRules} />

            {/* Cómo Funciona - Imagen Dinámica */}
            <HowItWorksImage />
          </Container>
        </section>

        {/* COMBOS DE ALMUERZO - Compacta */}
        <section id="combos" className="relative bg-gd-leaf/10 py-6 md:py-8 overflow-hidden border-t border-gd-leaf/20">
          <Container className="relative z-10">
            <LunchCombosSection />
          </Container>
        </section>

        {/* CATÁLOGO UNIFICADO - Frutas y Vegetales, Granja, Elaborados */}
        <UnifiedCatalogSection products={products} categories={categories} />

        {/* SECCIONES ESTÁTICAS Y CONTACTO */}
        <HomeSections />
      </main>
      <Footer />
    </div>
  );
}
