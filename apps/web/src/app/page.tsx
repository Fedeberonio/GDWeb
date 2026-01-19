import { PrimaryNav } from "./_components/primary-nav";
import { HomePageClient } from "./_components/home-page-client";
import { Footer } from "./_components/footer";
import Link from "next/link";
import Image from "next/image";

import { Container } from "./_components/container";
import { LunchCombosSection } from "./_components/lunch-combos-section";
import { BoxesGrid } from "./_components/boxes-grid";
import { HowItWorksImage } from "./_components/how-it-works-image";
import { UnifiedCatalogSection } from "./_components/unified-catalog-section";
import { HomeSections } from "./_components/home-sections";
import { fetchBoxRules, fetchBoxes, fetchProductCategories, fetchProducts } from "@/modules/catalog/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, boxes, products, boxRules] = await Promise.all([
    fetchProductCategories(),
    fetchBoxes(),
    fetchProducts(),
    fetchBoxRules(),
  ]);

  const productMap = new Map(products.map((product) => [product.slug, product]));
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
    const rule = box.ruleId ? rulesById.get(box.ruleId) : undefined;
    return {
      box,
      rule,
      baseContents:
        rule?.baseContents.map((content) => ({
          ...content,
          name: productMap.get(content.productSlug)?.name?.es ?? content.productSlug,
        })) ?? [],
    };
  });

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PrimaryNav />
      <main>
        <HomePageClient />

        {/* SECCIÓN UNIFICADA: CAJAS + CÓMO FUNCIONA */}
        <section id="cajas" className="relative bg-gradient-to-b from-white via-[var(--gd-color-sprout)]/20 to-white py-3 md:py-4 overflow-hidden">
          <Container className="relative z-10 space-y-3">
            {/* Grid de Cajas */}
            <BoxesGrid boxes={boxes} prebuiltBoxes={prebuiltBoxes} products={products} boxRules={boxRules} />

            {/* Cómo Funciona - Imagen Dinámica */}
            <HowItWorksImage />
          </Container>
        </section>

        {/* COMBOS DE ALMUERZO - Compacta */}
        <section id="combos" className="relative bg-white py-6 md:py-8 overflow-hidden border-t border-[var(--gd-color-leaf)]/10">
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
