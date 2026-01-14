"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/modules/i18n/use-translation";

export function HowItWorksAccordion() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: "1",
      icon: "📦",
      title: t("how_it_works.step1_title"),
      description: t("how_it_works.step1_desc"),
      color: "from-[var(--gd-color-leaf)] to-[var(--gd-color-sprout)]",
      borderColor: "border-[var(--gd-color-leaf)]",
    },
    {
      step: "2",
      icon: "🎨",
      title: t("how_it_works.step2_title"),
      description: t("how_it_works.step2_desc"),
      color: "from-[var(--gd-color-sky)] to-[var(--gd-color-sprout)]",
      borderColor: "border-[var(--gd-color-sky)]",
    },
    {
      step: "3",
      icon: "➕",
      title: t("how_it_works.step3_title"),
      description: t("how_it_works.step3_desc"),
      color: "from-[var(--gd-color-avocado)] to-[var(--gd-color-leaf)]",
      borderColor: "border-[var(--gd-color-avocado)]",
    },
    {
      step: "4",
      icon: "✅",
      title: t("how_it_works.step4_title"),
      description: t("how_it_works.step4_desc"),
      color: "from-[var(--gd-color-leaf)] to-[var(--gd-color-avocado)]",
      borderColor: "border-[var(--gd-color-leaf)]",
    },
    {
      step: "5",
      icon: "🚚",
      title: t("how_it_works.step5_title"),
      description: t("how_it_works.step5_desc"),
      color: "from-[var(--gd-color-sky)] to-[var(--gd-color-leaf)]",
      borderColor: "border-[var(--gd-color-sky)]",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-3xl mx-auto mb-2 text-center">
      {/* Header Ultra Compacto */}
      <div className="flex flex-col items-center gap-1 mb-2 relative z-20">
        <h3 className="font-display text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent">
          {t("how_it_works.title")}
        </h3>
      </div>

      {/* 3D Card Slider - Diseño Horizontal Compacto */}
      <div className="relative mx-auto max-w-lg h-[130px] mb-2 perspective-[1000px]">
        {steps.map((item, index) => {
          const isActive = index === activeStep;
          return (
            <div
              key={item.step}
              className={`absolute inset-0 flex items-center p-4 rounded-[2rem] bg-white border-2 border-b-[6px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isActive
                ? `opacity-100 translate-y-0 scale-100 z-10 shadow-xl ${item.borderColor}`
                : "opacity-0 translate-y-4 scale-95 z-0 border-transparent"
                }`}
            >
              {/* Contenedor Icono */}
              <div className={`shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transform transition-transform duration-500 ${isActive ? "scale-100 rotate-0" : "scale-75 -rotate-12"}`}>
                <span className="text-4xl drop-shadow-md">{item.icon}</span>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--gd-color-forest)] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.step}
                </div>
              </div>

              {/* Texto - Maximizado */}
              <div className="flex-1 pl-3 text-left flex flex-col justify-center">
                <h4 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--gd-color-forest)] leading-none mb-1 tracking-tight">
                  {item.title}
                </h4>
                <p className="font-display text-base md:text-lg font-medium text-[var(--color-muted)] leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores Compactos */}
      <div className="flex justify-center gap-2 mb-3">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveStep(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${activeStep === index
              ? "w-6 bg-[var(--gd-color-forest)]"
              : "w-1.5 bg-[var(--gd-color-leaf)]/30"
              }`}
            aria-label={`Paso ${index + 1}`}
          />
        ))}
      </div>

      {/* Botones de Acción - Integrados y Compactos */}
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/#cajas"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gd-color-forest)] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <span>{t("how_it_works.cta_build")}</span>
          <span className="text-xs opacity-70 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link
          href="#catalogo"
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--gd-color-forest)] shadow-sm transition-colors hover:bg-[var(--gd-color-sprout)]/20"
        >
          {t("how_it_works.cta_catalog")}
        </Link>
      </div>
    </div>
  );
}
