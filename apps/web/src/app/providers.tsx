"use client";

import { AuthProvider } from "@/modules/auth/context";
import { LanguageProvider } from "@/modules/i18n/context";
import { BoxBuilderProvider } from "@/modules/box-builder/context";
import { CartProvider } from "@/modules/cart/context";
import { ToastProvider } from "./_components/toast-provider";
import type { Locale } from "@/modules/i18n/locales";

type Props = {
  children: React.ReactNode;
  initialLocale: Locale;
};

export function Providers({ children, initialLocale }: Props) {
  return (
    <AuthProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <CartProvider>
          <BoxBuilderProvider>
            <ToastProvider />
            {children}
          </BoxBuilderProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
