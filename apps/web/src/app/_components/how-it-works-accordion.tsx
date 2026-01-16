"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
      image: "/images/how%20it%20works/step-1.jpg",
      color: "from-[var(--gd-color-leaf)] to-[var(--gd-color-sprout)]",
      borderColor: "border-[var(--gd-color-leaf)]",
    },
    {
      step: "2",
      icon: "🎨",
      title: t("how_it_works.step2_title"),
      description: t("how_it_works.step2_desc"),
      image: "/images/how%20it%20works/step-2.jpg",
      color: "from-[var(--gd-color-sky)] to-[var(--gd-color-sprout)]",
      borderColor: "border-[var(--gd-color-sky)]",
    },
    {
      step: "3",
      icon: "➕",
      title: t("how_it_works.step3_title"),
      description: t("how_it_works.step3_desc"),
      image: "/images/how%20it%20works/step-3.jpg",
      color: "from-[var(--gd-color-avocado)] to-[var(--gd-color-leaf)]",
      borderColor: "border-[var(--gd-color-avocado)]",
    },
    {
      step: "4",
      icon: "✅",
      title: t("how_it_works.step4_title"),
      description: t("how_it_works.step4_desc"),
      image: "/images/how%20it%20works/step-4.jpg",
      color: "from-[var(--gd-color-leaf)] to-[var(--gd-color-avocado)]",
      borderColor: "border-[var(--gd-color-leaf)]",
    },
    {
      step: "5",
      icon: "🚚",
      title: t("how_it_works.step5_title"),
      description: t("how_it_works.step5_desc"),
      image: "/images/how%20it%20works/step-5.jpg",
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
      <div className="relative mx-auto w-full max-w-2xl h-[180px] md:h-[200px] lg:h-[210px] mb-4 overflow-visible perspective-[1000px]">
        {steps.map((item, index) => {
          const position = (index - activeStep + steps.length) % steps.length;
          const isVisible = position <= 2;
          const isActive = position === 0;
          const offsetX = position * 26;
          const offsetY = position * 10;
          const scale = 1 - position * 0.035;
          const opacity = isVisible ? 1 - position * 0.22 : 0;
          const transform = isVisible
            ? `translateX(calc(-50% + ${offsetX}px)) translateY(${offsetY}px) scale(${scale})`
            : "translateX(calc(-50% - 90px)) translateY(28px) scale(0.9)";

          return (
            <div
              key={item.step}
              className={`absolute left-1/2 top-0 h-full w-[92%] sm:w-[520px] md:w-[640px] inline-flex items-center gap-4 p-4 md:p-5 rounded-[2rem] bg-white border-2 border-b-[6px] overflow-visible transition-[transform,opacity] duration-700 ease-out ${
                isActive ? `shadow-2xl ${item.borderColor}` : "shadow-lg border-transparent"
              }`}
              style={{
                transform,
                opacity,
                zIndex: 10 - position,
                pointerEvents: isVisible ? "auto" : "none",
              }}
            >
              {/* Imagen + Icono */}
              <div
                className={`relative shrink-0 transform transition-transform duration-700 ${isActive ? "scale-100 rotate-0" : "scale-95 -rotate-2"}`}
              >
                <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/80">
                  <Image
                    src={item.image}
                    alt={`${item.title} - Paso ${item.step}`}
                    fill
                    sizes="96px"
                    className="object-cover object-center"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/10" />
                  <div className={`absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-lg shadow-md`}>
                    <span className="drop-shadow">{item.icon}</span>
                  </div>
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--gd-color-forest)] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.step}
                </div>
              </div>

              {/* Texto - Maximizado */}
              <div className="flex-1 pr-2 text-left flex flex-col justify-center min-w-0">
                <h4 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[var(--gd-color-forest)] leading-tight mb-1 tracking-tight">
                  {item.title}
                </h4>
                <p className="font-display text-base sm:text-lg font-medium text-[var(--color-muted)] leading-snug">
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
