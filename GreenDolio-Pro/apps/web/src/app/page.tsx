import { PrimaryNav } from "./_components/primary-nav";
import { HomePageClient } from "./_components/home-page-client";
import Link from "next/link";
import Image from "next/image";

import { Container } from "./_components/container";
import { ProductCatalogGrid } from "./_components/product-catalog-grid";
import { CategoryCard } from "./_components/category-card";
import { CategoryHighlightSection } from "./_components/category-highlight-section";
import { DifferentiatorsBanner } from "./_components/differentiators-banner";
import { LunchCombosSection } from "./_components/lunch-combos-section";
import { BoxesGrid } from "./_components/boxes-grid";
import { HowItWorksAccordion } from "./_components/how-it-works-accordion";
import boxRules from "@/data/boxRules.json";
import productMetadata from "@/data/productMetadata.json";
import { fetchBoxes, fetchProductCategories, fetchProducts } from "@/modules/catalog/api";

export const dynamic = "force-dynamic";

const DELIVERY_ZONES = [
  {
    name: "Juan Dolio · Villas del Mar",
    details: "Centro, Metro Country Club, Playa Hemingway",
  },
  {
    name: "Santo Domingo Este",
    details: "Costa Verde, Ens. Ozama, Ciudad Juan Bosch",
  },
  {
    name: "Boca Chica · Andrés",
    details: "Apto para entregas exprés y corporativas",
  },
  {
    name: "San Pedro de Macorís",
    details: "Colonial, Villa Olímpica, Ingenio Porvenir",
  },
] as const;

const DELIVERY_WINDOWS = [
  {
    label: "Lun / Mié / Vie",
    window: "12:30 p.m. – 8:00 p.m.",
    note: "Ruta principal (Juan Dolio, Santo Domingo Este)",
  },
  {
    label: "Mar / Jue",
    window: "1:00 p.m. – 7:00 p.m.",
    note: "Boca Chica · Andrés · zonas industriales",
  },
  {
    label: "Sábados",
    window: "10:00 a.m. – 2:00 p.m.",
    note: "Pedidos corporativos y eventos especiales",
  },
] as const;

const productMap = new Map(productMetadata.map((item) => [item.slug, item]));

const slugToRuleKey: Record<string, keyof typeof boxRules> = {
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
  const [categories, boxes, products] = await Promise.all([
    fetchProductCategories(),
    fetchBoxes(),
    fetchProducts(),
  ]);

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
    
    const rule = ruleKey ? (boxRules as Record<string, typeof boxRules[keyof typeof boxRules]>)[ruleKey] : undefined;
    return {
      box,
      rule,
      baseContents:
        rule?.baseContents.map((content) => ({
          ...content,
          name: productMap.get(content.productSlug)?.name ?? content.productSlug,
        })) ?? [],
    };
  });

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PrimaryNav />
      <DifferentiatorsBanner />
      <main>
        <HomePageClient />
        
        {/* SECCIÓN UNIFICADA: CAJAS + CÓMO FUNCIONA - MUY COMPACTA PARA VERSE INMEDIATAMENTE */}
        <section id="cajas" className="relative bg-gradient-to-b from-white via-[var(--gd-color-sprout)]/20 to-white py-3 md:py-4 overflow-hidden">
          <Container className="relative z-10 space-y-3">
            <header className="text-center space-y-1 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/20 to-[var(--gd-color-sprout)]/30 px-2.5 py-0.5 border-2 border-[var(--gd-color-leaf)]/30">
                <span className="text-[0.6rem]">⭐</span>
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[var(--gd-color-forest)]">
                  Cajas pre-armadas
                </span>
              </div>
              <h2 className="font-display text-lg bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent sm:text-xl">
                Elige la caja ideal y personalízala
              </h2>
              <p className="text-[0.7rem] leading-tight text-[var(--gd-color-forest)] md:text-xs">
                Cada caja viene pre-armada con productos frescos seleccionados el mismo día. Puedes aceptarla tal cual o hacer cambios.
              </p>
            </header>

            <BoxesGrid boxes={boxes} prebuiltBoxes={prebuiltBoxes} products={products} />

            <HowItWorksAccordion />
          </Container>
        </section>

        {/* COMBOS DE ALMUERZO - Compacta */}
        <section id="combos" className="relative bg-white py-6 md:py-8 overflow-hidden border-t border-[var(--gd-color-leaf)]/10">
          <Container className="relative z-10">
            <LunchCombosSection />
          </Container>
        </section>

        {/* CATEGORÍAS PRINCIPALES - Compacta */}
        <section className="relative bg-white py-6 md:py-8 overflow-hidden border-t border-[var(--gd-color-leaf)]/10">
          <Container className="relative z-10">
            <CategoryHighlightSection categories={categories} />
          </Container>
        </section>

        {/* POR QUÉ ELEGIR GREEN DOLIO - Consolidado (elimina redundancias) */}
        <section className="relative bg-gradient-to-br from-[var(--gd-color-sprout)]/30 via-white to-[var(--gd-color-sky)]/20 py-16 overflow-hidden">
          {/* Imagen de fondo */}
          <div className="absolute inset-0 opacity-[0.08]">
            <Image
              src="/images/hero/lifestyle-seasonal.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
              aria-hidden="true"
            />
          </div>
          {/* Efectos decorativos */}
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[var(--gd-color-leaf)]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[var(--gd-color-sky)]/10 blur-3xl" />
          <Container className="relative z-10 space-y-10">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <p className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)]/30 bg-white/90 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-[var(--gd-color-forest)] shadow-sm">
                ✨ Por qué elegir Green Dolio
              </p>
              <h2 className="font-display text-3xl bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] bg-clip-text text-transparent sm:text-4xl">
                Tres pilares que nos hacen únicos
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Frescura garantizada",
                  subtitle: "Preparado el mismo día",
                  description: "Productos seleccionados directamente del productor el día de la entrega. Sin refrigeración innecesaria, siempre de temporada.",
                  image: "/images/hero/lifestyle-local-ingredients.jpg",
                  icon: "🌱",
                  color: "from-green-500 to-emerald-600",
                },
                {
                  title: "Cero residuos",
                  subtitle: "Packaging retornable",
                  description: "Empaques 100% retornables que vuelven a nuestro centro. Devuelve tu caja y te descontamos del próximo pedido.",
                  image: "/images/hero/hero-empty-plate.jpg",
                  icon: "♻️",
                  color: "from-blue-500 to-cyan-600",
                },
                {
                  title: "Logística responsable",
                  subtitle: "Rutas optimizadas",
                  description: "Planificamos rutas eficientes para reducir kilómetros y mantener la frescura. Entregas en zonas confirmadas.",
                  image: "/images/hero/hero-text-space-salad.jpg",
                  icon: "🚚",
                  color: "from-purple-500 to-pink-600",
                },
              ].map((item) => (
                <article key={item.title} className="group relative rounded-3xl border-2 border-[var(--gd-color-leaf)]/30 bg-white p-8 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[var(--gd-color-leaf)]">
                  {/* Imagen de fondo */}
                  <div className="absolute inset-0 opacity-[0.15] group-hover:opacity-[0.25] transition-opacity duration-300">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover object-center"
                      aria-hidden="true"
                    />
                  </div>
                  {/* Overlay con gradiente de color */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-15 transition-opacity duration-300`} />
                  <div className="relative z-10 space-y-4">
                    <div className="text-5xl">{item.icon}</div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] font-bold text-[var(--gd-color-forest)] mb-1">{item.subtitle}</p>
                      <h3 className="font-display text-xl font-bold text-[var(--gd-color-forest)]">{item.title}</h3>
                    </div>
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>


        {/* CATÁLOGO - Más compacto */}
        <section id="catalogo" className="relative bg-[var(--color-background-muted)] py-16 overflow-hidden">
          {/* Imagen de fondo decorativa */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.06] hidden lg:block">
            <Image
              src="/images/hero/hero-vegetables-left.jpg"
              alt=""
              fill
              sizes="50vw"
              className="object-cover object-left"
              aria-hidden="true"
            />
          </div>
          <Container className="relative z-10 space-y-10">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-brand)]">Catálogo vivo</p>
                <p className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]">
                  {products.length} productos frescos disponibles
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
                <div className="text-center lg:text-left">
                  <h2 className="font-display text-3xl text-[var(--color-foreground)] sm:text-4xl">
                    Productos frescos de temporada
                  </h2>
                  <p className="mt-2 text-base text-[var(--color-muted)] leading-relaxed">
                    Filtra por categoría, temporada u orgánico y agrégalos a tu pedido por WhatsApp. Todos los productos provienen de productores locales y están listos para sumar a la caja.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 rounded-3xl border border-[var(--color-border)] bg-white p-4 text-xs font-semibold text-[var(--color-muted)]">
                  <span className="rounded-full bg-[color:rgba(212,229,184,0.35)] px-3 py-1">Temporada</span>
                  <span className="rounded-full bg-[color:rgba(212,229,184,0.35)] px-3 py-1">Orgánico</span>
                  <span className="rounded-full bg-[color:rgba(212,229,184,0.35)] px-3 py-1">Destacados</span>
                  <span className="rounded-full bg-white px-3 py-1 text-[var(--color-foreground)]">Sin stock</span>
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-3">
              {categoriesWithCounts.map(({ category, productCount }) => (
                <CategoryCard key={category.id} category={category} productCount={productCount} />
              ))}
            </div>
          </Container>
        </section>

        {/* A LA CARTA - Combinado con catálogo, más compacto */}
        <section id="a-la-carta" className="bg-white py-16">
          <Container className="space-y-8">
            <header className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">🛒 A la carta</p>
              <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                <div className="space-y-2">
                  <h2 className="font-display text-2xl text-[var(--color-foreground)] sm:text-3xl">
                    Arma tu pedido personalizado
                  </h2>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    Selecciona los productos que quieras y agrégalos al pedido. También podés usar el builder para combinar la caja completa.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-sprout)]/20 p-4 text-xs text-[var(--color-muted)]">
                  <p className="font-semibold text-[var(--gd-color-forest)] mb-2">💡 Tips rápidos</p>
                  <ul className="space-y-1">
                    <li>• Filtra por categoría</li>
                    <li>• Activa &quot;Solo destacados&quot;</li>
                    <li>• Agrega múltiples productos</li>
                  </ul>
                </div>
              </div>
            </header>

            <ProductCatalogGrid products={products} categories={categories} />

            {/* CTA Combos para grupos */}
            <div className="text-center mt-8">
              <div className="inline-flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-[var(--gd-color-leaf)]/20 via-white to-[var(--gd-color-sky)]/20 p-6 border-2 border-[var(--gd-color-leaf)]/30 shadow-lg">
                <p className="text-sm font-semibold text-[var(--gd-color-forest)]">
                  ¿Necesitas combos para grupos o eventos?
                </p>
                <Link
                  href="#contacto"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-[var(--gd-color-leaf)] hover:to-[var(--gd-color-avocado)] hover:scale-105 hover:shadow-xl"
                >
                  <span>📞</span>
                  <span>Contactar para pedidos grupales</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* LOGÍSTICA Y CONFIANZA - Combinadas y más compactas */}
        <section id="logistica" className="bg-[var(--color-background-muted)] py-16">
          <Container className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] items-stretch">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-brand)]">Mapa & Logística</p>
              <h2 className="font-display text-3xl text-[var(--color-foreground)] sm:text-4xl">
                Rutas confirmadas entre Juan Dolio, Santo Domingo Este y San Pedro.
              </h2>
              <p className="text-base text-[var(--color-muted)]">
                Cubrimos la autopista Las Américas y el corredor del Caribe con entregas programadas tres veces por
                semana. Ajustamos la ruta según afluencia y pedidos corporativos para que recibas los jugos y cajas en
                condiciones óptimas.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {DELIVERY_ZONES.map((zone) => (
                  <div
                    key={zone.name}
                    className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-4 shadow-soft"
                  >
                    <p className="font-display text-lg text-[var(--color-foreground)]">{zone.name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{zone.details}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[var(--color-brand)] via-[var(--color-accent-cool)] to-[var(--color-brand-accent)] text-white shadow-soft">
              <div className="absolute inset-6 rounded-[32px] border border-white/10" />
              <div className="absolute inset-0 opacity-50">
                <div className="absolute left-10 top-14 h-3 w-3 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.5)]" />
                <div className="absolute left-20 top-28 h-2 w-2 rounded-full bg-white/60" />
                <div className="absolute right-16 top-24 h-4 w-4 rounded-full bg-white" />
                <div className="absolute right-10 bottom-16 h-2.5 w-2.5 rounded-full bg-white/70" />
                <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 rotate-6 bg-white/40" />
                <div className="absolute left-1/2 top-[45%] h-px w-48 -translate-x-1/2 -rotate-12 bg-white/30" />
              </div>
              <div className="relative z-10 flex h-full flex-col gap-6 p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/80">Ventanas de entrega</p>
                  <p className="text-2xl font-display">Planificación semanal</p>
                </div>
                <div className="space-y-4">
                  {DELIVERY_WINDOWS.map((slot) => (
                    <div key={slot.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">{slot.label}</p>
                        <p className="font-display text-lg">{slot.window}</p>
                      </div>
                      <p className="text-xs text-white/80">{slot.note}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/80">
                  Agendamos pedidos con 24 h de anticipación. Pedidos corporativos y eventos tienen agenda dedicada con
                  soporte logístico y cadenas de frío supervisadas.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CONFIANZA - Combinada con logística arriba, más compacta */}
        <section id="confianza" className="relative bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white py-16 overflow-hidden">
          {/* Imagen de fondo decorativa más visible */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.2] hidden lg:block">
            <Image
              src="/images/hero/lifestyle-local-ingredients.jpg"
              alt=""
              fill
              sizes="50vw"
              className="object-cover object-left"
              aria-hidden="true"
            />
          </div>
          {/* Overlay con gradiente */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white via-white/80 to-transparent hidden lg:block" />
          {/* Efectos decorativos */}
          <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-[var(--gd-color-leaf)]/10 blur-3xl" />
          <Container className="relative z-10 space-y-10">
            <div className="grid gap-8 lg:grid-cols-[1.3fr,0.7fr]">
              <div className="space-y-6">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)]/30 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] text-[var(--gd-color-forest)] shadow-sm mb-4">
                    🏡 Sobre nosotros
                  </p>
                  <h2 className="font-display text-4xl bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] bg-clip-text text-transparent sm:text-5xl mb-4">
                  Productos frescos de productores locales
                </h2>
                  <p className="text-lg text-[var(--color-muted)] leading-relaxed font-medium">
                  Trabajamos directamente con productores locales de Juan Dolio y zonas cercanas. 
                    <strong className="text-[var(--gd-color-forest)]"> Cada producto es elegido el mismo día</strong> para garantizar máxima frescura.
                </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">📍 Zonas</p>
                    <p className="font-display text-xl font-bold text-[var(--color-foreground)] mt-2">Juan Dolio · Sto. Dgo.</p>
                    <p className="text-sm text-[var(--color-muted)] mt-1 font-semibold">Entregas lunes / jueves</p>
                  </div>
                  <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">⭐ Calidad</p>
                    <p className="font-display text-xl font-bold text-[var(--color-foreground)] mt-2">Productores aliados</p>
                    <p className="text-sm text-[var(--color-muted)] mt-1 font-semibold">Sello farm-to-table</p>
                  </div>
                  <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">💬 Soporte</p>
                  <p className="font-display text-xl font-bold text-[var(--color-foreground)] mt-2">Chat & email</p>
                  <p className="text-sm text-[var(--color-muted)] mt-1 font-semibold">Resolvemos pedidos y consultas</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/30 to-white p-8 shadow-xl">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold mb-4">🚚 Delivery</p>
                <p className="text-base leading-relaxed text-[var(--color-muted)] font-medium">
                  <strong className="text-[var(--gd-color-forest)]">Delivery gratuito</strong> lunes, miércoles y viernes en Juan Dolio y Santo Domingo Este. 
                  Entregas de 12:30 PM a 8:00 PM. Pedidos antes de las 12:00 PM se entregan el mismo día.
                </p>
                <p className="mt-5 text-sm font-bold text-[var(--gd-color-forest)] border-t-2 border-[var(--gd-color-leaf)]/30 pt-4">
                  Horarios y zonas de entrega
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CONTACTO - Más compacto */}
        <section id="contacto" className="relative bg-gradient-to-br from-[var(--gd-color-forest)] via-[var(--gd-color-avocado)] to-[var(--gd-color-forest)] py-16 text-white overflow-hidden">
          {/* Efectos decorativos */}
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[var(--gd-color-leaf)]/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[var(--gd-color-sky)]/20 blur-3xl" />
          <Container className="relative z-10 space-y-10">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <p className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-white shadow-lg backdrop-blur-sm">
                📞 Contacto
              </p>
              <h2 className="font-display text-4xl sm:text-5xl drop-shadow-lg">¿Listo para armar tu próxima entrega?</h2>
              <p className="text-lg text-white/90 leading-relaxed font-medium drop-shadow-md">
                Hablá con nosotros por teléfono, correo o redes sociales para coordinar rutas, pedidos corporativos o asistirte con el builder.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              <a
                href="tel:+18090000000"
                className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
              >
                <div className="mb-5 text-5xl transition-transform duration-300 group-hover:scale-110">📞</div>
                <p className="font-display text-xl font-bold mb-2">Teléfono</p>
                <p className="text-sm text-white/90 mb-4 font-medium">Soporte inmediato</p>
                <p className="text-xs text-white/70 font-semibold">+1 (809) 000-0000</p>
              </a>

              <a
                href="mailto:hola@greendolio.com?subject=Consulta%20GreenDolio"
                className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
              >
                <div className="mb-5 text-5xl transition-transform duration-300 group-hover:scale-110">📧</div>
                <p className="font-display text-xl font-bold mb-2">Email</p>
                <p className="text-sm text-white/90 mb-4 font-medium">Pedidos y corporate</p>
                <p className="text-xs text-white/70 font-semibold break-all">hola@greendolio.com</p>
              </a>

              <a
                href="https://instagram.com/green_dolio"
                target="_blank"
                rel="noreferrer"
                className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
              >
                <div className="mb-5 text-5xl transition-transform duration-300 group-hover:scale-110">📱</div>
                <p className="font-display text-xl font-bold mb-2">Instagram</p>
                <p className="text-sm text-white/90 mb-4 font-medium">Historias y lanzamientos</p>
                <p className="text-xs text-white/70 font-semibold">@green_dolio</p>
              </a>
            </div>

            <div className="rounded-3xl border-2 border-white/30 bg-white/15 p-8 max-w-2xl mx-auto text-center backdrop-blur-sm">
              <p className="text-base text-white/90 font-medium">
                <strong className="text-white font-bold">Horarios de atención:</strong> Lunes a Viernes, 8:00 AM - 6:00 PM
              </p>
              <p className="text-sm text-white/70 mt-3 font-medium">Entregas: Lunes y Jueves en Juan Dolio y Santo Domingo</p>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
