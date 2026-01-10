"use client";

import Image from "next/image";
import { Container } from "./container";

export function HeroSectionClient() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--gd-color-sprout)]/30 via-white to-[var(--gd-color-sky)]/20">
      {/* Imagen de fondo con productos deliciosos - MÁS PROMINENTE */}
      <div className="absolute inset-0 opacity-[0.4]">
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
      
      {/* Overlay con gradiente más orgánico */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--gd-color-sprout)]/50 via-white/70 to-white/90" />
      
      {/* Elementos decorativos orgánicos - Más visibles */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[var(--gd-color-leaf)]/15 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[var(--gd-color-sky)]/15 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[var(--gd-color-avocado)]/10 blur-3xl" />
      
      {/* Patrón decorativo sutil */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, var(--gd-color-forest) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      <Container className="relative z-10 py-8 md:py-12">
        <div className="text-center space-y-4 mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-r from-white/95 via-[var(--gd-color-sprout)]/40 to-white/95 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-[var(--gd-color-forest)] shadow-md backdrop-blur-sm">
            <span className="text-base">🌱</span> 
            <span>Primera empresa 100% sustentable en República Dominicana</span>
          </div>
          <h1 className="font-display text-4xl leading-tight bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-md font-bold">
            Cajas frescas, ensaladas, jugos naturales y productos caseros del día
          </h1>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-[var(--gd-color-forest)] leading-relaxed font-semibold drop-shadow-sm">
            Directamente de productores locales • Delivery gratis 3 veces por semana • Packaging retornable • Cero plástico
          </p>
        </div>
      </Container>
    </section>
  );
}

