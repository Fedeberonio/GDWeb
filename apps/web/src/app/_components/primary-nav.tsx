"use client";

import Image from "next/image";
import Link from "next/link";

import { Container } from "./container";
import { LanguageToggle } from "./language-toggle";
import { CartNavButton } from "./cart-nav-button";
import { UserAuthButton } from "./user-auth-button";
import { useTranslation } from "@/modules/i18n/use-translation";

export function PrimaryNav() {
  const { t } = useTranslation();

  const NAV_LINKS = [
    { href: "#cajas", label: t("nav.boxes") },
    { href: "#combos", label: t("nav.combos") },
    { href: "#catalogo", label: t("nav.catalog") },
    { href: "#confianza", label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/98 shadow-lg backdrop-blur-md border-b-2 border-[var(--gd-color-leaf)]/20">
      <Container className="flex items-center justify-between py-4 md:py-5">
        <Link href="/" className="flex items-center gap-4 md:gap-5 group hover:opacity-90 transition-opacity">
          {/* Logo vertical - MÁS GRANDE Y VISIBLE */}
          <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden -my-1 drop-shadow-md">
            <Image
              src="/images/logo/logo-vertical.png"
              alt="Green Dolio logo"
              fill
              sizes="(max-width: 768px) 80px, 96px"
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <p className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--gd-color-forest)] leading-tight tracking-tight drop-shadow-sm">
              Green Dolio
            </p>
            <p className="text-sm md:text-base text-[var(--gd-color-leaf)] font-semibold mt-0.5">{t("nav.tagline")}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:gap-8 text-base md:text-lg font-display font-semibold text-[var(--gd-color-forest)] lg:flex">
          {NAV_LINKS.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="transition-all hover:text-[var(--gd-color-leaf)] hover:scale-105 relative group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--gd-color-leaf)] transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <CartNavButton />
          <UserAuthButton />
          <LanguageToggle />
          <Link
            href="#contacto"
            className="hidden items-center rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-2.5 text-sm md:text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl md:inline-flex"
          >
            {t("nav.contact")}
          </Link>
        </div>
      </Container>
    </header>
  );
}
