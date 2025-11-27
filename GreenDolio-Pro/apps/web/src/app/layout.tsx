import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Montserrat, Patua_One } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/modules/i18n/locales";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const patuaOne = Patua_One({
  subsets: ["latin"],
  variable: "--font-patua",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
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
    icon: "/favicon.ico",
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
      <body className={`${montserrat.variable} ${patuaOne.variable} antialiased`}>
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
