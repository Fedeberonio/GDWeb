"use client";

import { useMemo } from "react";

import { getAdminAllowedEmails } from "@/lib/config/env";
import { useAuth } from "@/modules/auth/context";

function getAllowedEmailsCache(): Set<string> {
  try {
    return new Set(getAdminAllowedEmails());
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

  const isAuthorized = useMemo(() => {
    if (!user?.email) return false;
    const allowedEmailsCache = getAllowedEmailsCache();
    if (allowedEmailsCache.size === 0) return true;
    return allowedEmailsCache.has(user.email.toLowerCase());
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-soft">
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <p className="text-sm text-slate-600">
          Solo el equipo autorizado puede acceder al panel. Inicia sesión con tu cuenta corporativa.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          Ingresar con Google
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="space-y-4 rounded-3xl border border-red-200 bg-white p-8 text-center shadow-soft">
        <p className="text-sm text-red-600">
          Tu cuenta ({user.email}) no tiene permisos para acceder al panel administrativo.
        </p>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-300"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
