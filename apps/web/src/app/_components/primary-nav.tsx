"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";

import { Container } from "./container";
import { LanguageToggle } from "./language-toggle";
import { CartNavButton } from "./cart-nav-button";
import { UserAuthButton } from "./user-auth-button";
import { useTranslation } from "@/modules/i18n/use-translation";
import { acquireBodyScrollLock, releaseBodyScrollLock } from "@/lib/dom/body-scroll-lock";

export function PrimaryNav() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownHref, setOpenDropdownHref] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const NAV_LINKS = [
    { href: "/#cajas", label: t("nav.boxes") },
    {
      href: "/#recien-preparado",
      label: t("nav.freshly_prepared"),
      children: [
        { href: "/#recien-preparado-ensaladas", label: t("nav.prepared_salads") },
        { href: "/#recien-preparado-jugos", label: t("nav.prepared_juices") },
        { href: "/#recien-preparado-dips", label: t("nav.prepared_dips") },
      ],
    },
    {
      href: "/#catalogo",
      label: t("nav.catalog"),
      children: [
        { href: "/categoria/productos-de-granja", label: t("nav.catalog_farm_products") },
        { href: "/categoria/frutas", label: t("nav.catalog_fruits") },
        { href: "/categoria/vegetales", label: t("nav.catalog_vegetables") },
        { href: "/categoria/hierbas-y-especias", label: t("nav.catalog_herbs_spices") },
        { href: "/categoria/otros", label: t("nav.catalog_others") },
      ],
    },
    { href: "/como-funciona", label: t("nav.how_it_works") },
    { href: "/#confianza", label: t("nav.about") },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const lockId = "primary-nav-mobile-menu";
    if (isMobileMenuOpen) {
      acquireBodyScrollLock(lockId);
      return () => releaseBodyScrollLock(lockId);
    }
    releaseBodyScrollLock(lockId);
    return undefined;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!openDropdownHref) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!navRef.current) return;
      const target = event.target as Node;
      if (!navRef.current.contains(target)) {
        setOpenDropdownHref(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenDropdownHref(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [openDropdownHref]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[var(--z-nav)] transition-all duration-300 ${
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
            ref={navRef}
            className="hidden lg:flex flex-1 items-center justify-center gap-5 xl:gap-6 text-base md:text-lg font-display font-semibold text-gd-forest"
            aria-label="Primary"
          >
            {NAV_LINKS.map((item) => (
              <div
                key={item.href}
                className="relative group"
                onMouseEnter={() => {
                  if (item.children?.length) setOpenDropdownHref(item.href);
                }}
                onMouseLeave={() => {
                  if (item.children?.length) setOpenDropdownHref((current) => (current === item.href ? null : current));
                }}
              >
                <Link
                  href={item.href}
                  onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                    if (!item.children?.length) return;
                    if (openDropdownHref !== item.href) {
                      event.preventDefault();
                      setOpenDropdownHref(item.href);
                      return;
                    }
                    setOpenDropdownHref(null);
                  }}
                  onFocus={() => {
                    if (item.children?.length) setOpenDropdownHref(item.href);
                  }}
                  className="transition-all hover:text-gd-leaf hover:scale-105 relative inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gd-leaf transition-all group-hover:w-full" />
                </Link>
                {item.children && item.children.length > 0 && (
                  <div
                    className={`absolute left-1/2 top-full z-[var(--z-dropdown)] mt-3 w-64 -translate-x-1/2 rounded-2xl border border-gd-leaf/20 bg-white/95 p-2 shadow-2xl backdrop-blur-md transition-all duration-200 ${
                      openDropdownHref === item.href
                        ? "visible opacity-100"
                        : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                    }`}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpenDropdownHref(null)}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-gd-forest transition-colors hover:bg-gd-sprout/20"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0">
            <CartNavButton />
            <div className="hidden lg:block">
              <UserAuthButton />
            </div>
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex lg:hidden items-center justify-center rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/90 p-2.5 text-[var(--gd-color-forest)] shadow-sm transition-all duration-300 ease-in-out hover:bg-white hover:shadow-md"
              aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-primary-nav"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </Container>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden pt-16 md:pt-20" aria-hidden={!isMobileMenuOpen}>
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menu movil"
          />

          <div
            id="mobile-primary-nav"
            className="relative mx-4 mt-3 rounded-2xl border border-gd-leaf/20 bg-white/95 p-4 shadow-2xl backdrop-blur-md"
          >
            <nav className="flex flex-col gap-1" aria-label="Primary mobile">
              {NAV_LINKS.map((item) => (
                <div key={item.href} className="rounded-xl border border-transparent">
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-xl px-4 py-3 text-base font-display font-semibold text-gd-forest transition-colors hover:bg-gd-sprout/20"
                  >
                    {item.label}
                  </Link>
                  {item.children && item.children.length > 0 && (
                    <div className="mt-1 space-y-1 px-3 pb-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-gd-forest/80 transition-colors hover:bg-gd-sprout/15 hover:text-gd-forest"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-4 border-t border-gd-leaf/15 pt-4 flex items-center justify-between gap-3">
              <LanguageToggle />
              <UserAuthButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
