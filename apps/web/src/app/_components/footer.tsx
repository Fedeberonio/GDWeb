"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf, Recycle, Truck } from "lucide-react";
import { Container } from "./container";
import { useTranslation } from "@/modules/i18n/use-translation";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[var(--gd-color-forest)] text-white py-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-4">
          {/* Logo y tagline */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <div className="relative h-32 w-32 bg-white/5 rounded-xl p-2 backdrop-blur-sm">
                <Image
                  src="/assets/images/logo/logo-vertical.png"
                  alt="Green Dolio"
                  fill
                  sizes="(max-width: 768px) 128px, 128px"
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-white/80 text-sm max-w-xs">
              {t("nav.tagline")}. {t("hero.badge")}.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <p className="font-bold text-sm uppercase tracking-wider mb-4">{t("footer.navigation")}</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/#cajas" className="hover:text-white transition">{t("nav.boxes")}</Link></li>
              <li><Link href="/#recien-preparado" className="hover:text-white transition">{t("nav.freshly_prepared")}</Link></li>
              <li><Link href="/#catalogo" className="hover:text-white transition">{t("nav.catalog")}</Link></li>
              <li><Link href="/como-funciona" className="hover:text-white transition">{t("nav.how_it_works")}</Link></li>
              <li><Link href="/#confianza" className="hover:text-white transition">{t("nav.about")}</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <p className="font-bold text-sm uppercase tracking-wider mb-4">{t("footer.contact")}</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <a href="tel:+18097537338" className="hover:text-white transition">
                  +1 (809) 753-7338
                </a>
              </li>
              <li>
                <a href="mailto:greendolioexpress@gmail.com" className="hover:text-white transition">
                  greendolioexpress@gmail.com
                </a>
              </li>
              <li>
                <a href="https://instagram.com/green_dolio" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  @green_dolio
                </a>
              </li>
            </ul>
          </div>

          {/* Zonas de entrega */}
          <div>
            <p className="font-bold text-sm uppercase tracking-wider mb-4">{t("footer.delivery_zones")}</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li>Juan Dolio</li>
              <li>Boca Chica</li>
              <li>San Pedro de Macorís</li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria y copyright */}
        <div className="border-t border-white/20 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} Green Dolio. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/60">
            <Link href="/politica-de-privacidad" className="hover:text-white transition">{t("footer.privacy_policy")}</Link>
            <Link href="/terminos-de-uso" className="hover:text-white transition">{t("footer.terms_of_use")}</Link>
            <Link href="/politica-de-devoluciones" className="hover:text-white transition">{t("footer.returns_policy")}</Link>
          </div>
          <div className="flex gap-4 text-sm text-white/60">
            <span className="inline-flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              {t("footer.plastic_free")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Recycle className="w-4 h-4" />
              {t("footer.returnable")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Truck className="w-4 h-4" />
              {t("footer.delivery_days")}
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
