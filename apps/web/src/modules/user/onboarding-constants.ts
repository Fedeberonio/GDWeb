import type { TranslationKey } from "@/modules/i18n/translations";

/**
 * Lead Source options for "How did you find us?" — must match across Email and Google onboarding.
 */
export const LEAD_SOURCE_OPTIONS = [
  "WhatsApp",
  "Flyer",
  "Instagram",
  "TikTok",
  "YouTube",
  "Google",
  "IA",
  "Recomendación",
  "¡Lo soñé!",
] as const;

export type LeadSourceValue = (typeof LEAD_SOURCE_OPTIONS)[number];

/**
 * Preferred payment options — must match across onboarding and checkout.
 */
export const PAYMENT_OPTIONS = [
  { value: "Cash" as const, labelKey: "profile.payment_cash" },
  { value: "Transferencia" as const, labelKey: "profile.payment_transfer" },
  { value: "PayPal" as const, labelKey: "profile.payment_paypal" },
] as const;

export type PaymentPreferenceValue = (typeof PAYMENT_OPTIONS)[number]["value"];

const LEAD_SOURCE_LABEL_KEYS: Record<LeadSourceValue, TranslationKey> = {
  WhatsApp: "profile.heard_whatsapp",
  Flyer: "profile.heard_flyer",
  Instagram: "profile.heard_instagram",
  TikTok: "profile.heard_tiktok",
  YouTube: "profile.heard_youtube",
  Google: "profile.heard_google",
  IA: "profile.heard_ai",
  Recomendación: "profile.heard_referral",
  "¡Lo soñé!": "profile.heard_dream",
};

export function getLeadSourceLabelKey(value: LeadSourceValue): TranslationKey {
  return LEAD_SOURCE_LABEL_KEYS[value];
}
