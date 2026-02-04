"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "./container";
import { LanguageToggle } from "./language-toggle";
import { CartNavButton } from "./cart-nav-button";
import { UserAuthButton } from "./user-auth-button";
import { useTranslation } from "@/modules/i18n/use-translation";

export function PrimaryNav() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  const NAV_LINKS = [
    { href: "/#cajas", label: t("nav.boxes") },
    { href: "/#combos", label: t("nav.combos") },
    { href: "/como-funciona", label: t("nav.how_it_works") },
    { href: "/#catalogo", label: t("nav.catalog") },
    { href: "/#confianza", label: t("nav.about") },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-lg" : "bg-white"
      }`}
    >
      <Container className="flex h-16 md:h-20 items-center gap-4">
        <Link href="/" className="flex items-center gap-3 md:gap-4 group hover:opacity-90 transition-opacity shrink-0">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-gd-leaf/25">
            <Image
              src="/assets/images/logo/logo-vertical.png"
              alt="Green Dolio logo"
              fill
              sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 80px"
              className="object-contain p-1.5 sm:p-2"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <p className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gd-forest tracking-tight drop-shadow-sm">
              Green Dolio
            </p>
            <p className="hidden sm:block text-xs md:text-sm text-gd-leaf font-semibold mt-0.5">
              {t("nav.tagline")}
            </p>
          </div>
        </Link>

        <nav
          className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8 text-base md:text-lg font-display font-semibold text-gd-forest"
          aria-label="Primary"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-all hover:text-gd-leaf hover:scale-105 relative group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gd-leaf transition-all group-hover:w-full" />
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
