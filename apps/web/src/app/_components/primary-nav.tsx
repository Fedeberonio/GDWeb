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
      <Container className="flex items-center gap-4 py-4 md:py-5">
        <Link href="/" className="flex items-center gap-3 md:gap-4 group hover:opacity-90 transition-opacity shrink-0">
          <div className="relative h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-[var(--gd-color-leaf)]/25">
            <Image
              src="/images/logo/logo-vertical.png"
              alt="Green Dolio logo"
              fill
              sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 96px"
              className="object-contain p-2"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <p className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--gd-color-forest)] tracking-tight drop-shadow-sm">
              Green Dolio
            </p>
            <p className="hidden sm:block text-xs md:text-sm text-[var(--gd-color-leaf)] font-semibold mt-0.5">
              {t("nav.tagline")}
            </p>
          </div>
        </Link>

        <nav
          className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8 text-base md:text-lg font-display font-semibold text-[var(--gd-color-forest)]"
          aria-label="Primary"
        >
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

        <div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0">
          <CartNavButton />
          <UserAuthButton />
          <LanguageToggle />
        </div>
      </Container>
    </header>
  );
}
