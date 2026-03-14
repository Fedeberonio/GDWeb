import type { LocalizedString } from "./types";

type LocalizedInput = Record<string, string> | string | undefined | null;

function normalizeLocalizedString(
  value?: LocalizedInput,
  fallbackEs?: string,
  fallbackEn?: string,
): LocalizedString {
  if (typeof value === "string") {
    return { es: value, en: value };
  }

  const esCandidate = (value as Record<string, string>)?.es ?? fallbackEs ?? fallbackEn;
  const enCandidate = (value as Record<string, string>)?.en ?? fallbackEn ?? fallbackEs;

  const es = typeof esCandidate === "string" ? esCandidate : "";
  const en = typeof enCandidate === "string" ? enCandidate : es;

  return { es, en };
}

function resolveFieldFallback(
  data: Record<string, unknown>,
  field: string,
  suffixes: string[],
): string | undefined {
  for (const suffix of suffixes) {
    const raw = data[`${field}${suffix}`];
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw;
    }
  }
  return undefined;
}

export function resolveLocalizedField(
  data: Record<string, unknown>,
  field: string,
): LocalizedString {
  const rawValue = data[field] as LocalizedInput;
  const fallbackEs = resolveFieldFallback(data, field, ["_es", "Es"]);
  const fallbackEn = resolveFieldFallback(data, field, ["_en", "En"]);
  return normalizeLocalizedString(rawValue, fallbackEs, fallbackEn);
}

export function buildLocalizedValue(
  value: LocalizedInput,
  fallbackEs?: string,
  fallbackEn?: string,
): LocalizedString {
  return normalizeLocalizedString(value, fallbackEs, fallbackEn);
}
