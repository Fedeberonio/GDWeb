"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useUser } from "./context";
import { useAuth } from "@/modules/auth/context";

export function ProfileFormModal() {
  const { user } = useAuth();
  const { isNewUser, updateProfile, loading: profileLoading } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    telefono: "",
    direccion: "",
    pagoPreferido: "" as "" | "Cash" | "Transferencia" | "PayPal",
    comoNosConocio: "",
    likes: "",
    dislikes: "",
  });

  if (!isNewUser || !user) return null;

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.telefono.trim() || !formData.direccion.trim() || !formData.comoNosConocio) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        pagoPreferido: formData.pagoPreferido || undefined,
        comoNosConocio: formData.comoNosConocio,
        likes: formData.likes.trim() || undefined,
        dislikes: formData.dislikes.trim() || undefined,
      });
      toast.success("¡Gracias! Tu perfil ha sido guardado.");
    } catch (error) {
      toast.error("Error al guardar el perfil. Por favor intenta de nuevo.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Render using Portal to escape parent stacking contexts
  if (typeof window === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={(e) => {
        // No cerrar al hacer clic en el fondo (el formulario es obligatorio)
        e.stopPropagation();
      }}
      style={{ position: "fixed" }}
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl flex flex-col max-h-[90vh] z-[10000]">
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="mb-2 font-display text-2xl text-[var(--color-foreground)]">
            ¡Bienvenid@ a Green Dolio! 👋
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Para completar tu registro, necesitamos algunos datos adicionales:
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              Nombre <span className="text-gray-400">(pre-llenado)</span>
            </label>
            <input
              type="text"
              value={user.displayName || ""}
              disabled
              className="w-full rounded-2xl border border-[var(--color-border)] bg-gray-50 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="809-123-4567"
              required
              className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              Dirección <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle Principal #123, Santo Domingo"
              required
              rows={2}
              className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              Método de pago preferido
            </label>
            <select
              value={formData.pagoPreferido}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pagoPreferido: e.target.value as "Cash" | "Transferencia" | "PayPal" | "",
                })
              }
              className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            >
              <option value="">Selecciona una opción</option>
              <option value="Cash">Efectivo / Cash</option>
              <option value="Transferencia">Transferencia Bancaria / Bank Transfer</option>
              <option value="PayPal">PayPal (+10%)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              ¿Cómo nos conociste? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.comoNosConocio}
              onChange={(e) => setFormData({ ...formData, comoNosConocio: e.target.value })}
              required
              className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            >
              <option value="">Selecciona una opción</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Flyer">Flyer</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Google">Google</option>
              <option value="IA">IA</option>
              <option value="Recomendación">Recomendación</option>
              <option value="¡Lo soñé!">¡Lo soñé!</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              Gustos (opcional)
            </label>
            <textarea
              value={formData.likes}
              onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
              placeholder="Productos que SIEMPRE quieres recibir (ej: Aguacates, mangos, fresas)"
              rows={2}
              className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-1">
              Disgustos (opcional)
            </label>
            <textarea
              value={formData.dislikes}
              onChange={(e) => setFormData({ ...formData, dislikes: e.target.value })}
              placeholder="Productos que NUNCA quieres recibir (ej: Repollo, brócoli)"
              rows={2}
              className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          </div>

          <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 flex-shrink-0 bg-white rounded-b-3xl">
            <button
              type="submit"
              disabled={submitting || profileLoading}
              className="flex-1 rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--color-brand-accent)] disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Guardar perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
