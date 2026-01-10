"use client";

import Image from "next/image";

import { useAuth } from "@/modules/auth/context";

export function AdminUserBadge() {
  const { user, loading, loginWithGoogle, logout } = useAuth();

  if (loading) {
    return <span className="text-xs text-slate-400">Autenticando...</span>;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={loginWithGoogle}
        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700"
      >
        Ingresar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <Image
          src={user.photoURL}
          alt={user.displayName ?? user.email ?? "Usuario"}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
          priority
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
          {user.email?.charAt(0).toUpperCase() ?? "U"}
        </div>
      )}
      <div className="text-xs text-slate-500">
        <p className="font-semibold text-slate-700">{user.displayName ?? user.email}</p>
        {user.email && <p>{user.email}</p>}
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-red-400 hover:text-red-500"
      >
        Salir
      </button>
    </div>
  );
}
