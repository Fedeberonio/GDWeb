"use client";

import Image from "next/image";
import { useAuth } from "@/modules/auth/context";
import { useUser } from "@/modules/user/context";

export function UserAuthButton() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const { profile } = useUser();

  const handleLogin = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("gd-show-profile-modal", "true");
      }
    } catch {
      // ignore storage errors
    }
    void loginWithGoogle();
  };

  if (loading) {
    return (
      <button
        disabled
        className="hidden md:flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/30 px-4 py-2 text-sm font-semibold text-[var(--gd-color-forest)] opacity-50"
      >
        <span className="animate-pulse">Cargando...</span>
      </button>
    );
  }

  if (!user) {
    return (
      <>
        {/* Versión móvil */}
        <button
          onClick={handleLogin}
          className="md:hidden flex items-center justify-center rounded-full border border-[var(--gd-color-leaf)]/30 bg-white p-2.5 text-[var(--gd-color-forest)] transition-all hover:bg-[var(--gd-color-leaf)]/10"
          title="Iniciar sesión"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </button>
        {/* Versión desktop */}
        <button
          onClick={handleLogin}
          className="hidden md:flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/30 bg-white px-4 py-2 text-sm font-semibold text-[var(--gd-color-forest)] transition-all hover:bg-[var(--gd-color-leaf)]/10 hover:border-[var(--gd-color-leaf)] hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          Iniciar sesión
        </button>
      </>
    );
  }

  return (
    <>
      {/* Versión móvil */}
      <div className="md:hidden flex items-center gap-2">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName ?? user.email ?? "Usuario"}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover border-2 border-[var(--gd-color-leaf)]"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] text-xs font-semibold text-white border-2 border-[var(--gd-color-leaf)]">
            {user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
        )}
        <button
          onClick={logout}
          className="rounded-full border border-red-200 p-2 text-red-600 transition-all hover:bg-red-50"
          title="Cerrar sesión"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
        </button>
      </div>
      {/* Versión desktop */}
      <div className="hidden md:flex items-center gap-3">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName ?? user.email ?? "Usuario"}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover border-2 border-[var(--gd-color-leaf)]"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] text-xs font-semibold text-white border-2 border-[var(--gd-color-leaf)]">
            {user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
        )}
        <div className="hidden lg:block text-xs">
          <p className="font-semibold text-[var(--gd-color-forest)]">
            {user.displayName ?? user.email?.split("@")[0]}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 hover:scale-105"
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </>
  );
}
