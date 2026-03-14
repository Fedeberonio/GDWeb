"use client";

import { useMemo } from "react";

import { getAdminAllowedEmails } from "@/lib/config/env";
import { useAuth } from "@/modules/auth/context";
import { useTranslation } from "@/modules/i18n/use-translation";

function getAllowedEmailsCache(): Set<string> {
  try {
    const emails = getAdminAllowedEmails();
    console.log("[AdminGuard] Allowed emails:", emails);
    console.log("[AdminGuard] Env vars:", {
      ADMIN_ALLOWED_EMAILS: process.env.ADMIN_ALLOWED_EMAILS,
      NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS: process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS,
    });
    return new Set(emails);
  } catch (error) {
    console.error("Failed to parse admin allowed emails", error);
    return new Set<string>();
  }
}

type AdminGuardProps = {
  children: React.ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading, error, loginWithGoogle, logout } = useAuth();
  const { t } = useTranslation();

  const isAuthorized = useMemo(() => {
    if (!user?.email) return false;
    const allowedEmailsCache = getAllowedEmailsCache();
    console.log("[AdminGuard] Checking authorization:", {
      userEmail: user.email,
      allowedEmails: Array.from(allowedEmailsCache),
      isAuthorized: allowedEmailsCache.has(user.email.toLowerCase()),
    });
    if (allowedEmailsCache.size === 0) return false;
    return allowedEmailsCache.has(user.email.toLowerCase());
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-soft">
        {t("admin.guard.verifying")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <p className="text-sm text-slate-600">
          {t("admin.guard.access_denied_desc")}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          {t("admin.guard.login_google")}
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="space-y-4 rounded-3xl border border-red-200 bg-white p-8 text-center shadow-soft">
        <p className="text-sm text-red-600">
          {t("admin.guard.account")} ({user.email}) {t("admin.guard.no_permissions")}
        </p>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-300"
        >
          {t("admin.guard.logout")}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
