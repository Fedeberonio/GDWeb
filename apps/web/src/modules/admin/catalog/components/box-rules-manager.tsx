"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import type { BoxRule } from "@/modules/catalog/types";

type BoxRulesManagerProps = {
  initialRules: BoxRule[];
};

type FormState = {
  displayName: string;
  slotBudget: string;
  targetWeightKg: string;
  minMargin: string;
  categoryBudget: string; // JSON string
  baseContents: string; // JSON string
  variantContents: {
    mix?: string; // JSON string
    fruity?: string; // JSON string
    veggie?: string; // JSON string
  };
};

function buildInitialForm(rule: BoxRule): FormState {
  return {
    displayName: rule.displayName ?? "",
    slotBudget: rule.slotBudget.toString(),
    targetWeightKg: rule.targetWeightKg.toString(),
    minMargin: rule.minMargin?.toString() ?? "",
    categoryBudget: JSON.stringify(rule.categoryBudget, null, 2),
    baseContents: JSON.stringify(rule.baseContents, null, 2),
    variantContents: {
      mix: rule.variantContents?.mix ? JSON.stringify(rule.variantContents.mix, null, 2) : "",
      fruity: rule.variantContents?.fruity ? JSON.stringify(rule.variantContents.fruity, null, 2) : "",
      veggie: rule.variantContents?.veggie ? JSON.stringify(rule.variantContents.veggie, null, 2) : "",
    },
  };
}

export function BoxRulesManager({ initialRules }: BoxRulesManagerProps) {
  const [rules, setRules] = useState<BoxRule[]>(initialRules);
  const [selectedId, setSelectedId] = useState<string | null>(initialRules[0]?.id ?? null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRule = useMemo(
    () => (selectedId ? rules.find((rule) => rule.id === selectedId) ?? null : null),
    [rules, selectedId],
  );

  useEffect(() => {
    if (selectedRule) {
      setFormState(buildInitialForm(selectedRule));
      setError(null);
      setMessage(null);
    }
  }, [selectedRule]);

  useEffect(() => {
    setRules(initialRules);
    if (!selectedId && initialRules[0]?.id) {
      setSelectedId(initialRules[0].id);
    }
  }, [initialRules, selectedId]);

  const handleReset = () => {
    if (!selectedRule) return;
    setFormState(buildInitialForm(selectedRule));
    setError(null);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedRule || !formState) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      // Parse JSON fields
      let categoryBudget: Record<string, { min: number; max: number }>;
      let baseContents: Array<{ productSlug: string; quantity: number }>;
      const variantContents: {
        mix?: Array<{ productSlug: string; quantity: number }>;
        fruity?: Array<{ productSlug: string; quantity: number }>;
        veggie?: Array<{ productSlug: string; quantity: number }>;
      } = {};

      try {
        categoryBudget = JSON.parse(formState.categoryBudget);
      } catch {
        throw new Error("categoryBudget tiene un formato JSON inválido");
      }

      try {
        baseContents = JSON.parse(formState.baseContents);
      } catch {
        throw new Error("baseContents tiene un formato JSON inválido");
      }

      if (formState.variantContents.mix) {
        try {
          variantContents.mix = JSON.parse(formState.variantContents.mix);
        } catch {
          throw new Error("variantContents.mix tiene un formato JSON inválido");
        }
      }

      if (formState.variantContents.fruity) {
        try {
          variantContents.fruity = JSON.parse(formState.variantContents.fruity);
        } catch {
          throw new Error("variantContents.fruity tiene un formato JSON inválido");
        }
      }

      if (formState.variantContents.veggie) {
        try {
          variantContents.veggie = JSON.parse(formState.variantContents.veggie);
        } catch {
          throw new Error("variantContents.veggie tiene un formato JSON inválido");
        }
      }

      const payload: Partial<BoxRule> = {
        displayName: formState.displayName.trim(),
        slotBudget: Number(formState.slotBudget),
        targetWeightKg: Number(formState.targetWeightKg),
        minMargin: formState.minMargin ? Number(formState.minMargin) : undefined,
        categoryBudget,
        baseContents,
        variantContents: Object.keys(variantContents).length > 0 ? variantContents : undefined,
      };

      const response = await adminFetch(`/api/admin/catalog/box-rules/${selectedRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo guardar la regla");
      }

      const updated = json.data as BoxRule;
      setRules((prev) => prev.map((rule) => (rule.id === updated.id ? updated : rule)));
      setMessage("Regla actualizada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
      <aside className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Reglas</p>
        <div className="space-y-2">
          {rules.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => setSelectedId(rule.id)}
              className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
                rule.id === selectedId
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-green-300"
              }`}
            >
              <p className="font-semibold">{rule.displayName}</p>
              <p className="text-xs text-slate-400">{rule.id}</p>
            </button>
          ))}
          {!rules.length && <p className="text-sm text-slate-500">No hay reglas cargadas.</p>}
        </div>
      </aside>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft max-h-[90vh] overflow-y-auto">
        {selectedRule && formState ? (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Editar regla</h3>
                <p className="text-xs text-slate-500">ID: {selectedRule.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700"
                >
                  Revertir cambios
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Guardando..." : "Guardar regla"}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            {/* Información Básica */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información Básica</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Nombre de Visualización *
                <input
                  type="text"
                  value={formState.displayName}
                  onChange={(event) => setFormState({ ...formState, displayName: event.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Presupuesto de Slots *
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formState.slotBudget}
                    onChange={(event) => setFormState({ ...formState, slotBudget: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Peso Objetivo (kg) *
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formState.targetWeightKg}
                    onChange={(event) => setFormState({ ...formState, targetWeightKg: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Margen Mínimo (%)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.minMargin}
                    onChange={(event) => setFormState({ ...formState, minMargin: event.target.value })}
                    placeholder="Opcional"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Presupuesto por Categoría */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Presupuesto por Categoría</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Presupuesto por Categoría (JSON) *
                <textarea
                  value={formState.categoryBudget}
                  onChange={(event) => setFormState({ ...formState, categoryBudget: event.target.value })}
                  rows={6}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-green-500 focus:outline-none"
                  placeholder='{"categoria-id": {"min": 0, "max": 10}, ...}'
                  required
                />
                <p className="mt-1 text-xs text-slate-400">
                  Formato: objeto con IDs de categoría como claves, cada una con min y max (números enteros)
                </p>
              </label>
            </div>

            {/* Contenido Base */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contenido Base</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Contenido Base (JSON) *
                <textarea
                  value={formState.baseContents}
                  onChange={(event) => setFormState({ ...formState, baseContents: event.target.value })}
                  rows={6}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-green-500 focus:outline-none"
                  placeholder='[{"productSlug": "producto-slug", "quantity": 2}, ...]'
                  required
                />
                <p className="mt-1 text-xs text-slate-400">
                  Formato: array de objetos con productSlug (string) y quantity (número entero positivo)
                </p>
              </label>
            </div>

            {/* Contenido por Variante */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contenido por Variante</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Mix (JSON)
                    <textarea
                      value={formState.variantContents.mix ?? ""}
                      onChange={(event) =>
                        setFormState({
                          ...formState,
                          variantContents: { ...formState.variantContents, mix: event.target.value },
                        })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-green-500 focus:outline-none"
                      placeholder='[{"productSlug": "producto-slug", "quantity": 2}, ...]'
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Fruity (JSON)
                    <textarea
                      value={formState.variantContents.fruity ?? ""}
                      onChange={(event) =>
                        setFormState({
                          ...formState,
                          variantContents: { ...formState.variantContents, fruity: event.target.value },
                        })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-green-500 focus:outline-none"
                      placeholder='[{"productSlug": "producto-slug", "quantity": 2}, ...]'
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Veggie (JSON)
                    <textarea
                      value={formState.variantContents.veggie ?? ""}
                      onChange={(event) =>
                        setFormState({
                          ...formState,
                          variantContents: { ...formState.variantContents, veggie: event.target.value },
                        })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-green-500 focus:outline-none"
                      placeholder='[{"productSlug": "producto-slug", "quantity": 2}, ...]'
                    />
                  </label>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Opcional: contenido específico para cada variante. Formato: array de objetos con productSlug y quantity
              </p>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Selecciona una regla para editar sus datos.</p>
        )}
      </section>
    </div>
  );
}
