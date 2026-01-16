"use client";

import { useLocale } from "@/modules/i18n/context";

const LOCALE_FLAGS: Record<string, string> = {
  es: "🇩🇴",
  en: "🇺🇸",
};

export function LanguageToggle() {
  const { locale, locales, labels, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-1 py-1 text-xs shadow-sm">
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-label={labels[code]}
            title={labels[code]}
            className={`rounded-full px-3 py-1 font-medium transition ${
              active ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-base leading-none">{LOCALE_FLAGS[code] ?? "🌐"}</span>
          </button>
        );
      })}
    </div>
  );
}
