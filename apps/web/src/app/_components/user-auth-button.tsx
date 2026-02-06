"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut, ShoppingBag, User } from "lucide-react";

import { useAuth } from "@/modules/auth/context";

const openAuthModal = (mode: "login" | "signup" = "login") => {
  try {
    window.sessionStorage.setItem("gd-show-auth-modal", "true");
    window.sessionStorage.setItem("gd-auth-mode", mode);
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new Event("gd-auth-modal-open"));
};

export function UserAuthButton() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--gd-color-forest)] opacity-50"
        aria-label="Cargando usuario"
      >
        <span className="hidden sm:inline">Cargando...</span>
        <User className="h-6 w-6" aria-hidden="true" />
      </button>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("login")}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/90 px-3 py-2 text-sm font-semibold text-[var(--gd-color-forest)] shadow-sm transition-all duration-300 ease-in-out hover:bg-white hover:shadow-md"
        aria-label="Iniciar sesión"
      >
        <User className="h-6 w-6" aria-hidden="true" />
        <span className="hidden sm:inline">Iniciar Sesión</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/90 px-3 py-2 text-sm font-semibold text-[var(--gd-color-forest)] shadow-sm transition-all duration-300 ease-in-out hover:bg-white hover:shadow-md"
        aria-label="Menú de usuario"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <User className="h-6 w-6" aria-hidden="true" />
        <ChevronDown className="h-4 w-4 text-[var(--gd-color-forest)]/70" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Opciones de usuario"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-white/95 p-1 shadow-xl backdrop-blur-md"
        >
          <Link
            href="/mi-cuenta"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors duration-300 ease-in-out hover:bg-[var(--color-background-muted)]"
          >
            <User className="h-4 w-4 text-[var(--gd-color-forest)]" aria-hidden="true" />
            <span>Mi Cuenta</span>
          </Link>
          <Link
            href="/mis-pedidos"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors duration-300 ease-in-out hover:bg-[var(--color-background-muted)]"
          >
            <ShoppingBag className="h-4 w-4 text-[var(--gd-color-forest)]" aria-hidden="true" />
            <span>Mis Pedidos</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              try {
                await logout();
              } finally {
                setOpen(false);
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors duration-300 ease-in-out hover:bg-[var(--color-background-muted)]"
          >
            <LogOut className="h-4 w-4 text-red-600" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
