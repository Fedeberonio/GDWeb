"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/modules/i18n/use-translation";
import { motion } from "framer-motion";

export function HowItWorksImage() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Determinar qué imagen usar según el idioma
  const imageSrc = t("how_it_works.image");

  // Animación de entrada cuando el componente se monta
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Variantes de animación
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        staggerChildren: 0.1,
      },
    },
  };

  const imageVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      filter: "blur(10px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 1,
        ease: "easeOut" as const,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.3,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.div
      className="w-full max-w-6xl mx-auto mb-2 text-center"
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
    >
      {/* Título con animación */}
      <motion.div
        className="flex flex-col items-center gap-2 mb-6 relative z-20"
        variants={titleVariants}
      >
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent">
          {t("how_it_works.title")}
        </h3>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[var(--gd-color-leaf)] to-transparent rounded-full" />
      </motion.div>

        {/* Contenedor de la imagen con efectos */}
      <motion.div
        className="relative w-full max-w-6xl mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl cursor-zoom-in group"
        variants={imageVariants}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.4, ease: "easeOut" }
        }}
      >
        {/* Sombra mejorada con hover */}
        <div className="absolute inset-0 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] group-hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.4)] transition-shadow duration-400 pointer-events-none z-0" />
        
        {/* Imagen principal - sin márgenes blancos */}
        <div className="relative w-full aspect-[16/8] md:aspect-[16/7] lg:aspect-[16/6] overflow-hidden">
              <motion.div
                className="relative w-full h-full"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Image
                  src={imageSrc}
                  alt={t("how_it_works.image_alt")}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 95vw, 1400px"
                  className={`object-cover transition-opacity duration-700 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  priority
                  onLoad={() => setImageLoaded(true)}
                />
              </motion.div>
        </div>

        {/* Borde animado con efecto de brillo */}
        <motion.div 
          className="absolute inset-0 rounded-2xl border-2 border-[var(--gd-color-leaf)]/20 pointer-events-none z-20"
          animate={{
            borderColor: [
              "rgba(212, 229, 184, 0.2)",
              "rgba(212, 229, 184, 0.4)",
              "rgba(212, 229, 184, 0.2)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Efectos decorativos de fondo */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--gd-color-sprout)]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--gd-color-leaf)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
    </motion.div>
  );
}
