"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useUser } from "./context";
import { useAuth } from "@/modules/auth/context";
import { useTranslation } from "@/modules/i18n/use-translation";
import { OnboardingForm, type OnboardingFormData } from "./onboarding-form";
import { getAdminAllowedEmails } from "@/lib/config/env";
import { acquireBodyScrollLock, releaseBodyScrollLock } from "@/lib/dom/body-scroll-lock";

const CHECKOUT_DRAFT_KEY = "gd-checkout-draft";

const normalizePaymentPreference = (value: string): "" | "Cash" | "Transferencia" | "PayPal" => {
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
  const [initialFormData, setInitialFormData] = useState<Partial<OnboardingFormData> | undefined>();

  const isAdminUser = Boolean(
    user?.email &&
      getAdminAllowedEmails().some((email) => email.toLowerCase() === user.email?.toLowerCase()),
  );

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
      setInitialFormData({
        telefono: draft.contactPhone ?? "",
        direccion: draft.direccion ?? "",
        pagoPreferido: normalizePaymentPreference(draft.metodoPago ?? ""),
      });
    } catch {
      // ignore storage errors
    }
  }, [user?.uid]);

  const shouldShow = Boolean(user && !isAdminUser && isNewUser && !profileLoading);

  useEffect(() => {
    const lockId = "profile-onboarding-modal";
    if (!shouldShow) {
      releaseBodyScrollLock(lockId);
      return undefined;
    }
    acquireBodyScrollLock(lockId);
    return () => releaseBodyScrollLock(lockId);
  }, [shouldShow]);

  if (!shouldShow) return null;

  const handleSubmit = async (data: OnboardingFormData) => {
    if (!data.telefono.trim() || !data.direccion.trim() || !data.comoNosConocio) {
      toast.error(t("profile.required_error"));
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({
        telefono: data.telefono.trim(),
        direccion: data.direccion.trim(),
        pagoPreferido: data.pagoPreferido || undefined,
        comoNosConocio: data.comoNosConocio,
        likes: data.likes.trim() || undefined,
        dislikes: data.dislikes.trim() || undefined,
      });
      toast.success(t("profile.success_message"));
    } catch (error) {
      toast.error(t("profile.error_message"));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={(e) => e.stopPropagation()}
      style={{ position: "fixed" }}
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl flex flex-col max-h-[90vh] z-[var(--z-modal)]">
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0 flex items-start justify-between gap-4">
          <div>
            <h2 className="mb-2 font-display text-2xl text-[var(--color-foreground)]">
              {t("profile.welcome_title")}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">{t("profile.welcome_desc")}</p>
          </div>
        </div>

        <OnboardingForm
          displayName={user?.displayName ?? undefined}
          initialFormData={initialFormData}
          onSubmit={handleSubmit}
          onContinueAsGuest={handleGuest}
          submitting={submitting}
          loading={profileLoading}
          showNameField={true}
        />
      </div>
    </div>,
    document.body,
  );
}

