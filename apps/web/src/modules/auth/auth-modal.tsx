"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { FirebaseError } from "firebase/app";

import { useAuth } from "@/modules/auth/context";
import { useUser } from "@/modules/user/context";
import { useTranslation } from "@/modules/i18n/use-translation";
import { getFirestoreDb } from "@/lib/firebase/client";
import { createUserProfile, updateUserProfile } from "@/modules/user/firestore";
import { OnboardingForm, type OnboardingFormData } from "@/modules/user/onboarding-form";
import { getAdminAllowedEmails } from "@/lib/config/env";
import { acquireBodyScrollLock, releaseBodyScrollLock } from "@/lib/dom/body-scroll-lock";

const AUTH_MODAL_FLAG = "gd-show-auth-modal";
const AUTH_MODAL_EVENT = "gd-auth-modal-open";
const AUTH_MODE_KEY = "gd-auth-mode";

type AuthMode = "login" | "signup" | "onboarding";

export function AuthModal() {
  const {
    user,
    loginWithGoogle,
    loginWithEmailPassword,
    signupWithEmailPassword,
    logout,
    clearError,
    loading: authLoading,
    error,
  } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useUser();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [localError, setLocalError] = useState<string | null>(null);
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpen = () => {
      setIsOpen(true);
      try {
        const storedMode = window.sessionStorage.getItem(AUTH_MODE_KEY);
        if (storedMode === "login" || storedMode === "signup") {
          setMode(storedMode);
        }
      } catch {
        // ignore storage errors
      }
    };
    window.addEventListener(AUTH_MODAL_EVENT, handleOpen);
    try {
      if (window.sessionStorage.getItem(AUTH_MODAL_FLAG)) {
        setIsOpen(true);
        const storedMode = window.sessionStorage.getItem(AUTH_MODE_KEY);
        if (storedMode === "login" || storedMode === "signup") {
          setMode(storedMode);
        }
      }
    } catch {
      // ignore storage errors
    }
    return () => {
      window.removeEventListener(AUTH_MODAL_EVENT, handleOpen);
    };
  }, []);

  useEffect(() => {
    const lockId = "auth-modal";
    if (!isOpen) {
      releaseBodyScrollLock(lockId);
      return undefined;
    }
    acquireBodyScrollLock(lockId);
    return () => releaseBodyScrollLock(lockId);
  }, [isOpen]);

  // Master Effect: Manage flow based on User and Profile state
  useEffect(() => {
    if (!isOpen || !user || profileLoading) return;

    const isAdminUser = Boolean(
      user?.email &&
        getAdminAllowedEmails().some((email) => email.toLowerCase() === user.email?.toLowerCase()),
    );

    if (isAdminUser) {
      closeModal();
      return;
    }

    // Check if profile is complete (Phone, Address, HeardFrom are mandatory)
    // We strictly follow the definition of "Onboarding required"
    const isProfileComplete =
      !!profile?.telefono &&
      !!profile?.direccion &&
      !!profile?.comoNosConocio;

    // Debug Log
    console.log("AuthModal Effect:", JSON.stringify({
      isOpen,
      user: user?.uid,
      profileLoaded: !!profile,
      isProfileComplete,
      mode,
      phone: profile?.telefono
    }, null, 2));

    if (isProfileComplete) {
      // If profile is complete, WE MUST CLOSE.
      // Previously we waited for submit handler, but if that fails or lags, we get stuck.
      // Force close if open.
      closeModal();
    } else {
      // Profile incomplete -> Force onboarding
      if (mode !== "onboarding") {
        setMode("onboarding");
      }
    }
  }, [isOpen, user, profile, profileLoading, mode]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const storedMode = window.sessionStorage.getItem(AUTH_MODE_KEY);
      // If we are not forcing onboarding, respect stored mode
      if (mode !== "onboarding") {
        setMode(storedMode === "signup" || storedMode === "login" ? storedMode : "login");
      }
    } catch {
      if (mode !== "onboarding") setMode("login");
    }
    setLocalError(null);
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLocalError(null);
    clearError();
  }, [isOpen, mode, clearError]);

  const activeError = localError ?? error ?? null;
  const emailAuthEnabled = !(
    activeError &&
    (activeError.includes("auth/operation-not-allowed") || activeError.includes("operation-not-allowed"))
  );

  if (!isOpen || typeof window === "undefined") return null;

  const closeModal = () => {
    setIsOpen(false);
    setMode("login"); // Reset to login for next time, unless overridden by open event
    setLocalError(null);
    clearError();
    setFormState({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(AUTH_MODAL_FLAG);
        window.sessionStorage.removeItem(AUTH_MODE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!formState.email.trim() || !formState.password.trim()) {
      setLocalError(t("auth.error_required"));
      return;
    }
    // Logic handled by Master Effect: 
    // If login succeeds, `user` updates -> Effect checks profile -> Closes or Onboards
    await loginWithEmailPassword(formState.email.trim(), formState.password);
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!formState.name.trim() || !formState.email.trim() || !formState.password.trim()) {
      setLocalError(t("auth.error_required"));
      return;
    }
    if (formState.password.length < 6) {
      setLocalError(t("auth.error_password_length"));
      return;
    }
    if (formState.password !== formState.confirmPassword) {
      setLocalError(t("auth.error_password_match"));
      return;
    }

    try {
      const success = await signupWithEmailPassword(
        formState.email.trim(),
        formState.password,
        formState.name.trim(),
      );
      if (!success) return;
    } catch (err) {
      console.error("Signup error:", err);
    }
  };

  const handleOnboardingSubmit = async (data: OnboardingFormData) => {
    if (!user) return;
    setOnboardingSubmitting(true);
    try {
      const db = getFirestoreDb();
      if (!db) throw new Error("Firebase no disponible");

      const resolvedDisplayName = (user.displayName || profile?.displayName || formState.name || "").trim();
      const commonUpdates = {
        displayName: resolvedDisplayName || undefined,
        email: user.email ?? "",
        telefono: (data.telefono || "").trim(),
        direccion: (data.direccion || "").trim(),
        pagoPreferido: data.pagoPreferido || undefined,
        comoNosConocio: data.comoNosConocio,
        likes: (data.likes || "").trim() || undefined,
        dislikes: (data.dislikes || "").trim() || undefined,
      };

      // 1. Guardar perfil (evitar sobrescribir si ya existe)
      if (profile) {
        await updateUserProfile(db, user.uid, commonUpdates);
      } else {
        try {
          await updateUserProfile(db, user.uid, commonUpdates);
        } catch (error) {
          const isNotFound =
            error instanceof FirebaseError &&
            (error.code === "not-found" || error.code === "not-found-document");
          if (!isNotFound) {
            throw error;
          }
          await createUserProfile(db, user.uid, {
            displayName: resolvedDisplayName || "",
            email: user.email ?? "",
            telefono: (data.telefono || "").trim(),
            direccion: (data.direccion || "").trim(),
            pagoPreferido: data.pagoPreferido || undefined,
            comoNosConocio: data.comoNosConocio,
            likes: (data.likes || "").trim() || undefined,
            dislikes: (data.dislikes || "").trim() || undefined,
          });
        }
      }

      // 2. Refrescar estado global (opcional para cerrar el modal, pero bueno para la UI)
      try {
        await refreshProfile();
      } catch (e) {
        console.warn("Profile refresh warning:", e);
      }

      // 3. Cerrar Modal explícitamente y notificar
      toast.success(t("profile.success_message"));

      console.log("Onboarding success, forcing close.");

      // Forzar cierre asegurando que el modo cambie para evitar reaperturas por efectos
      setIsOpen(false);
      setMode("login");
      clearError();

      // Limpiar flags de sesion
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(AUTH_MODAL_FLAG);
        window.sessionStorage.removeItem(AUTH_MODE_KEY);
      }

    } catch (err) {
      toast.error(t("profile.error_message"));
      console.error("Onboarding error:", err);
    } finally {
      setOnboardingSubmitting(false);
    }
  };

  const handleOnboardingGuest = async () => {
    await logout();
    closeModal();
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    // Logic handled by Master Effect
    await loginWithGoogle();
  };

  const showOnboarding = mode === "onboarding" && !!user;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={showOnboarding ? undefined : closeModal}
    >
      <div
        className={`w-full rounded-3xl bg-white shadow-xl flex flex-col z-[var(--z-modal)] animate-modal-in ${showOnboarding ? "max-w-2xl max-h-[90vh]" : "max-w-xl"
          }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="font-display text-2xl text-[var(--color-foreground)]">
            {showOnboarding ? t("profile.welcome_title") : t("auth.title")}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)] hover:bg-[var(--color-background-muted)]"
          >
            {t("auth.close")}
          </button>
        </div>

        {showOnboarding ? (
          <>
            <p className="px-6 pt-2 text-sm text-[var(--color-muted)]">
              {t("profile.welcome_desc")}
            </p>
            <OnboardingForm
              displayName={user?.displayName ?? formState.name}
              initialFormData={profile ? {
                telefono: profile.telefono,
                direccion: profile.direccion,
                pagoPreferido: profile.pagoPreferido,
                comoNosConocio: profile.comoNosConocio,
                likes: profile.likes,
                dislikes: profile.dislikes,
              } : undefined}
              onSubmit={handleOnboardingSubmit}
              onContinueAsGuest={handleOnboardingGuest}
              submitting={onboardingSubmitting}
              loading={profileLoading}
              showNameField={true}
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-6 pt-5">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "login"
                  ? "bg-[var(--gd-color-forest)] text-white shadow-soft"
                  : "border border-[var(--gd-color-forest)]/30 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)]/10"
                  }`}
              >
                {t("auth.login_tab")}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "signup"
                  ? "bg-[var(--gd-color-forest)] text-white shadow-soft"
                  : "border border-[var(--gd-color-forest)]/30 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)]/10"
                  }`}
              >
                {t("auth.signup_tab")}
              </button>
            </div>

            <div className="px-6 py-5">
              {emailAuthEnabled ? (
                mode === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
                        {t("auth.email_label")}
                      </label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, email: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
                        {t("auth.password_label")}
                      </label>
                      <input
                        type="password"
                        value={formState.password}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, password: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                        required
                      />
                    </div>
                    {activeError ? (
                      <p className="text-xs text-red-600">{activeError}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-full bg-[var(--gd-color-forest)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--gd-color-leaf)] disabled:opacity-60"
                    >
                      {authLoading ? t("auth.loading") : t("auth.login_button")}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
                        {t("auth.name_label")}
                      </label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, name: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
                        {t("auth.email_label")}
                      </label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, email: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
                        {t("auth.password_label")}
                      </label>
                      <input
                        type="password"
                        value={formState.password}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, password: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
                        {t("auth.confirm_password_label")}
                      </label>
                      <input
                        type="password"
                        value={formState.confirmPassword}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
                        required
                      />
                    </div>
                    {activeError ? (
                      <p className="text-xs text-red-600">{activeError}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-full bg-[var(--gd-color-forest)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--gd-color-leaf)] disabled:opacity-60"
                    >
                      {authLoading ? t("auth.loading") : t("auth.signup_button")}
                    </button>
                  </form>
                )
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-muted)] p-4 text-sm text-[var(--color-muted)]">
                  {t("auth.email_password_disabled")}
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                <span className="h-px flex-1 bg-[var(--color-border)]" />
                {t("auth.or")}
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="mt-4 w-full rounded-full border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-background-muted)] disabled:opacity-60"
              >
                {t("auth.google_button")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
