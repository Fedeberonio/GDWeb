"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/modules/i18n/use-translation";
import type { TranslationKey } from "@/modules/i18n/translations";
import {
  LEAD_SOURCE_OPTIONS,
  PAYMENT_OPTIONS,
  getLeadSourceLabelKey,
  type PaymentPreferenceValue,
} from "./onboarding-constants";

export type OnboardingFormData = {
  telefono: string;
  direccion: string;
  pagoPreferido: "" | PaymentPreferenceValue;
  comoNosConocio: string;
  likes: string;
  dislikes: string;
};

const normalizePaymentPreference = (value: string): "" | PaymentPreferenceValue => {
  if (value === "Cash" || value === "Transferencia" || value === "PayPal") {
    return value;
  }
  return "";
};

type OnboardingFormProps = {
  displayName?: string | null;
  initialFormData?: Partial<OnboardingFormData>;
  onSubmit: (data: OnboardingFormData) => Promise<void>;
  onContinueAsGuest: () => void | Promise<void>;
  submitting?: boolean;
  loading?: boolean;
  showNameField?: boolean;
  titleKey?: TranslationKey;
  descKey?: TranslationKey;
  guestHintKey?: TranslationKey;
};

export function OnboardingForm({
  displayName,
  initialFormData,
  onSubmit,
  onContinueAsGuest,
  submitting = false,
  loading = false,
  showNameField = true,
  titleKey = "profile.welcome_title",
  descKey = "profile.welcome_desc",
  guestHintKey = "profile.guest_hint",
}: OnboardingFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<OnboardingFormData>({
    telefono: "",
    direccion: "",
    pagoPreferido: "",
    comoNosConocio: "",
    likes: "",
    dislikes: "",
  });

  useEffect(() => {
    if (initialFormData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Form state must hydrate when async profile data loads.
      setFormData((prev) => ({
        ...prev,
        ...initialFormData,
        pagoPreferido: initialFormData.pagoPreferido
          ? normalizePaymentPreference(initialFormData.pagoPreferido)
          : prev.pagoPreferido,
      }));
    }
  }, [initialFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.telefono.trim() || !formData.direccion.trim() || !formData.comoNosConocio) {
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="p-6 pt-4 space-y-4 overflow-y-auto flex-1">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{t(titleKey)}</h2>
          <p className="text-sm text-[var(--color-muted)]">{t(descKey)}</p>
        </header>

        {showNameField && displayName !== undefined && (
          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              {t("profile.name_label")}{" "}
              <span className="text-gray-400">{t("profile.prefilled_note")}</span>
            </label>
            <input
              type="text"
              value={displayName ?? ""}
              disabled
              className="w-full rounded-2xl border border-[var(--color-border)] bg-gray-50 px-4 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
            {t("profile.phone_label")} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            placeholder={t("profile.phone_placeholder")}
            required
            className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
            {t("profile.address_label")} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder={t("profile.address_placeholder")}
            required
            rows={2}
            className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
            {t("profile.payment_label")}
          </label>
          <select
            value={formData.pagoPreferido}
            onChange={(e) =>
              setFormData({
                ...formData,
                pagoPreferido: normalizePaymentPreference(e.target.value),
              })
            }
            className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          >
            <option value="">{t("profile.payment_placeholder")}</option>
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
            {t("profile.heard_from_label")} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.comoNosConocio}
            onChange={(e) => setFormData({ ...formData, comoNosConocio: e.target.value })}
            required
            className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          >
            <option value="">{t("profile.heard_from_placeholder")}</option>
            {LEAD_SOURCE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(getLeadSourceLabelKey(value))}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
            {t("profile.likes_label")}
          </label>
          <textarea
            value={formData.likes}
            onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
            placeholder={t("profile.likes_placeholder")}
            rows={2}
            className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
            {t("profile.dislikes_label")}
          </label>
          <textarea
            value={formData.dislikes}
            onChange={(e) => setFormData({ ...formData, dislikes: e.target.value })}
            placeholder={t("profile.dislikes_placeholder")}
            rows={2}
            className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 flex-shrink-0 bg-white rounded-b-3xl">
        <button
          type="submit"
          disabled={submitting || loading}
          className="flex-1 rounded-full bg-[var(--gd-color-forest)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--gd-color-leaf)] disabled:opacity-50"
        >
          {submitting ? t("profile.saving_button") : t("profile.save_button")}
        </button>
        <button
          type="button"
          onClick={onContinueAsGuest}
          className="flex-1 rounded-full border border-[var(--gd-color-forest)]/30 px-6 py-3 text-sm font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/10"
        >
          {t("profile.guest_button")}
        </button>
      </div>
      <p className="px-6 pb-6 text-xs text-[var(--color-muted)]">{t(guestHintKey)}</p>
    </form>
  );
}
