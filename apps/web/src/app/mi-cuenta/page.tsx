"use client";

import { PrimaryNav } from "../_components/primary-nav";
import { Container } from "../_components/container";
import { useAuth } from "@/modules/auth/context";
import { useUser } from "@/modules/user/context";

const openAuthModal = (mode: "login" | "signup" = "login") => {
  try {
    window.sessionStorage.setItem("gd-show-auth-modal", "true");
    window.sessionStorage.setItem("gd-auth-mode", mode);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("gd-auth-modal-open"));
};

export default function MiCuentaPage() {
  const { user, loading, logout } = useAuth();
  const { profile, loading: profileLoading } = useUser();

  return (
    <div className="min-h-screen bg-gd-beige text-slate-950">
      <PrimaryNav />
      <main className="py-10">
        <Container className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">Cuenta</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--gd-color-forest)]">Mi Cuenta</h1>
            <p className="text-sm text-[var(--color-muted)]">Revisa tu información y tu acceso.</p>
          </header>

          {loading ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-6 text-sm text-[var(--color-muted)]">
              Cargando…
            </div>
          ) : !user ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
              <p className="text-sm text-[var(--color-muted)]">Inicia sesión para ver tu cuenta.</p>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors duration-300 ease-in-out hover:bg-emerald-600"
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-3xl border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
                <h2 className="text-base font-bold text-[var(--gd-color-forest)]">Acceso</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-muted)]">Nombre</dt>
                    <dd className="font-semibold text-[var(--color-foreground)]">{user.displayName ?? "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-muted)]">Email</dt>
                    <dd className="font-semibold text-[var(--color-foreground)]">{user.email ?? "—"}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="mt-5 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-colors duration-300 ease-in-out hover:bg-red-50"
                >
                  Cerrar Sesión
                </button>
              </section>

              <section className="rounded-3xl border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
                <h2 className="text-base font-bold text-[var(--gd-color-forest)]">Información</h2>
                {profileLoading ? (
                  <p className="mt-4 text-sm text-[var(--color-muted)]">Cargando perfil…</p>
                ) : (
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[var(--color-muted)]">Teléfono</dt>
                      <dd className="font-semibold text-[var(--color-foreground)]">{profile?.telefono ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[var(--color-muted)]">Dirección</dt>
                      <dd className="font-semibold text-[var(--color-foreground)]">{profile?.direccion ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[var(--color-muted)]">Pago preferido</dt>
                      <dd className="font-semibold text-[var(--color-foreground)]">{profile?.pagoPreferido ?? "—"}</dd>
                    </div>
                  </dl>
                )}
                <p className="mt-4 text-xs text-[var(--color-muted)]">
                  Edición de perfil avanzada: próximamente.
                </p>
              </section>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

