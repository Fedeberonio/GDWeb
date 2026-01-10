import Image from "next/image";
import Link from "next/link";

import { Container } from "./container";
import { LanguageToggle } from "./language-toggle";
import { CartNavButton } from "./cart-nav-button";

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "#cajas", label: "Cajas" },
  { href: "#combos", label: "Combos" },
  { href: "#catalogo", label: "Catálogo" },
  { href: "#confianza", label: "Experiencia" },
  { href: "#contacto", label: "Contacto" },
];

export async function PrimaryNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 shadow-sm backdrop-blur">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-soft">
            <Image
              src="/images/logo/logo-vertical.jpg"
              alt="Green Dolio logo"
              fill
              sizes="48px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.35em] text-[var(--color-brand)]">Green Dolio</p>
            <p className="text-xs text-[var(--color-muted)]">De la huerta a tu puerta</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--color-muted)] sm:flex">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[var(--color-brand)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CartNavButton />
          <LanguageToggle />
          <Link
            href="#contacto"
            className="hidden items-center rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-brand-accent)] sm:inline-flex"
          >
            Pedir ahora
          </Link>
        </div>
      </Container>
    </header>
  );
}
