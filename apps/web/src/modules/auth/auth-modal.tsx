"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/modules/auth/context";
import { useTranslation } from "@/modules/i18n/use-translation";

const AUTH_MODAL_FLAG = "gd-show-auth-modal";
const AUTH_MODAL_EVENT = "gd-auth-modal-open";
const AUTH_MODE_KEY = "gd-auth-mode";

type AuthMode = "login" | "signup";

export function AuthModal() {
  const {
    user,
    loginWithGoogle,
    loginWithEmailPassword,
    signupWithEmailPassword,
    clearError,
    loading,
    error,
  } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [localError, setLocalError] = useState<string | null>(null);
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
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!user) return;
    setIsOpen(false);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(AUTH_MODAL_FLAG);
        window.sessionStorage.removeItem(AUTH_MODE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const storedMode = window.sessionStorage.getItem(AUTH_MODE_KEY);
      setMode(storedMode === "signup" || storedMode === "login" ? storedMode : "login");
    } catch {
      setMode("login");
    }
    setLocalError(null);
    clearError();
  }, [isOpen, clearError]);

  useEffect(() => {
    if (!isOpen) return;
    setLocalError(null);
    clearError();
  }, [isOpen, mode, clearError]);

  if (!isOpen || typeof window === "undefined") return null;

  const closeModal = () => {
    setIsOpen(false);
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
    const ok = await loginWithEmailPassword(formState.email.trim(), formState.password);
    if (ok) {
      closeModal();
    }
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
    const ok = await signupWithEmailPassword(
      formState.email.trim(),
      formState.password,
      formState.name.trim(),
    );
    if (ok) {
      closeModal();
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    const ok = await loginWithGoogle();
    if (ok) {
      closeModal();
    }
  };

  const activeError = localError ?? error;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-xl flex flex-col z-[10000]"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-display text-2xl text-[var(--color-foreground)]">
            {t("auth.title")}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)] hover:bg-[var(--color-background-muted)]"
          >
            {t("auth.close")}
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 pt-5">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-[var(--gd-color-forest)] text-white shadow-soft"
                : "border border-[var(--gd-color-forest)]/30 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)]/10"
            }`}
          >
            {t("auth.login_tab")}
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-[var(--gd-color-forest)] text-white shadow-soft"
                : "border border-[var(--gd-color-forest)]/30 text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)]/10"
            }`}
          >
            {t("auth.signup_tab")}
          </button>
        </div>

        <div className="px-6 py-5">
          {mode === "login" ? (
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
                disabled={loading}
                className="w-full rounded-full bg-[var(--gd-color-forest)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--gd-color-leaf)] disabled:opacity-60"
              >
                {loading ? t("auth.loading") : t("auth.login_button")}
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
                disabled={loading}
                className="w-full rounded-full bg-[var(--gd-color-forest)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--gd-color-leaf)] disabled:opacity-60"
              >
                {loading ? t("auth.loading") : t("auth.signup_button")}
              </button>
            </form>
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
            disabled={loading}
            className="mt-4 w-full rounded-full border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-background-muted)] disabled:opacity-60"
          >
            {t("auth.google_button")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
