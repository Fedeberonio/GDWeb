"use client";

import { ChevronRight, Leaf } from "lucide-react";
import { useTranslation } from "@/modules/i18n/use-translation";

export function HeroSectionClient() {
  useTranslation();

  const handleScrollToBoxes = () => {
    const target = document.getElementById("cajas");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.hash = "cajas";
  };

  return (
    <section
      className="relative overflow-hidden bg-black min-h-[550px] md:min-h-[650px] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/assets/images/hero/hero-lifestyle-kitchen.jpg')",
      }}
      aria-label="Caja de vegetales frescos GreenDolio en cocina con vista al mar Caribe"
    >
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(to right, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.45) 30%, rgba(0, 0, 0, 0.25) 50%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.5) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-[550px] md:min-h-[650px] items-center justify-start px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="w-full max-w-xl md:max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg mb-6 md:mb-8">
            <Leaf className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-inter font-semibold text-sm md:text-base">
              Primera empresa 100% sustentable en Juan Dolio
            </span>
          </div>
          <h1
            className="text-white font-fredoka font-bold leading-none tracking-tight mb-6 md:mb-8"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              textShadow:
                "0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            Ordena tu Cajita Fresca
          </h1>
          <p
            className="text-white/95 text-lg md:text-2xl lg:text-3xl font-inter font-medium max-w-xl mb-8 md:mb-10 mx-auto md:mx-0"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          >
            Cajitas frescas, jugos naturales y productos caseros del día.
          </p>
          <button
            type="button"
            onClick={handleScrollToBoxes}
            className="group inline-flex w-full max-w-sm md:w-auto items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-inter font-bold text-lg px-10 py-4 md:px-12 md:py-5 rounded-xl shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300/70"
            aria-label="Ver cajas disponibles"
          >
            <span>Ver Cajas Disponibles</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
