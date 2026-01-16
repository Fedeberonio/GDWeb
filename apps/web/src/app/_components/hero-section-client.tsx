"use client";

import Image from "next/image";
import { Container } from "./container";
import { useTranslation } from "@/modules/i18n/use-translation";

export function HeroSectionClient() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--gd-color-sprout)]/30 via-white to-[var(--gd-color-sky)]/20">
      {/* Imagen de fondo con productos deliciosos - VISIBLE PERO NO DOMINANTE */}
      <div className="absolute inset-0 opacity-[0.35]">
        <Image
          src="/images/hero/hero-rainbow-abundance.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center scale-105"
          priority
          aria-hidden="true"
        />
      </div>
      
      {/* Overlay balanceado para legibilidad y visibilidad de imagen */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-white/85" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--gd-color-sprout)]/35 via-white/50 to-white/90" />
      
      {/* Elementos decorativos orgánicos - Más visibles */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[var(--gd-color-leaf)]/15 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[var(--gd-color-sky)]/15 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[var(--gd-color-avocado)]/10 blur-3xl" />
      
      {/* Patrón decorativo sutil */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, var(--gd-color-forest) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      <Container className="relative z-10 py-12 md:py-16 lg:py-20">
        <div className="text-center space-y-6 md:space-y-8 mb-8">

          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)]/50 bg-white/98 backdrop-blur-md px-5 py-2.5 md:px-6 md:py-3 text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-[var(--gd-color-forest)] shadow-xl">
            <span className="text-lg md:text-xl">🌱</span> 
            <span>{t("hero.badge")}</span>
          </div>
          
          {/* Título con jerarquía visual */}
          <h1 className="font-display leading-[1.1] text-[var(--gd-color-forest)] px-6 py-4 md:px-8 md:py-6 mx-auto max-w-5xl rounded-3xl bg-white/50 backdrop-blur-md shadow-2xl border-2 border-[var(--gd-color-leaf)]/20">
            <span className="block text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black">
              {t("hero.title_primary")}
            </span>
            <span className="mt-2 block text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--gd-color-forest)]/90">
              {t("hero.title_secondary")}
            </span>
          </h1>
          
        </div>
      </Container>
    </section>
  );
}
