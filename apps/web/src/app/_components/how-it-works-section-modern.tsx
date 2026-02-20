"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "@/modules/i18n/use-translation";
import Link from "next/link";

const steps = [
  {
    number: "01",
    titleKey: "how_it_works.step1_title",
    descKey: "how_it_works.step1_desc",
    bgColor: "bg-[#F5E6D3]",
    textColor: "text-[#2D5016]",
    accentColor: "#D4A574",
  },
  {
    number: "02",
    titleKey: "how_it_works.step2_title",
    descKey: "how_it_works.step2_desc",
    bgColor: "bg-[#FFF9E6]",
    textColor: "text-[#4A3C1A]",
    accentColor: "#F9A825",
  },
  {
    number: "03",
    titleKey: "how_it_works.step3_title",
    descKey: "how_it_works.step3_desc",
    bgColor: "bg-[#E8F4E8]",
    textColor: "text-[#1A3A0F]",
    accentColor: "#7CB342",
  },
  {
    number: "04",
    titleKey: "how_it_works.step4_title",
    descKey: "how_it_works.step4_desc",
    bgColor: "bg-[#E3F2FD]",
    textColor: "text-[#1A3A4A]",
    accentColor: "#42A5F5",
  },
  {
    number: "05",
    titleKey: "how_it_works.step5_title",
    descKey: "how_it_works.step5_desc",
    bgColor: "bg-[#F3E5F5]",
    textColor: "text-[#4A1A4A]",
    accentColor: "#AB47BC",
  },
  {
    number: "06",
    titleKey: "how_it_works.step6_title",
    descKey: "how_it_works.step6_desc",
    bgColor: "bg-[#E8F5E9]",
    textColor: "text-[#1B5E20]",
    accentColor: "#66BB6A",
  },
] as const;

function StepSection({ step, index }: { step: (typeof steps)[number]; index: number }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const isEven = index % 2 === 0;

  return (
    <section ref={ref} className={`relative min-h-[80vh] flex items-center ${step.bgColor} overflow-hidden`}>
      <motion.div
        style={{ y, opacity: 0.08 }}
        className={`absolute ${isEven ? "left-0" : "right-0"} top-1/2 -translate-y-1/2`}
      >
        <span className={`text-[20rem] md:text-[28rem] font-bold leading-none ${step.textColor} font-fredoka`}>
          {step.number}
        </span>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 w-full">
        <div className={`max-w-2xl ${isEven ? "ml-0" : "ml-auto"}`}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : {}}
            transition={{ duration: 0.6, type: "spring" }}
            className="inline-block mb-6"
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${step.textColor} border-4`}
              style={{ borderColor: step.accentColor }}
            >
              <span className="text-3xl font-black">{step.number}</span>
            </div>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight tracking-tight font-fredoka ${step.textColor}`}
          >
            {t(step.titleKey)}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`text-lg md:text-xl lg:text-2xl ${step.textColor} opacity-80 leading-relaxed font-inter font-medium`}
          >
            {t(step.descKey)}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 h-2 rounded-full origin-left"
            style={{
              backgroundColor: step.accentColor,
              width: "200px",
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8"
          >
            <Link
              href={`/como-funciona#paso-${step.number}`}
              className="inline-flex items-center gap-2 text-base md:text-lg font-semibold hover:gap-4 transition-all duration-300"
              style={{ color: step.accentColor }}
            >
              <span>{t("how_it_works.see_details")}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200]), backgroundColor: step.accentColor }}
        className={`absolute ${isEven ? "right-20" : "left-20"} top-20 w-32 h-32 rounded-full opacity-20`}
      />
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -150]), backgroundColor: step.accentColor }}
        className={`absolute ${isEven ? "right-40" : "left-40"} bottom-40 w-20 h-20 rounded-full opacity-30`}
      />
    </section>
  );
}

export function HowItWorksModern() {
  const { t } = useTranslation();
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true });

  return (
    <div className="relative">
      <section
        ref={headerRef}
        className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-[var(--gd-color-forest)] via-[#3A6B1F] to-[var(--gd-color-forest)] overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[var(--gd-color-sprout)] text-sm md:text-base uppercase tracking-[0.3em] mb-6 font-semibold">
              Green Dolio
            </p>
            <h2
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight font-fredoka"
            >
              {t("how_it_works.title")}
            </h2>
            <p className="text-2xl md:text-3xl text-[var(--gd-color-sprout)] max-w-3xl mx-auto font-light">
              {t("how_it_works.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isHeaderInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1 }}
            className="mt-20"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-8 h-12 border-2 border-white/50 rounded-full mx-auto flex items-start justify-center p-2"
            >
              <div className="w-1.5 h-3 bg-white rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {steps.map((step, index) => (
        <StepSection key={step.number} step={step} index={index} />
      ))}

      <section className="relative min-h-[50vh] flex items-center justify-center bg-[var(--gd-color-forest)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/noise.png')] bg-repeat opacity-50" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.h3
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight tracking-tight font-fredoka"
          >
            ¿Listo para empezar?
          </motion.h3>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-6 bg-white text-[#2D5016] text-xl md:text-2xl font-bold rounded-full hover:bg-[#D4E5B8] transition-colors"
            onClick={() => {
              window.location.href = "/#cajas";
            }}
          >
            Ver Cajas Disponibles
          </motion.button>
        </div>
      </section>
    </div>
  );
}
