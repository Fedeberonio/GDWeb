"use client";

import { ChevronRight, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/modules/i18n/use-translation";

export function HeroSectionClient() {
  const { t } = useTranslation();

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
      className="relative overflow-hidden bg-black min-h-[550px] md:min-h-[650px] bg-cover bg-no-repeat hero-bg-mobile md:bg-center"
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
      <motion.div
        className="absolute left-[8%] top-[12%] hidden h-40 w-40 rounded-full bg-white/15 blur-3xl md:block"
        animate={{ y: [0, -10, 0], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[8%] right-[10%] hidden h-48 w-48 rounded-full bg-yellow-300/20 blur-3xl md:block"
        animate={{ y: [0, 14, 0], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-[550px] md:min-h-[650px] items-center justify-center md:justify-start px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="w-full max-w-xl md:max-w-2xl text-center md:text-left mx-auto md:mx-0">
          <motion.div
            className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg mb-6 md:mb-8"
            initial={{ opacity: 0, x: -56 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            <Leaf className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-inter font-semibold text-sm md:text-base">
              {t("hero.badge")}
            </span>
          </motion.div>
          <motion.h1
            className="text-white font-fredoka font-bold leading-none tracking-tight mb-6 md:mb-8"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              textShadow:
                "0 2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.2)",
            }}
            initial={{ opacity: 0, x: -84 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.35, delay: 0.2, ease: "easeOut" }}
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p
            className="text-white/95 text-lg md:text-2xl lg:text-3xl font-inter font-medium max-w-xl mb-8 md:mb-10 mx-auto md:mx-0"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0, x: -68 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.25, delay: 0.38, ease: "easeOut" }}
          >
            {t("hero.subtitle")}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, x: -52 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.15, delay: 0.56, ease: "easeOut" }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleScrollToBoxes}
            className="group inline-flex w-full max-w-sm md:w-auto items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-inter font-bold text-lg px-10 py-4 md:px-12 md:py-5 rounded-xl shadow-2xl hover:shadow-yellow-500/50 transform transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300/70"
            aria-label={t("hero.cta")}
          >
            <span>{t("hero.cta")}</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
