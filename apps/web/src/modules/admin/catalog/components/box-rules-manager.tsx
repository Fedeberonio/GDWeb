"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { useTranslation } from "@/modules/i18n/use-translation";
import type { BoxRule, ProductCategory } from "@/modules/catalog/types";

type BoxRulesManagerProps = {
  initialRules: BoxRule[];
  categories: ProductCategory[];
};

type FormState = {
  displayName: string;
  slotBudget: string;
  targetWeightKg: string;
  minMargin: string;
  categoryBudget: Record<string, { min: number; max: number }>;
  baseContents: Array<{ productSku: string; quantity: number }>;
  variantContents: {
    mix: Array<{ productSku: string; quantity: number }>;
    fruity: Array<{ productSku: string; quantity: number }>;
    veggie: Array<{ productSku: string; quantity: number }>;
  };
};

function buildInitialForm(rule: BoxRule, categories: ProductCategory[]): FormState {
  const defaultCategoryBudget: Record<string, { min: number; max: number }> = {};
  categories.forEach((cat) => {
    defaultCategoryBudget[cat.id] = rule.categoryBudget[cat.id] || { min: 0, max: 0 };
  });

  return {
    displayName: rule.displayName ?? "",
    slotBudget: rule.slotBudget.toString(),
    targetWeightKg: rule.targetWeightKg.toString(),
    minMargin: rule.minMargin?.toString() ?? "",
    categoryBudget: defaultCategoryBudget,
    baseContents: rule.baseContents ?? [],
    variantContents: {
      mix: rule.variantContents?.mix ?? [],
      fruity: rule.variantContents?.fruity ?? [],
      veggie: rule.variantContents?.veggie ?? [],
    },
  };
}

export function BoxRulesManager({ initialRules, categories }: BoxRulesManagerProps) {
  const { t } = useTranslation();
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
      setFormState(buildInitialForm(selectedRule, categories));
      setError(null);
      setMessage(null);
    }
  }, [selectedRule, categories]);

  useEffect(() => {
    setRules(initialRules);
    if (!selectedId && initialRules[0]?.id) {
      setSelectedId(initialRules[0].id);
    }
  }, [initialRules, selectedId]);

  const handleReset = () => {
    if (!selectedRule) return;
    setFormState(buildInitialForm(selectedRule, categories));
    setError(null);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedRule || !formState) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const categoryBudget = formState.categoryBudget;

      const payload: Partial<BoxRule> = {
        displayName: formState.displayName.trim(),
        slotBudget: Number(formState.slotBudget),
        targetWeightKg: Number(formState.targetWeightKg),
        minMargin: formState.minMargin ? Number(formState.minMargin) : undefined,
        categoryBudget,
      };

      const response = await adminFetch(`/api/admin/catalog/box-rules/${selectedRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? t("admin.rules.error_save"));
      }

      const updated = json.data as BoxRule;
      setRules((prev) => prev.map((rule) => (rule.id === updated.id ? updated : rule)));
      setMessage(t("admin.rules.updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.rules.error_unexpected"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
      <aside className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{t("admin.rules.title")}</p>
        <div className="space-y-2">
          {rules.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => setSelectedId(rule.id)}
              className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${rule.id === selectedId
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-green-300"
                }`}
            >
              <p className="font-semibold">{rule.displayName}</p>
              <p className="text-xs text-slate-400">{rule.id}</p>
            </button>
          ))}
          {!rules.length && <p className="text-sm text-slate-500">{t("admin.rules.no_rules")}</p>}
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
                <h3 className="text-lg font-semibold text-slate-900">{t("admin.rules.edit_title")}</h3>
                <p className="text-xs text-slate-500">ID: {selectedRule.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700"
                >
                  {t("admin.rules.revert")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? t("admin.rules.saving") : t("admin.rules.save")}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            {/* Información Básica */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{t("admin.rules.basic_info")}</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t("admin.rules.display_name")}
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
                  {t("admin.rules.slot_budget")}
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
                  {t("admin.rules.target_weight")}
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
                  {t("admin.rules.min_margin")}
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
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{t("admin.rules.category_budget")}</h4>
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-4 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100">
                    <span className="text-sm font-medium text-slate-700 flex-1">{cat.name.es}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-400 uppercase">Min</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.categoryBudget[cat.id]?.min ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormState({
                            ...formState,
                            categoryBudget: {
                              ...formState.categoryBudget,
                              [cat.id]: { ...formState.categoryBudget[cat.id] || { min: 0, max: 0 }, min: val },
                            },
                          });
                        }}
                        className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-center"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-400 uppercase">Max</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.categoryBudget[cat.id]?.max ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormState({
                            ...formState,
                            categoryBudget: {
                              ...formState.categoryBudget,
                              [cat.id]: { ...formState.categoryBudget[cat.id] || { min: 0, max: 0 }, max: val },
                            },
                          });
                        }}
                        className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Fuente de verdad</h4>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                El contenido y las variantes de las cajas se administran solo desde <span className="font-semibold">Admin &gt; Boxes</span>.
                Aqui solo quedan las reglas operativas para budgets, peso objetivo y margen minimo.
              </div>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500">{t("admin.box_manager.select_box")}</p>
        )}
      </section>
    </div>
  );
}
