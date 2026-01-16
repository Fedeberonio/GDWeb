"use client";

import Image from "next/image";
import Link from "next/link";

import { Container } from "./container";
import { useTranslation } from "@/modules/i18n/use-translation";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-[var(--gd-color-beige)]">
      {/* Imagen de fondo con productos - más visible */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/images/hero/hero-rainbow-abundance.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
          aria-hidden="true"
        />
      </div>

      {/* Overlay más fuerte para contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--gd-color-beige)]/95 via-[var(--gd-color-beige)]/85 to-[var(--gd-color-beige)]" />

      {/* Un solo elemento decorativo sutil */}
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[var(--gd-color-leaf)]/10 blur-3xl" />

      <Container className="relative z-10 py-12 md:py-20">
        <div className="text-center space-y-6 mb-10">
          {/* Logo prominente en hero */}
          <div className="flex justify-center mb-8">
            <div className="relative h-40 w-40 md:h-52 md:w-52 filter drop-shadow-xl hover:scale-105 transition-transform duration-500">
              <Image
                src="/images/logo/logo-principal-large.png"
                alt="Green Dolio"
                fill
                sizes="(max-width: 768px) 160px, 208px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Badge de diferenciador principal */}
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--gd-color-forest)] shadow-md">
            <span className="text-base">🌱</span>
            <span>{t("hero.badge")}</span>
          </div>

          {/* Título principal con jerarquía */}
          <h1 className="font-display leading-tight text-emerald-950 drop-shadow-sm max-w-4xl mx-auto">
            <span className="block text-4xl sm:text-5xl md:text-6xl font-bold">
              {t("hero.title_primary")}
            </span>
            <span className="mt-2 block text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-900/90">
              {t("hero.title_secondary")}
            </span>
          </h1>

          {/* Diferenciadores en línea */}
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-[var(--gd-color-forest)]">
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full">
              🚚 {t("hero.feature_delivery")}
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full">
              ♻️ {t("hero.feature_packaging")}
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full">
              🌿 {t("hero.feature_local")}
            </span>
          </div>
        </div>

        {/* CTAs - simplificados */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/#cajas"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gd-color-forest)] px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:bg-[var(--gd-color-leaf)] hover:shadow-xl hover:-translate-y-1"
          >
            <span>{t("hero.cta_build_box")}</span>
            <span>→</span>
          </Link>
          <Link
            href="#catalogo"
            className="inline-flex items-center justify-center rounded-full border-2 border-[var(--gd-color-forest)] bg-white px-8 py-4 text-base font-bold text-[var(--gd-color-forest)] transition-all duration-300 hover:bg-[var(--gd-color-sprout)] hover:shadow-lg"
          >
            {t("hero.cta_catalog")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
