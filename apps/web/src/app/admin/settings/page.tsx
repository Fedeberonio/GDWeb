"use client";

import { useState } from "react";

import { AdminGuard } from "@/modules/admin/components/admin-guard";

const TABS = [
  { id: "profile", label: "Perfil" },
  { id: "company", label: "Empresa" },
  { id: "notifications", label: "Notificaciones" },
];

type TabId = (typeof TABS)[number]["id"];

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--gd-color-forest)]">Configuración</h2>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              Ajustes básicos del panel. Próximamente se conectará a Firebase.
            </p>
          </div>
          <div className="flex gap-2 rounded-2xl bg-white/50 p-2 border border-white/60">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)]"
                      : "text-[var(--gd-color-text-muted)] hover:text-[var(--gd-color-forest)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        {activeTab === "profile" && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">Perfil</h3>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              Actualiza tu nombre, email y preferencias de acceso.
            </p>
            <div className="rounded-2xl border border-dashed border-white/60 bg-white/40 p-6 text-sm text-[var(--gd-color-text-muted)]">
              Campos de perfil disponibles próximamente.
            </div>
          </div>
        )}

        {activeTab === "company" && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">Empresa</h3>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              Configura datos fiscales, branding y puntos de venta.
            </p>
            <div className="rounded-2xl border border-dashed border-white/60 bg-white/40 p-6 text-sm text-[var(--gd-color-text-muted)]">
              Información empresarial en preparación.
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">Notificaciones</h3>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              Administra alertas de pedidos, stock y facturación.
            </p>
            <div className="rounded-2xl border border-dashed border-white/60 bg-white/40 p-6 text-sm text-[var(--gd-color-text-muted)]">
              Preferencias de notificación disponibles pronto.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <SettingsContent />
    </AdminGuard>
  );
}
