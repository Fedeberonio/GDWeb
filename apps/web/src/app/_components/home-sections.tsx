"use client";

import Image from "next/image";
import { Calendar, Clock, CreditCard, Instagram, Leaf, Mail, MapPin, Package, Phone, Recycle, RefreshCw, Sparkles, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "./container";
import { PaymentMethodCard } from "@/components/PaymentMethodCard";
import { useTranslation } from "@/modules/i18n/use-translation";

const DELIVERY_WINDOWS = [
    {
        labelKey: "home.window_mwf",
        windowKey: "home.window_mwf_time",
        noteKey: "home.window_mwf_note",
    },
    {
        labelKey: "home.window_tj",
        windowKey: "home.window_tj_time",
        noteKey: "home.window_tj_note",
    },
    {
        labelKey: "home.window_sat",
        windowKey: "home.window_sat_time",
        noteKey: "home.window_sat_note",
    },
] as const;

export function HomeSections() {
    const { t } = useTranslation();
    const revealLeft = {
        hidden: { opacity: 0, x: -72 },
        visible: { opacity: 1, x: 0 },
    };
    const revealRight = {
        hidden: { opacity: 0, x: 72 },
        visible: { opacity: 1, x: 0 },
    };
    const revealCards = {
        hidden: (index: number) => ({ opacity: 0, x: index % 2 === 0 ? -62 : 62 }),
        visible: { opacity: 1, x: 0 },
    };
    const staggerParent = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } },
    };

    return (
        <>
            {/* POR QUÉ ELEGIR GREEN DOLIO - Simplificado */}
            <section className="bg-[var(--gd-color-beige)] py-16">
                <Container className="space-y-10">
                    <motion.div
                        className="text-center space-y-3 max-w-3xl mx-auto"
                        variants={revealLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-15%" }}
                        transition={{ duration: 0.95, ease: "easeOut" }}
                    >
                        <p className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)] bg-white px-5 py-2 text-sm font-bold text-[var(--gd-color-forest)]">
                            <Sparkles className="w-4 h-4 text-gd-leaf" strokeWidth={1.5} />
                            {t("home.values_badge")}
                        </p>
                        <h2 className="font-fredoka font-semibold text-4xl md:text-5xl text-green-800">
                            {t("home.values_title")}
                        </h2>
                    </motion.div>
                    <motion.div
                        className="grid gap-6 md:grid-cols-3"
                        variants={staggerParent}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                    >
                        {[
                            {
                                title: t("home.values_1_title"),
                                subtitle: t("home.values_1_subtitle"),
                                description: t("home.values_1_desc"),
                                Icon: Leaf,
                            },
                            {
                                title: t("home.values_2_title"),
                                subtitle: t("home.values_2_subtitle"),
                                description: t("home.values_2_desc"),
                                Icon: RefreshCw,
                            },
                            {
                                title: t("home.values_3_title"),
                                subtitle: t("home.values_3_subtitle"),
                                description: t("home.values_3_desc"),
                                Icon: Truck,
                            },
                        ].map((item, index) => (
                            <motion.article
                                key={item.title}
                                custom={index}
                                className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/30 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--gd-color-leaf)]"
                                variants={revealCards}
                                transition={{ duration: 0.82, ease: "easeOut" }}
                            >
                                <div className="space-y-4">
                                    <item.Icon className="w-8 h-8 text-gd-leaf" strokeWidth={1.5} aria-hidden />
                                    <div>
                                        <p className="font-display text-sm font-bold text-[var(--gd-color-leaf)] mb-1">{item.subtitle}</p>
                                        <h3 className="font-display text-xl md:text-2xl text-green-700 font-bold">{item.title}</h3>
                                    </div>
                                    <p className="font-display text-base text-[var(--gd-color-text-muted)] leading-relaxed font-medium">{item.description}</p>
                                </div>
                            </motion.article>
                        ))}
                    </motion.div>
                </Container>
            </section>

            {/* Ventanas de entrega */}
            <section id="ventanas-entrega" className="py-20 bg-white scroll-mt-20 md:scroll-mt-24">
              <div className="max-w-7xl mx-auto px-6">
                <motion.div
                  className="text-center mb-12"
                  variants={revealRight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.95, ease: "easeOut" }}
                >
                  <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-4">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-inter font-semibold text-sm uppercase tracking-wide">Planificación semanal</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-fredoka font-semibold text-green-800 mb-4">
                    Ventanas de entrega
                  </h2>
                </motion.div>

                <motion.div
                  className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
                  variants={staggerParent}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-15%" }}
                >
                  <motion.div
                    custom={0}
                    className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-8"
                    variants={revealCards}
                    transition={{ duration: 0.82, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-inter font-semibold uppercase tracking-wide">Lun / Mié / Vie</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <p className="font-inter font-semibold">12:30 p.m. – 8:00 p.m.</p>
                    </div>
                    <p className="text-sm text-gray-600 font-inter">Ruta principal (Juan Dolio)</p>
                  </motion.div>

                  <motion.div
                    custom={1}
                    className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-8"
                    variants={revealCards}
                    transition={{ duration: 0.82, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-inter font-semibold uppercase tracking-wide">Mar / Jue</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <p className="font-inter font-semibold">1:00 p.m. – 7:00 p.m.</p>
                    </div>
                    <p className="text-sm text-gray-600 font-inter">Boca Chica · Andrés · zonas industriales</p>
                  </motion.div>

                  <motion.div
                    custom={2}
                    className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-8"
                    variants={revealCards}
                    transition={{ duration: 0.82, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-inter font-semibold uppercase tracking-wide">Sábados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <p className="font-inter font-semibold">10:00 a.m. – 2:00 p.m.</p>
                    </div>
                    <p className="text-sm text-gray-600 font-inter">Pedidos corporativos y eventos especiales</p>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="mt-12 max-w-3xl mx-auto bg-green-50 border border-green-200 rounded-xl p-6"
                  variants={revealLeft}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                >
                  <p className="text-gray-700 leading-relaxed font-inter">
                    Agendamos pedidos con 24 h de anticipación. Pedidos corporativos y eventos tienen agenda dedicada con soporte logístico y cadenas de frío supervisadas.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* CONFIANZA - Combinada con logística arriba, más compacta */}
            <section id="confianza" className="relative bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white py-16 overflow-hidden scroll-mt-20 md:scroll-mt-24">
                {/* Imagen de fondo decorativa más visible */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.2] hidden lg:block">
                    <Image
                        src="/assets/images/hero/lifestyle-local-ingredients.jpg"
                        alt=""
                        fill
                        sizes="50vw"
                        className="object-cover object-left"
                        aria-hidden="true"
                    />
                </div>
                {/* Overlay con gradiente */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white via-white/80 to-transparent hidden lg:block" />
                {/* Efectos decorativos */}
                <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-[var(--gd-color-leaf)]/10 blur-3xl" />
                <Container className="relative z-10 space-y-10">
                    <motion.div
                        className="grid gap-8 lg:grid-cols-[1.3fr,0.7fr]"
                        variants={revealLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-12%" }}
                        transition={{ duration: 1.05, ease: "easeOut" }}
                    >
                        <div className="space-y-6">
                            <motion.div
                                variants={revealLeft}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-12%" }}
                                transition={{ duration: 0.9, ease: "easeOut" }}
                            >
                                <p className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)]/30 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] text-[var(--gd-color-forest)] shadow-sm mb-4">
                                    <MapPin className="w-4 h-4 text-[var(--gd-color-forest)]" aria-hidden />
                                    {t("home.about_badge")}
                                </p>
                                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-green-800 font-bold mb-4">
                                    {t("home.about_title")}
                                </h2>
                                <p className="font-display text-lg md:text-xl text-[var(--color-muted)] leading-relaxed font-medium">
                                    {t("home.about_desc")}
                                    <strong className="text-[var(--gd-color-forest)] font-bold"> {t("home.about_desc_strong")}</strong> {t("home.about_desc_suffix")}
                                </p>
                            </motion.div>
                            <motion.div
                                className="grid gap-4 md:grid-cols-3"
                                variants={staggerParent}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-10%" }}
                            >
                                <div className="h-full min-h-[250px] rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Package className="w-8 h-8 text-green-600" />
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">{t("home.about_card_1_badge")}</p>
                                    <p className="font-caveat text-xl md:text-2xl font-bold text-green-700 mt-2 leading-tight">{t("home.about_card_1_title")}</p>
                                    <p className="font-inter text-sm md:text-base text-[var(--color-muted)] mt-1 font-semibold">{t("home.about_card_1_desc")}</p>
                                </div>
                                <div className="h-full min-h-[250px] rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Recycle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">{t("home.about_card_2_badge")}</p>
                                    <p className="font-caveat text-xl md:text-2xl font-bold text-green-700 mt-2 leading-tight">{t("home.about_card_2_title")}</p>
                                    <p className="font-inter text-sm md:text-base text-[var(--color-muted)] mt-1 font-semibold">{t("home.about_card_2_desc")}</p>
                                </div>
                                <div className="h-full min-h-[250px] rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Truck className="w-8 h-8 text-green-600" />
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">{t("home.about_card_3_badge")}</p>
                                    <p className="font-caveat text-xl md:text-2xl font-bold text-green-700 mt-2 leading-tight">{t("home.about_card_3_title")}</p>
                                    <p className="font-inter text-sm md:text-base text-[var(--color-muted)] mt-1 font-semibold">{t("home.about_card_3_desc")}</p>
                                </div>
                            </motion.div>
                        </div>
                        <motion.div
                            className="space-y-4"
                            variants={revealRight}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-12%" }}
                            transition={{ duration: 0.9, delay: 0.14, ease: "easeOut" }}
                        >
                            <div className="rounded-3xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/30 to-white p-8 shadow-xl">
                                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold mb-4">
                                    <Truck className="w-4 h-4 text-gd-leaf" strokeWidth={1.5} aria-hidden />
                                    {t("home.about_delivery_badge")}
                                </p>
                                <p className="text-base leading-relaxed text-[var(--color-muted)] font-medium">
                                    <strong className="text-[var(--gd-color-forest)]">{t("home.about_delivery_strong")}</strong> {t("home.about_delivery_desc")}
                                </p>
                                <p className="mt-5 text-sm font-bold text-[var(--gd-color-forest)] border-t-2 border-[var(--gd-color-leaf)]/30 pt-4">
                                    {t("home.about_schedules")}
                                </p>
                            </div>

                            <div className="rounded-3xl border-2 border-[var(--gd-color-leaf)]/30 bg-white/95 p-6 shadow-lg">
                                <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[var(--gd-color-forest)]" />
                                    {t("home.contact_badge")}
                                </p>
                                <div className="mt-4 space-y-3 text-sm font-semibold text-[var(--gd-color-forest)]">
                                    <a
                                        href="tel:+18097537338"
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-white/80 px-4 py-3 transition hover:shadow-sm"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Phone className="w-5 h-5 text-gray-600 hover:text-green-600 transition" />
                                            {t("home.contact_tel")}
                                        </span>
                                        <span className="text-[var(--gd-color-text-muted)]">+1 (809) 753-7338</span>
                                    </a>
                                    <a
                                        href="mailto:greendolioexpress@gmail.com?subject=Consulta%20GreenDolio"
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-white/80 px-4 py-3 transition hover:shadow-sm"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Mail className="w-5 h-5 text-gray-600 hover:text-green-600 transition" />
                                            {t("home.contact_email")}
                                        </span>
                                        <span className="text-[var(--gd-color-text-muted)]">greendolioexpress@gmail.com</span>
                                    </a>
                                    <a
                                        href="https://instagram.com/green_dolio"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-white/80 px-4 py-3 transition hover:shadow-sm"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Instagram className="w-5 h-5 text-gray-600 hover:text-green-600 transition" />
                                            {t("home.contact_insta")}
                                        </span>
                                        <span className="text-[var(--gd-color-text-muted)]">@green_dolio</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </Container>
            </section>

            {/* CONTACTO - Más compacto */}
            <section id="contacto" className="relative bg-gradient-to-br from-[var(--gd-color-forest)] via-[var(--gd-color-avocado)] to-[var(--gd-color-forest)] py-16 text-white overflow-hidden scroll-mt-20 md:scroll-mt-24">
                {/* Efectos decorativos */}
                <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[var(--gd-color-leaf)]/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[var(--gd-color-sky)]/20 blur-3xl" />
                <Container className="relative z-10 space-y-10">
                    <motion.div
                        className="text-center space-y-4 max-w-3xl mx-auto"
                        variants={revealRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-15%" }}
                        transition={{ duration: 0.95, ease: "easeOut" }}
                    >
                        <p className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-white shadow-lg backdrop-blur-sm">
                            <Phone className="w-4 h-4 text-white" />
                            {t("home.contact_badge")}
                        </p>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl drop-shadow-lg font-bold text-green-800 bg-white/90 inline-block px-4 py-2 rounded-2xl shadow">
                            {t("home.contact_title")}
                        </h2>
                        <p className="font-display text-lg md:text-xl text-white/90 leading-relaxed font-medium drop-shadow-md">
                            {t("home.contact_desc")}
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto"
                        variants={staggerParent}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                    >
                        <a
                            href="tel:+18097537338"
                            className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
                        >
                            <div className="mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                <Phone className="w-10 h-10 text-white" />
                            </div>
                            <p className="font-display text-xl md:text-2xl font-bold mb-2">{t("home.contact_tel")}</p>
                            <p className="font-display text-sm md:text-base text-white/90 mb-4 font-medium">{t("home.contact_tel_desc")}</p>
                            <p className="text-xs text-white/70 font-semibold">+1 (809) 753-7338</p>
                        </a>

                        <a
                            href="mailto:greendolioexpress@gmail.com?subject=Consulta%20GreenDolio"
                            className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
                        >
                            <div className="mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                <Mail className="w-10 h-10 text-white" />
                            </div>
                            <p className="font-display text-xl md:text-2xl font-bold mb-2">{t("home.contact_email")}</p>
                            <p className="font-display text-sm md:text-base text-white/90 mb-4 font-medium">{t("home.contact_email_desc")}</p>
                            <p className="text-xs text-white/70 font-semibold break-all">greendolioexpress@gmail.com</p>
                        </a>

                        <a
                            href="https://instagram.com/green_dolio"
                            target="_blank"
                            rel="noreferrer"
                            className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
                        >
                            <div className="mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                <Instagram className="w-10 h-10 text-white" />
                            </div>
                            <p className="font-display text-xl md:text-2xl font-bold mb-2">{t("home.contact_insta")}</p>
                            <p className="font-display text-sm md:text-base text-white/90 mb-4 font-medium">{t("home.contact_insta_desc")}</p>
                            <p className="text-xs text-white/70 font-semibold">@green_dolio</p>
                        </a>
                    </motion.div>

                    <motion.div
                        className="rounded-3xl border-2 border-white/30 bg-white/15 p-8 max-w-2xl mx-auto text-center backdrop-blur-sm"
                        variants={revealLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                    >
                        <p className="text-base text-white/90 font-medium">
                            <strong className="text-white font-bold">{t("home.contact_schedule_strong")}</strong> {t("home.contact_schedule_text")}
                        </p>
                        <p className="text-sm text-white/70 mt-3 font-medium">{t("home.contact_delivery_info")}</p>
                    </motion.div>
                </Container>
            </section>

            {/* Sección de Formas de Pago */}
            <section id="pagos" className="py-20 bg-gradient-to-b from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)]/90 to-[var(--gd-color-forest)] scroll-mt-20 md:scroll-mt-24">
                <Container>
                    <motion.div
                        className="text-center mb-12"
                        variants={revealRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-15%" }}
                        transition={{ duration: 0.95, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 border-2 border-white/30 mb-3">
                            <CreditCard className="w-5 h-5 text-white" />
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white">{t("home.payment_badge")}</span>
                        </div>
                        <h2 className="mx-auto max-w-3xl font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-white">
                            {t("home.payment_title")}
                        </h2>
                        <p className="mt-3 text-base md:text-lg text-white/90 max-w-2xl mx-auto">{t("home.payment_desc")}</p>
                    </motion.div>

                    <motion.div
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto"
                        variants={staggerParent}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-10%" }}
                    >
                        <PaymentMethodCard
                            imageSrc="/assets/icons/payment_methods/01_payment_cash.webp"
                            title={t("home.payment_cash")}
                            description={t("home.payment_cash_desc")}
                        />
                        <PaymentMethodCard
                            imageSrc="/assets/icons/payment_methods/02_payment_bank_transfer.webp"
                            title={t("home.payment_transfer")}
                            description={t("home.payment_transfer_desc")}
                        />
                        <PaymentMethodCard
                            imageSrc="/assets/icons/payment_methods/03_payment_credit_card.webp"
                            title={t("home.payment_card")}
                            description={t("home.payment_card_desc")}
                        />
                        <PaymentMethodCard
                            imageSrc="/assets/icons/payment_methods/04_payment_paypal.webp"
                            title={t("home.payment_paypal")}
                            description={t("home.payment_paypal_desc")}
                        />
                    </motion.div>
                </Container>
            </section>
        </>
    );
}
