"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "./locales";

const COOKIE_NAME = "gd-locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

type LocaleContextValue = {
  locale: Locale;
  locales: readonly Locale[];
  labels: Record<Locale, string>;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type Props = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function LanguageProvider({ children, initialLocale = DEFAULT_LOCALE }: Props) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (typeof window === "undefined") return;

    document.documentElement.setAttribute("lang", locale);
    document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, [locale]);

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      locales: SUPPORTED_LOCALES,
      labels: LOCALE_LABELS,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within a LanguageProvider");
  }

  return context;
}
