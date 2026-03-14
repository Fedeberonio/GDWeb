# Contenido completo - Auditoría How It Works

---

## 1. `apps/web/src/app/_components/how-it-works-detailed.tsx`

```tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "@/modules/i18n/use-translation";
import Link from "next/link";
import Image from "next/image";

const steps = [
  {
    number: "01",
    titleKey: "how_it_works.step1_title",
    descKey: "how_it_works.step1_desc",
    bgColor: "bg-[#F5E6D3]",
    textColor: "text-[#2D5016]",
    accentColor: "#D4A574",
    ctaKey: "how_it_works.cta_boxes",
    ctaHref: "/#cajas",
    imageSrc: "/assets/images/how-it-works/paso-01-elige-caja.webp",
  },
  {
    number: "02",
    titleKey: "how_it_works.step2_title",
    descKey: "how_it_works.step2_desc",
    bgColor: "bg-[#FFF9E6]",
    textColor: "text-[#4A3C1A]",
    accentColor: "#F9A825",
    ctaKey: "how_it_works.cta_preferences",
    ctaHref: "/#cajas",
    imageSrc: "/assets/images/how-it-works/paso-02-personaliza.webp",
  },
  {
    number: "03",
    titleKey: "how_it_works.step3_title",
    descKey: "how_it_works.step3_desc",
    bgColor: "bg-[#E8F4E8]",
    textColor: "text-[#1A3A0F]",
    accentColor: "#7CB342",
    ctaKey: "how_it_works.cta_catalog",
    ctaHref: "/#catalogo",
    imageSrc: "/assets/images/how-it-works/paso-03-agrega-productos.webp",
  },
  {
    number: "04",
    titleKey: "how_it_works.step4_alt_title",
    descKey: "how_it_works.step4_alt_desc",
    bgColor: "bg-[#EAF7FF]",
    textColor: "text-[#153B4D]",
    accentColor: "#2B8CC4",
    ctaKey: "how_it_works.cta_catalog_full",
    ctaHref: "/#catalogo",
    imageSrc: "/assets/images/how-it-works/paso-04-elige-productos.webp",
  },
  {
    number: "05",
    titleKey: "how_it_works.step4_title",
    descKey: "how_it_works.step4_desc",
    bgColor: "bg-[#E3F2FD]",
    textColor: "text-[#1A3A4A]",
    accentColor: "#42A5F5",
    ctaKey: "how_it_works.cta_contact",
    ctaHref: "https://wa.me/18097537338",
    imageSrc: "/assets/images/how-it-works/paso-05-confirmamos-preparamos.webp",
  },
  {
    number: "06",
    titleKey: "how_it_works.step5_title",
    descKey: "how_it_works.step5_desc",
    bgColor: "bg-[#F3E5F5]",
    textColor: "text-[#4A1A4A]",
    accentColor: "#AB47BC",
    ctaKey: "how_it_works.cta_delivery",
    ctaHref: "/#ventanas-entrega",
    imageSrc: "/assets/images/how-it-works/paso-06-recibe-en-tu-puerta.webp",
  },
  {
    number: "07",
    titleKey: "how_it_works.step6_title",
    descKey: "how_it_works.step6_desc",
    bgColor: "bg-[#E8F5E9]",
    textColor: "text-[#1B5E20]",
    accentColor: "#66BB6A",
    ctaKey: "how_it_works.cta_sustainability",
    ctaHref: "/#confianza",
    imageSrc: "/assets/images/how-it-works/paso-07-devuelve-y-gana.webp",
  },
] as const;

function DetailedStep({ step, index }: { step: (typeof steps)[number]; index: number }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const isEven = index % 2 === 0;

  return (
    <section
      id={`paso-${step.number}`}
      ref={ref}
      className={`scroll-mt-24 min-h-[70vh] flex items-center ${step.bgColor} py-16 md:py-20`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 w-full">
        <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}>
          <motion.div
            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 mb-6"
              style={{ borderColor: step.accentColor, color: step.accentColor }}
            >
              <span className="text-3xl font-black font-fredoka">{step.number}</span>
            </div>

            <h3 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight font-fredoka ${step.textColor}`}>
              {t(step.titleKey)}
            </h3>

            <p className={`text-lg md:text-xl mb-6 leading-relaxed font-inter ${step.textColor} opacity-90`}>
              {t(step.descKey)}
            </p>

            <Link
              href={step.ctaHref}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg text-white transition-all hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: step.accentColor }}
            >
              <span>{t(step.ctaKey)}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isEven ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full"
          >
            <div className="relative w-full max-w-[640px] h-[360px] md:h-[400px] bg-gray-200 border-4 border-gray-300 rounded-3xl flex items-center justify-center overflow-hidden mx-auto aspect-video">
              <Image
                src={step.imageSrc}
                alt={t(step.titleKey)}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
                priority={step.number === "01"}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${step.accentColor}22 0%, transparent 45%)`,
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksDetailed() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <section className="relative min-h-[34vh] md:min-h-[42vh] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/assets/images/hero/lifestyle-local-ingredients.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--gd-color-forest)]/85 via-[var(--gd-color-forest)]/70 to-[#3A6B1F]/80" />
        <div className="relative z-10 text-center px-6 py-14 md:py-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-[var(--gd-color-sprout)] text-sm md:text-base uppercase tracking-[0.3em] mb-4 font-semibold">Green Dolio</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight font-fredoka">
              {t("how_it_works.title")}
            </h1>
            <p className="text-lg md:text-xl text-[var(--gd-color-sprout)] max-w-2xl mx-auto font-inter">
              {t("how_it_works.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {steps.map((step, index) => (
        <DetailedStep key={step.number} step={step} index={index} />
      ))}

      <section className="relative min-h-[24vh] md:min-h-[28vh] flex items-center justify-center bg-[var(--gd-color-forest)] text-white">
        <div className="text-center px-6 py-10 md:py-12">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 font-fredoka">¿Listo para empezar?</h3>
          <Link
            href="/#cajas"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[var(--gd-color-forest)] text-xl font-bold rounded-full hover:bg-[var(--gd-color-sprout)] transition-colors"
          >
            Ver Cajas Disponibles
          </Link>
        </div>
      </section>
    </div>
  );
}
```

---

## 2. `apps/web/src/app/como-funciona/page.tsx`

```tsx
import { PrimaryNav } from "../_components/primary-nav";
import { Footer } from "../_components/footer";
import { HowItWorksDetailed } from "../_components/how-it-works-detailed";

export default function ComoFuncionaPage() {
  return (
    <>
      <PrimaryNav />
      <HowItWorksDetailed />
      <Footer />
    </>
  );
}
```

---

## 3. Líneas con `how_it_works` en `apps/web/src/modules/i18n/translations.ts`

```
  13:        "nav.how_it_works": "Cómo Funciona",
 212:        "how_it_works.title": "¿Cómo funciona?",
 213:        "how_it_works.subtitle": "Tu experiencia de la huerta a tu puerta en siete pasos simples",
 214:        "how_it_works.step1_title": "Elige tu Caja",
 215:        "how_it_works.step1_desc": "Selecciona tamaño (3 días, 1 semana, 2 semanas) y variedad (Mix, Frutal, Veggie).",
 216:        "how_it_works.step2_title": "Personaliza",
 217:        "how_it_works.step2_desc": "Dinos qué te gusta y qué prefieres evitar",
 218:        "how_it_works.step3_title": "Agrega Productos",
 219:        "how_it_works.step3_desc": "Suma jugos, dips, huevos, miel y más",
 220:        "how_it_works.step4_alt_title": "O elige tus productos uno a uno",
 221:        "how_it_works.step4_alt_desc": "Explora nuestro catálogo completo y selecciona exactamente lo que necesitas. Pedido mínimo DOP 500.",
 222:        "how_it_works.step4_title": "Confirmamos y Preparamos",
 223:        "how_it_works.step4_desc": "Recibe confirmación y armamos tu caja el mismo día de entrega",
 224:        "how_it_works.step5_title": "Recibe en tu Puerta",
 225:        "how_it_works.step5_desc": "Delivery gratuito lunes, miércoles y viernes",
 226:        "how_it_works.step6_title": "Devuelve y Gana",
 227:        "how_it_works.step6_desc": "Devuelve la caja o botellas en tu próxima compra y obtén importantes descuentos y premios",
 228:        "how_it_works.cta_build": "Arma tu caja",
 229:        "how_it_works.cta_catalog": "Ver productos",
 230:        "how_it_works.cta_catalog_full": "Ver Catálogo Completo",
 231:        "how_it_works.cta_boxes": "Ver Cajas",
 232:        "how_it_works.cta_preferences": "Personalizar Pedido",
 233:        "how_it_works.cta_contact": "Contactar WhatsApp",
 234:        "how_it_works.cta_delivery": "Ver Zonas de Entrega",
 235:        "how_it_works.cta_sustainability": "Conocer Más",
 236:        "how_it_works.see_details": "Ver detalles completos",
 237:        "how_it_works.image": "/assets/images/how-it-works/how-it-works-es.png",
 238:        "how_it_works.image_alt": "Cómo funciona",
 911:        "nav.how_it_works": "How It Works",
1110:        "how_it_works.title": "How does it work?",
1111:        "how_it_works.subtitle": "From farm to your door in seven simple steps",
1112:        "how_it_works.step1_title": "Choose Your Box",
1113:        "how_it_works.step1_desc": "Select size (3 days, 1 week, 2 weeks) and variety (Mix, Fruity, Veggie).",
1114:        "how_it_works.step2_title": "Personalize",
1115:        "how_it_works.step2_desc": "Tell us what you like and what you prefer to avoid",
1116:        "how_it_works.step3_title": "Add Products",
1117:        "how_it_works.step3_desc": "Add juices, dips, eggs, honey and more",
1118:        "how_it_works.step4_alt_title": "Or choose your products one by one",
1119:        "how_it_works.step4_alt_desc": "Explore our full catalog and select exactly what you need. Minimum order DOP 500.",
1120:        "how_it_works.step4_title": "We Confirm and Prepare",
1121:        "how_it_works.step4_desc": "Receive confirmation and we pack your box on delivery day",
1122:        "how_it_works.step5_title": "Receive at Your Door",
1123:        "how_it_works.step5_desc": "Free delivery Monday, Wednesday and Friday",
1124:        "how_it_works.step6_title": "Return and Earn",
1125:        "how_it_works.step6_desc": "Return your box or bottles on your next purchase and get important discounts and rewards",
1126:        "how_it_works.cta_build": "Build your box",
1127:        "how_it_works.cta_catalog": "View products",
1128:        "how_it_works.cta_catalog_full": "View Full Catalog",
1129:        "how_it_works.cta_boxes": "View Boxes",
1130:        "how_it_works.cta_preferences": "Customize Order",
1131:        "how_it_works.cta_contact": "Contact WhatsApp",
1132:        "how_it_works.cta_delivery": "View Delivery Zones",
1133:        "how_it_works.cta_sustainability": "Learn More",
1134:        "how_it_works.see_details": "See full details",
1135:        "how_it_works.image": "/assets/images/how-it-works/how-it-works-en.png",
1136:        "how_it_works.image_alt": "How it works",
```
