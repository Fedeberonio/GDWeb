"use client";

import { useEffect, useState } from "react";

import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { adminFetch } from "@/modules/admin/api/client";
import { DEFAULT_ORDER_SETTINGS, type OrderSettings } from "@/lib/config/order-settings";

const TABS = [
  { id: "profile", label: "Perfil" },
  { id: "company", label: "Empresa" },
  { id: "orders", label: "Pedidos" },
  { id: "notifications", label: "Notificaciones" },
];

const DELIVERY_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type TabId = (typeof TABS)[number]["id"];

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [settings, setSettings] = useState<OrderSettings>(DEFAULT_ORDER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const response = await adminFetch("/api/admin/settings/order-config", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error ?? "No se pudo cargar la configuración");
        }
        setSettings({ ...DEFAULT_ORDER_SETTINGS, ...(json?.data ?? {}) });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar configuración");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleToggleDay = (day: string) => {
    setSettings((prev) => {
      const currentDays = prev.deliveryFeeDays ?? [];
      const exists = currentDays.includes(day);
      const deliveryFeeDays = exists
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return { ...prev, deliveryFeeDays };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);
      const response = await adminFetch("/api/admin/settings/order-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo guardar la configuración");
      }
      setSettings({ ...DEFAULT_ORDER_SETTINGS, ...(json?.data ?? {}) });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

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

        {activeTab === "orders" && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">Configuración de pedidos</h3>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              Ajusta fees y descuentos usados en cálculo de pedidos.
            </p>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-white/60 bg-white/40 p-6 text-sm text-[var(--gd-color-text-muted)]">
                Cargando configuración...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-[var(--gd-color-text-muted)]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">Fee pago digital (%)</span>
                    <input
                      type="number"
                      min={0}
                      value={settings.paymentFeePercentage}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          paymentFeePercentage: Number(event.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-[var(--gd-color-text-muted)]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">Fee entrega (RD$)</span>
                    <input
                      type="number"
                      min={0}
                      value={settings.deliveryFeeAmount}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          deliveryFeeAmount: Number(event.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-[var(--gd-color-text-muted)]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">Descuento retorno (RD$)</span>
                    <input
                      type="number"
                      min={0}
                      value={settings.returnDiscountAmount}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          returnDiscountAmount: Number(event.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-[var(--gd-color-text-muted)]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">Tasa USD (DOP por 1 USD)</span>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      value={settings.usdExchangeRateDop}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          usdExchangeRateDop: Number(event.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-1">
                  <div className="space-y-2 text-sm text-[var(--gd-color-text-muted)]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">Días con fee</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {DELIVERY_DAYS.map((day) => (
                        <label key={day} className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={(settings.deliveryFeeDays ?? []).includes(day)}
                            onChange={() => handleToggleDay(day)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar configuración"}
                  </button>
                  {saved && <span className="text-sm text-emerald-600">Cambios guardados.</span>}
                  {error && <span className="text-sm text-red-600">{error}</span>}
                </div>
              </div>
            )}
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
