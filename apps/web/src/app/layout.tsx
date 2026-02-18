import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Montserrat, Open_Sans } from "next/font/google";
import { Providers } from "./providers";
import { ConditionalSocialButtons } from "./_components/conditional-social-buttons";
import { AuthModal } from "@/modules/auth/auth-modal";
import { ProfileFormModal } from "@/modules/user/profile-form-modal";
import "./globals.css";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/modules/i18n/locales";
import { translations } from "@/modules/i18n/translations";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
});

const BASE_METADATA: Metadata = {
  title: {
    default: "Green Dolio | De la huerta a tu puerta",
    template: "%s | Green Dolio",
  },
  description:
    "Green Dolio ofrece cajas frescas, productos a la carta y entregas flexibles en República Dominicana. Productos locales, empaques retornables y cero residuos.",
  keywords: [
    "productos frescos",
    "cajas de frutas",
    "vegetales locales",
    "República Dominicana",
    "delivery",
    "productos orgánicos",
    "sostenibilidad",
    "Juan Dolio",
    "Santo Domingo",
  ],
  icons: {
    icon: "/assets/images/logo/favicon.png",
    apple: "/assets/images/logo/favicon.png",
  },
  openGraph: {
    title: "Green Dolio | De la huerta a tu puerta",
    description: "Cajas frescas de productos locales en República Dominicana. Empaques retornables, cero residuos y productores aliados.",
    url: "https://greendolio.shop",
    siteName: "Green Dolio",
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Dolio | De la huerta a tu puerta",
    description: "Cajas frescas de productos locales en República Dominicana",
  },
};

async function resolveInitialLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("gd-locale")?.value;
  return localeCookie && isLocale(localeCookie) ? localeCookie : DEFAULT_LOCALE;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = await resolveInitialLocale();

  return (
    <html lang={initialLocale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Caveat+Brush&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          as="image"
          href="/assets/images/hero/hero-lifestyle-kitchen.jpg"
          imageSrcSet="/assets/images/hero/hero-lifestyle-kitchen.jpg 1x, /assets/images/hero/hero-lifestyle-kitchen@2x.webp 2x"
          imageSizes="100vw"
        />
      </head>
      <body className={`${montserrat.variable} ${openSans.variable} antialiased bg-organic-texture`}>
        <Providers initialLocale={initialLocale}>
          {children}
          <ConditionalSocialButtons />
          <AuthModal />
          <ProfileFormModal />
        </Providers>
      </body>
    </html>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveInitialLocale();
  const localized = translations[locale];
  const defaultTitle = localized["meta.title"];
  const description = localized["meta.description"];
  return {
    ...BASE_METADATA,
    title: {
      default: defaultTitle,
      template: "%s | Green Dolio",
    },
    description,
    openGraph: {
      ...BASE_METADATA.openGraph,
      title: defaultTitle,
      description,
      locale: locale === "en" ? "en_US" : "es_DO",
    },
    twitter: {
      ...BASE_METADATA.twitter,
      title: defaultTitle,
      description,
    },
  };
}
