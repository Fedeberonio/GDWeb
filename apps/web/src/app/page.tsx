import { PrimaryNav } from "./_components/primary-nav";
import { HomePageClient } from "./_components/home-page-client";
import { Footer } from "./_components/footer";
import Link from "next/link";
import Image from "next/image";

import { Container } from "./_components/container";
import { LunchCombosSection } from "./_components/lunch-combos-section";
import { BoxesGrid } from "./_components/boxes-grid";
import { HowItWorksAccordion } from "./_components/how-it-works-accordion";
import { UnifiedCatalogSection } from "./_components/unified-catalog-section";
import { HomeSections } from "./_components/home-sections";
import { fetchBoxRules, fetchBoxes, fetchProductCategories, fetchProducts } from "@/modules/catalog/api";

export const dynamic = "force-dynamic";

const slugToRuleKey: Record<string, string> = {
  "caribbean-fresh-pack": "GD-CAJA-001",
  "island-weekssential": "GD-CAJA-002",
  "allgreenxclusive": "GD-CAJA-003",
  "box-1-caribbean-fresh-pack-3-dias": "GD-CAJA-001",
  "box-2-island-weekssential-1-semana": "GD-CAJA-002",
  "box-3-allgreenxclusive-2-semanas": "GD-CAJA-003",
  "box-1": "GD-CAJA-001",
  "box-2": "GD-CAJA-002",
  "box-3": "GD-CAJA-003",
};

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
    // Intentar encontrar la regla por slug exacto, luego por slug parcial, luego por ID
    let ruleKey = slugToRuleKey[box.slug];
    if (!ruleKey && box.slug.includes("caribbean")) ruleKey = "GD-CAJA-001";
    if (!ruleKey && box.slug.includes("island")) ruleKey = "GD-CAJA-002";
    if (!ruleKey && box.slug.includes("allgreen")) ruleKey = "GD-CAJA-003";
    if (!ruleKey && box.id === "box-1") ruleKey = "GD-CAJA-001";
    if (!ruleKey && box.id === "box-2") ruleKey = "GD-CAJA-002";
    if (!ruleKey && box.id === "box-3") ruleKey = "GD-CAJA-003";

    const rule = ruleKey ? rulesById.get(ruleKey) : undefined;
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

            {/* Banner y Pasos (Interactivos) */}
            <HowItWorksAccordion />
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
