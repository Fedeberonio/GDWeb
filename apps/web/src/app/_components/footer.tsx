"use client";

import Image from "next/image";
import Link from "next/link";
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
                  src="/images/logo/logo-vertical.png"
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
              <li><Link href="#cajas" className="hover:text-white transition">{t("nav.boxes")}</Link></li>
              <li><Link href="#combos" className="hover:text-white transition">{t("nav.combos")}</Link></li>
              <li><Link href="#catalogo" className="hover:text-white transition">{t("nav.catalog")}</Link></li>
              <li><Link href="#confianza" className="hover:text-white transition">{t("nav.about")}</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <p className="font-bold text-sm uppercase tracking-wider mb-4">{t("footer.contact")}</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <a href="tel:+18493757338" className="hover:text-white transition">
                  +1 (849) 375-7338
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
          <div className="flex gap-4 text-sm text-white/60">
            <span>🌱 {t("footer.plastic_free")}</span>
            <span>♻️ {t("footer.returnable")}</span>
            <span>🚚 {t("footer.delivery_days")}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
