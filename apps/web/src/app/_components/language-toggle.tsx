"use client";

import { useLocale } from "@/modules/i18n/context";

export function LanguageToggle() {
  const { locale, locales, labels, setLocale } = useLocale();

  return (
    <div className="flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm shadow-sm">
      {locales.map((code, index) => {
        const active = code === locale;
        return (
          <div key={code} className="flex items-center">
            {index > 0 && <span className="mx-1 text-slate-300">|</span>}
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-label={labels[code]}
              title={labels[code]}
              className={[
                "transition-all duration-300 ease-in-out",
                active ? "font-bold text-emerald-600" : "text-slate-500 hover:underline",
              ].join(" ")}
            >
              {code.toUpperCase()}
            </button>
          </div>
        );
      })}
    </div>
  );
}
