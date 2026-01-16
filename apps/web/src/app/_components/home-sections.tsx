"use client";

import Image from "next/image";
import { Container } from "./container";
import { useTranslation } from "@/modules/i18n/use-translation";

const DELIVERY_ZONES = [
    {
        key: "jd",
        nameKey: "home.zone_jd_name",
        detailsKey: "home.zone_jd_details",
    },
    {
        key: "bc",
        nameKey: "home.zone_bc_name",
        detailsKey: "home.zone_bc_details",
    },
    {
        key: "spm",
        nameKey: "home.zone_spm_name",
        detailsKey: "home.zone_spm_details",
    },
] as const;

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

    return (
        <>
            {/* POR QUÉ ELEGIR GREEN DOLIO - Simplificado */}
            <section className="bg-[var(--gd-color-beige)] py-16">
                <Container className="space-y-10">
                    <div className="text-center space-y-3 max-w-3xl mx-auto">
                        <p className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)] bg-white px-5 py-2 text-sm font-bold text-[var(--gd-color-forest)]">
                            ✨ {t("home.values_badge")}
                        </p>
                        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--gd-color-forest)] font-bold">
                            {t("home.values_title")}
                        </h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            {
                                title: t("home.values_1_title"),
                                subtitle: t("home.values_1_subtitle"),
                                description: t("home.values_1_desc"),
                                icon: "🌱",
                            },
                            {
                                title: t("home.values_2_title"),
                                subtitle: t("home.values_2_subtitle"),
                                description: t("home.values_2_desc"),
                                icon: "♻️",
                            },
                            {
                                title: t("home.values_3_title"),
                                subtitle: t("home.values_3_subtitle"),
                                description: t("home.values_3_desc"),
                                icon: "🚚",
                            },
                        ].map((item) => (
                            <article key={item.title} className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/30 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--gd-color-leaf)]">
                                <div className="space-y-4">
                                    <div className="text-4xl">{item.icon}</div>
                                    <div>
                                        <p className="font-display text-sm font-bold text-[var(--gd-color-leaf)] mb-1">{item.subtitle}</p>
                                        <h3 className="font-display text-xl md:text-2xl text-[var(--gd-color-forest)] font-bold">{item.title}</h3>
                                    </div>
                                    <p className="font-display text-base text-[var(--gd-color-text-muted)] leading-relaxed font-medium">{item.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </Container>
            </section>

            {/* LOGÍSTICA Y CONFIANZA - Combinadas y más compactas */}
            <section id="logistica" className="bg-[var(--color-background-muted)] py-16">
                <Container className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] items-stretch">
                    <div className="space-y-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-brand)]">{t("home.logistics_badge")}</p>
                        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--color-foreground)] font-bold">
                            {t("home.logistics_title")}
                        </h2>
                        <p className="font-display text-base md:text-lg text-[var(--color-muted)] font-medium">
                            {t("home.logistics_desc")}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {DELIVERY_ZONES.map((zone) => (
                                <div
                                    key={zone.key}
                                    className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-4 shadow-soft"
                                >
                                    <p className="font-display text-lg text-[var(--color-foreground)]">{t(zone.nameKey)}</p>
                                    <p className="text-sm text-[var(--color-muted)]">{t(zone.detailsKey)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[var(--color-brand)] via-[var(--color-accent-cool)] to-[var(--color-brand-accent)] text-white shadow-soft">
                        <div className="absolute inset-6 rounded-[32px] border border-white/10" />
                        <div className="absolute inset-0 opacity-50">
                            <div className="absolute left-10 top-14 h-3 w-3 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.5)]" />
                            <div className="absolute left-20 top-28 h-2 w-2 rounded-full bg-white/60" />
                            <div className="absolute right-16 top-24 h-4 w-4 rounded-full bg-white" />
                            <div className="absolute right-10 bottom-16 h-2.5 w-2.5 rounded-full bg-white/70" />
                            <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 rotate-6 bg-white/40" />
                            <div className="absolute left-1/2 top-[45%] h-px w-48 -translate-x-1/2 -rotate-12 bg-white/30" />
                        </div>
                        <div className="relative z-10 flex h-full flex-col gap-6 p-8">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/80">{t("home.windows_badge")}</p>
                                <p className="text-2xl font-display">{t("home.windows_title")}</p>
                            </div>
                            <div className="space-y-4">
                                {DELIVERY_WINDOWS.map((slot) => (
                                    <div key={slot.labelKey} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">{t(slot.labelKey)}</p>
                                            <p className="font-display text-lg">{t(slot.windowKey)}</p>
                                        </div>
                                        <p className="text-xs text-white/80">{t(slot.noteKey)}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-white/80">
                                {t("home.windows_footer")}
                            </p>
                        </div>
                    </div>
                </Container>
            </section>

            {/* CONFIANZA - Combinada con logística arriba, más compacta */}
            <section id="confianza" className="relative bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white py-16 overflow-hidden">
                {/* Imagen de fondo decorativa más visible */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.2] hidden lg:block">
                    <Image
                        src="/images/hero/lifestyle-local-ingredients.jpg"
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
                    <div className="grid gap-8 lg:grid-cols-[1.3fr,0.7fr]">
                        <div className="space-y-6">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--gd-color-leaf)]/30 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] text-[var(--gd-color-forest)] shadow-sm mb-4">
                                    🏡 {t("home.about_badge")}
                                </p>
                                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] bg-clip-text text-transparent font-bold mb-4">
                                    {t("home.about_title")}
                                </h2>
                                <p className="font-display text-lg md:text-xl text-[var(--color-muted)] leading-relaxed font-medium">
                                    {t("home.about_desc")}
                                    <strong className="text-[var(--gd-color-forest)] font-bold"> {t("home.about_desc_strong")}</strong> {t("home.about_desc_suffix")}
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">📍 {t("home.about_card_1_badge")}</p>
                                    <p className="font-display text-xl md:text-2xl font-bold text-[var(--color-foreground)] mt-2">{t("home.about_card_1_title")}</p>
                                    <p className="font-display text-sm md:text-base text-[var(--color-muted)] mt-1 font-semibold">{t("home.about_card_1_desc")}</p>
                                </div>
                                <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">⭐ {t("home.about_card_2_badge")}</p>
                                    <p className="font-display text-xl md:text-2xl font-bold text-[var(--color-foreground)] mt-2">{t("home.about_card_2_title")}</p>
                                    <p className="font-display text-sm md:text-base text-[var(--color-muted)] mt-1 font-semibold">{t("home.about_card_2_desc")}</p>
                                </div>
                                <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-[var(--gd-color-sprout)]/40 via-white to-[var(--gd-color-leaf)]/20 p-6 transition-all duration-300 hover:shadow-xl hover:border-[var(--gd-color-leaf)] hover:-translate-y-1">
                                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">💬 {t("home.about_card_3_badge")}</p>
                                    <p className="font-display text-xl md:text-2xl font-bold text-[var(--color-foreground)] mt-2">{t("home.about_card_3_title")}</p>
                                    <p className="font-display text-sm md:text-base text-[var(--color-muted)] mt-1 font-semibold">{t("home.about_card_3_desc")}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-3xl border-2 border-[var(--gd-color-leaf)]/40 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/30 to-white p-8 shadow-xl">
                                <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold mb-4">🚚 {t("home.about_delivery_badge")}</p>
                                <p className="text-base leading-relaxed text-[var(--color-muted)] font-medium">
                                    <strong className="text-[var(--gd-color-forest)]">{t("home.about_delivery_strong")}</strong> {t("home.about_delivery_desc")}
                                </p>
                                <p className="mt-5 text-sm font-bold text-[var(--gd-color-forest)] border-t-2 border-[var(--gd-color-leaf)]/30 pt-4">
                                    {t("home.about_schedules")}
                                </p>
                            </div>

                            <div className="rounded-3xl border-2 border-[var(--gd-color-leaf)]/30 bg-white/95 p-6 shadow-lg">
                                <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)] font-bold">
                                    📞 {t("home.contact_badge")}
                                </p>
                                <div className="mt-4 space-y-3 text-sm font-semibold text-[var(--gd-color-forest)]">
                                    <a
                                        href="tel:+18493757338"
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-white/80 px-4 py-3 transition hover:shadow-sm"
                                    >
                                        <span className="flex items-center gap-2">📞 {t("home.contact_tel")}</span>
                                        <span className="text-[var(--gd-color-text-muted)]">+1 (849) 375-7338</span>
                                    </a>
                                    <a
                                        href="mailto:greendolioexpress@gmail.com?subject=Consulta%20GreenDolio"
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-white/80 px-4 py-3 transition hover:shadow-sm"
                                    >
                                        <span className="flex items-center gap-2">📧 {t("home.contact_email")}</span>
                                        <span className="text-[var(--gd-color-text-muted)]">greendolioexpress@gmail.com</span>
                                    </a>
                                    <a
                                        href="https://instagram.com/green_dolio"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-white/80 px-4 py-3 transition hover:shadow-sm"
                                    >
                                        <span className="flex items-center gap-2">📱 {t("home.contact_insta")}</span>
                                        <span className="text-[var(--gd-color-text-muted)]">@green_dolio</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* CONTACTO - Más compacto */}
            <section id="contacto" className="relative bg-gradient-to-br from-[var(--gd-color-forest)] via-[var(--gd-color-avocado)] to-[var(--gd-color-forest)] py-16 text-white overflow-hidden">
                {/* Efectos decorativos */}
                <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[var(--gd-color-leaf)]/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[var(--gd-color-sky)]/20 blur-3xl" />
                <Container className="relative z-10 space-y-10">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <p className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-white shadow-lg backdrop-blur-sm">
                            📞 {t("home.contact_badge")}
                        </p>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl drop-shadow-lg font-bold">{t("home.contact_title")}</h2>
                        <p className="font-display text-lg md:text-xl text-white/90 leading-relaxed font-medium drop-shadow-md">
                            {t("home.contact_desc")}
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
                        <a
                            href="tel:+18493757338"
                            className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
                        >
                            <div className="mb-5 text-5xl transition-transform duration-300 group-hover:scale-110">📞</div>
                            <p className="font-display text-xl md:text-2xl font-bold mb-2">{t("home.contact_tel")}</p>
                            <p className="font-display text-sm md:text-base text-white/90 mb-4 font-medium">{t("home.contact_tel_desc")}</p>
                            <p className="text-xs text-white/70 font-semibold">+1 (849) 375-7338</p>
                        </a>

                        <a
                            href="mailto:greendolioexpress@gmail.com?subject=Consulta%20GreenDolio"
                            className="group rounded-3xl border-2 border-white/30 bg-white/15 p-8 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl"
                        >
                            <div className="mb-5 text-5xl transition-transform duration-300 group-hover:scale-110">📧</div>
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
                            <div className="mb-5 text-5xl transition-transform duration-300 group-hover:scale-110">📱</div>
                            <p className="font-display text-xl md:text-2xl font-bold mb-2">{t("home.contact_insta")}</p>
                            <p className="font-display text-sm md:text-base text-white/90 mb-4 font-medium">{t("home.contact_insta_desc")}</p>
                            <p className="text-xs text-white/70 font-semibold">@green_dolio</p>
                        </a>
                    </div>

                    <div className="rounded-3xl border-2 border-white/30 bg-white/15 p-8 max-w-2xl mx-auto text-center backdrop-blur-sm">
                        <p className="text-base text-white/90 font-medium">
                            <strong className="text-white font-bold">{t("home.contact_schedule_strong")}</strong> {t("home.contact_schedule_text")}
                        </p>
                        <p className="text-sm text-white/70 mt-3 font-medium">{t("home.contact_delivery_info")}</p>
                    </div>
                </Container>
            </section>

            {/* Sección de Formas de Pago */}
            <section id="pagos" className="py-20 bg-gradient-to-b from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)]/90 to-[var(--gd-color-forest)]">
                <Container>
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 border-2 border-white/30 mb-4">
                            <span className="text-sm">💳</span>
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white">{t("home.payment_badge")}</span>
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">{t("home.payment_title")}</h2>
                        <p className="text-lg text-white/90 max-w-2xl mx-auto">{t("home.payment_desc")}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                        <div className="group rounded-3xl border-2 border-white/30 bg-white/15 p-6 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">💵</div>
                            <p className="font-display text-lg md:text-xl font-bold mb-2 text-white">{t("home.payment_cash")}</p>
                            <p className="text-sm text-white/80 font-medium">{t("home.payment_cash_desc")}</p>
                        </div>

                        <div className="group rounded-3xl border-2 border-white/30 bg-white/15 p-6 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">🏦</div>
                            <p className="font-display text-lg md:text-xl font-bold mb-2 text-white">{t("home.payment_transfer")}</p>
                            <p className="text-sm text-white/80 font-medium">{t("home.payment_transfer_desc")}</p>
                        </div>

                        <div className="group rounded-3xl border-2 border-white/30 bg-white/15 p-6 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">🅿️</div>
                            <p className="font-display text-lg md:text-xl font-bold mb-2 text-white">{t("home.payment_paypal")}</p>
                            <p className="text-sm text-white/80 font-medium">{t("home.payment_paypal_desc")}</p>
                        </div>

                        <div className="group rounded-3xl border-2 border-white/30 bg-white/15 p-6 text-center transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 hover:shadow-xl">
                            <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">💳</div>
                            <p className="font-display text-lg md:text-xl font-bold mb-2 text-white">{t("home.payment_card")}</p>
                            <p className="text-sm text-white/80 font-medium">{t("home.payment_card_desc")}</p>
                        </div>
                    </div>
                </Container>
            </section>
        </>
    );
}
