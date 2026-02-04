"use client";

import Link from "next/link";
import { PrimaryNav } from "../_components/primary-nav";
import { Container } from "../_components/container";
import { useAuth } from "@/modules/auth/context";

const openAuthModal = (mode: "login" | "signup" = "login") => {
  try {
    window.sessionStorage.setItem("gd-show-auth-modal", "true");
    window.sessionStorage.setItem("gd-auth-mode", mode);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("gd-auth-modal-open"));
};

export default function MisPedidosPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gd-beige text-slate-950">
      <PrimaryNav />
      <main className="py-10">
        <Container className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">Pedidos</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--gd-color-forest)]">Mis Pedidos</h1>
            <p className="text-sm text-[var(--color-muted)]">Historial y estado de tus pedidos.</p>
          </header>

          {loading ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-6 text-sm text-[var(--color-muted)]">
              Cargando…
            </div>
          ) : !user ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
              <p className="text-sm text-[var(--color-muted)]">Inicia sesión para ver tus pedidos.</p>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors duration-300 ease-in-out hover:bg-emerald-600"
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
              <p className="text-sm text-[var(--color-muted)]">
                Próximamente: historial completo dentro de la web.
              </p>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Mientras tanto, puedes finalizar tus pedidos desde el carrito o escribirnos por WhatsApp.
              </p>
              <Link
                href="/#cajas"
                className="mt-5 inline-flex items-center justify-center rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-white px-6 py-3 text-sm font-semibold text-[var(--gd-color-forest)] transition-all duration-300 ease-in-out hover:bg-[var(--color-background-muted)]"
              >
                Ver Cajas
              </Link>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

