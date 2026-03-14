import { useCallback } from "react";
import { useLocale } from "./context";
import { translations, type TranslationKey } from "./translations";
import type { LocalizedString } from "@/modules/catalog/types";

export function useTranslation() {
    const { locale } = useLocale();

    const t = useCallback(
        (key: TranslationKey): string => {
            const translation = translations[locale][key];
            if (!translation) {
                console.warn(`Missing translation for key: ${key} in locale: ${locale}`);
                // Fallback to Spanish if key exists there, otherwise return key
                return translations["es"][key as TranslationKey] || key;
            }
            return translation;
        },
        [locale]
    );

    // Helper to extract string from LocalizedString object based on current locale
    const tData = useCallback(
        (data?: LocalizedString | Partial<LocalizedString> | string | null): string => {
            if (!data) return "";
            if (typeof data === "string") return data;

            const val = data[locale];
            if (val) return val;

            // Fallback
            return data["es"] || data["en"] || "";
        },
        [locale]
    );

    const tDataWithLocale = useCallback(
        (data: LocalizedString | Partial<LocalizedString> | string | null | undefined, localeOverride: "es" | "en") => {
            if (!data) return "";
            if (typeof data === "string") return data;
            const val = data[localeOverride];
            if (val) return val;
            return data["es"] || data["en"] || "";
        },
        []
    );

    return { t, tData, tDataWithLocale, locale };
}
