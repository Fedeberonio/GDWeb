"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import type { BoxRule } from "@/modules/catalog/types";

type BoxRulesManagerProps = {
  initialRules: BoxRule[];
};

export function BoxRulesManager({ initialRules }: BoxRulesManagerProps) {
  const [rules, setRules] = useState<BoxRule[]>(initialRules);
  const [selectedId, setSelectedId] = useState<string | null>(initialRules[0]?.id ?? null);
  const [draft, setDraft] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRule = useMemo(
    () => (selectedId ? rules.find((rule) => rule.id === selectedId) ?? null : null),
    [rules, selectedId],
  );

  useEffect(() => {
    if (selectedRule) {
      setDraft(JSON.stringify(selectedRule, null, 2));
      setError(null);
      setMessage(null);
    } else {
      setDraft("");
    }
  }, [selectedRule]);

  useEffect(() => {
    setRules(initialRules);
    if (!selectedId && initialRules[0]?.id) {
      setSelectedId(initialRules[0].id);
    }
  }, [initialRules, selectedId]);

  const handleResetDraft = () => {
    if (!selectedRule) return;
    setDraft(JSON.stringify(selectedRule, null, 2));
    setError(null);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedRule) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const parsed = JSON.parse(draft) as BoxRule;
      if (parsed.id && parsed.id !== selectedRule.id) {
        throw new Error("El campo id no puede cambiarse. Usa el id original.");
      }

      const payload = { ...parsed, id: selectedRule.id };
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

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Editar regla</h3>
            <p className="text-xs text-slate-500">Edita el JSON completo de la regla.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDraft}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700"
            >
              Revertir cambios
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedRule}
              className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Guardando..." : "Guardar regla"}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={24}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 focus:border-green-500 focus:outline-none"
          spellCheck={false}
          aria-label="JSON de la regla seleccionada"
        />
      </section>
    </div>
  );
}
