"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useUser } from "./context";
import { useAuth } from "@/modules/auth/context";
import { useTranslation } from "@/modules/i18n/use-translation";

const CHECKOUT_DRAFT_KEY = "gd-checkout-draft";

const normalizePaymentPreference = (value: string) => {
  if (value === "Cash" || value === "Transferencia" || value === "PayPal") {
    return value;
  }
  return "";
};

export function ProfileFormModal() {
  const { user, logout } = useAuth();
  const { isNewUser, updateProfile, loading: profileLoading } = useUser();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    telefono: "",
    direccion: "",
    pagoPreferido: "" as "" | "Cash" | "Transferencia" | "PayPal",
    comoNosConocio: "",
    likes: "",
    dislikes: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawDraft = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as {
        contactPhone?: string;
        direccion?: string;
        metodoPago?: string;
      };
      setFormData((prev) => ({
        ...prev,
        telefono: prev.telefono || draft.contactPhone || "",
        direccion: prev.direccion || draft.direccion || "",
        pagoPreferido: prev.pagoPreferido || normalizePaymentPreference(draft.metodoPago || ""),
      }));
    } catch {
      // ignore storage errors
    }
  }, [user?.uid]);

  const shouldShow = Boolean(user && isNewUser && !profileLoading);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!shouldShow) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.telefono.trim() || !formData.direccion.trim() || !formData.comoNosConocio) {
      toast.error(t("profile.required_error"));
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        pagoPreferido: formData.pagoPreferido || undefined,
        comoNosConocio: formData.comoNosConocio,
        likes: formData.likes.trim() || undefined,
        dislikes: formData.dislikes.trim() || undefined,
      });
      toast.success(t("profile.success_message"));
    } catch (error) {
      toast.error(t("profile.error_message"));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  // Render using Portal to escape parent stacking contexts
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={(e) => {
        // No cerrar al hacer clic en el fondo (el formulario es obligatorio)
        e.stopPropagation();
      }}
      style={{ position: "fixed" }}
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl flex flex-col max-h-[90vh] z-[10000]">
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0 flex items-start justify-between gap-4">
          <div>
            <h2 className="mb-2 font-display text-2xl text-[var(--color-foreground)]">
              {t("profile.welcome_title")}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {t("profile.welcome_desc")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              {t("profile.name_label")}{" "}
              <span className="text-gray-400">{t("profile.prefilled_note")}</span>
            </label>
            <input
              type="text"
              value={user?.displayName || ""}
              disabled
              className="w-full rounded-2xl border border-[var(--color-border)] bg-gray-50 px-4 py-2 text-sm"
            />
          </div>

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
                  pagoPreferido: e.target.value as "Cash" | "Transferencia" | "PayPal" | "",
                })
              }
              className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            >
              <option value="">{t("profile.payment_placeholder")}</option>
              <option value="Cash">{t("profile.payment_cash")}</option>
              <option value="Transferencia">{t("profile.payment_transfer")}</option>
              <option value="PayPal">{t("profile.payment_paypal")}</option>
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
              <option value="WhatsApp">{t("profile.heard_whatsapp")}</option>
              <option value="Flyer">{t("profile.heard_flyer")}</option>
              <option value="Instagram">{t("profile.heard_instagram")}</option>
              <option value="TikTok">{t("profile.heard_tiktok")}</option>
              <option value="YouTube">{t("profile.heard_youtube")}</option>
              <option value="Google">{t("profile.heard_google")}</option>
              <option value="IA">{t("profile.heard_ai")}</option>
              <option value="Recomendación">{t("profile.heard_referral")}</option>
              <option value="¡Lo soñé!">{t("profile.heard_dream")}</option>
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
              disabled={submitting || profileLoading}
              className="flex-1 rounded-full bg-[var(--gd-color-forest)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--gd-color-leaf)] disabled:opacity-50"
            >
              {submitting ? t("profile.saving_button") : t("profile.save_button")}
            </button>
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="flex-1 rounded-full border border-[var(--gd-color-forest)]/30 px-6 py-3 text-sm font-semibold text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/10"
            >
              {t("profile.guest_button")}
            </button>
          </div>
          <p className="px-6 pb-6 text-xs text-[var(--color-muted)]">
            {t("profile.guest_hint")}
          </p>
        </form>
      </div>
    </div>,
    document.body
  );
}
