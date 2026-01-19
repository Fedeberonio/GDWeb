"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { adminFetch } from "@/modules/admin/api/client";
import { ImageUploadField } from "@/modules/admin/components/image-upload-field";
import type { Combo } from "@/modules/catalog/types";

type ComboManagerProps = {
  initialCombos: Combo[];
};

type FormState = {
  nameEs: string;
  nameEn: string;
  saladEs: string;
  saladEn: string;
  juiceEs: string;
  juiceEn: string;
  dessertEs: string;
  dessertEn: string;
  price: string;
  cost: string;
  margin: string;
  calories: string;
  protein: string;
  glutenFree: boolean;
  benefitEs: string;
  benefitEn: string;
  benefitDetailEs: string;
  benefitDetailEn: string;
  recommendedForEs: string;
  recommendedForEn: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugars: string;
  vitaminA: string;
  vitaminC: string;
  image: string;
  status: Combo["status"];
  isFeatured: boolean;
  ingredients: Array<{ es: string; en: string }>;
};

function buildInitialForm(combo: Combo): FormState {
  return {
    nameEs: combo.name.es ?? "",
    nameEn: combo.name.en ?? "",
    saladEs: combo.salad.es ?? "",
    saladEn: combo.salad.en ?? "",
    juiceEs: combo.juice.es ?? "",
    juiceEn: combo.juice.en ?? "",
    dessertEs: combo.dessert.es ?? "",
    dessertEn: combo.dessert.en ?? "",
    price: combo.price.toString(),
    cost: combo.cost?.toString() ?? "",
    margin: combo.margin?.toString() ?? "",
    calories: combo.calories.toString(),
    protein: combo.protein.toString(),
    glutenFree: combo.glutenFree,
    benefitEs: combo.benefit.es ?? "",
    benefitEn: combo.benefit.en ?? "",
    benefitDetailEs: combo.benefitDetail.es ?? "",
    benefitDetailEn: combo.benefitDetail.en ?? "",
    recommendedForEs: combo.recommendedFor.es ?? "",
    recommendedForEn: combo.recommendedFor.en ?? "",
    carbs: combo.carbs.toString(),
    fats: combo.fats.toString(),
    fiber: combo.fiber.toString(),
    sugars: combo.sugars.toString(),
    vitaminA: combo.vitaminA ?? "",
    vitaminC: combo.vitaminC ?? "",
    image: combo.image ?? "",
    status: combo.status,
    isFeatured: combo.isFeatured,
    ingredients: combo.ingredients.map((ing) => ({
      es: ing.es ?? "",
      en: ing.en ?? "",
    })),
  };
}

export function ComboManager({ initialCombos }: ComboManagerProps) {
  const [combos, setCombos] = useState<Combo[]>(initialCombos);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredCombos = useMemo(() => {
    return combos.filter((combo) =>
      query
        ? combo.name.es.toLowerCase().includes(query.toLowerCase()) ||
          combo.name.en.toLowerCase().includes(query.toLowerCase())
        : true,
    );
  }, [combos, query]);

  const selectedCombo = useMemo(
    () => (selectedId ? combos.find((combo) => combo.id === selectedId) ?? null : null),
    [combos, selectedId],
  );

  useEffect(() => {
    if (selectedCombo) {
      setFormState(buildInitialForm(selectedCombo));
      setMessage(null);
      setError(null);
    }
  }, [selectedCombo]);

  useEffect(() => {
    setCombos(initialCombos);
  }, [initialCombos]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCombo || !formState) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    const payload: Record<string, unknown> = {
      name: {
        es: formState.nameEs,
        en: formState.nameEn,
      },
      salad: {
        es: formState.saladEs,
        en: formState.saladEn,
      },
      juice: {
        es: formState.juiceEs,
        en: formState.juiceEn,
      },
      dessert: {
        es: formState.dessertEs,
        en: formState.dessertEn,
      },
      price: Number(formState.price),
      cost: formState.cost ? Number(formState.cost) : undefined,
      margin: formState.margin ? Number(formState.margin) : undefined,
      calories: Number(formState.calories),
      protein: Number(formState.protein),
      glutenFree: formState.glutenFree,
      benefit: {
        es: formState.benefitEs,
        en: formState.benefitEn,
      },
      benefitDetail: {
        es: formState.benefitDetailEs,
        en: formState.benefitDetailEn,
      },
      recommendedFor: {
        es: formState.recommendedForEs,
        en: formState.recommendedForEn,
      },
      carbs: Number(formState.carbs),
      fats: Number(formState.fats),
      fiber: Number(formState.fiber),
      sugars: Number(formState.sugars),
      vitaminA: formState.vitaminA || undefined,
      vitaminC: formState.vitaminC || undefined,
      image: formState.image || undefined,
      status: formState.status,
      isFeatured: formState.isFeatured,
      ingredients: formState.ingredients.filter((ing) => ing.es || ing.en).map((ing) => ({
        es: ing.es,
        en: ing.en,
      })),
    };

    try {
      const response = await adminFetch(`/api/admin/catalog/combos/${selectedCombo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo guardar el combo");
      }

      setCombos((prev) => prev.map((combo) => (combo.id === selectedCombo.id ? json.data : combo)));
      setMessage("Cambios guardados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar combo"
          className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-green-500"
        />

        <div className="space-y-3">
          {filteredCombos.map((combo) => (
            <button
              key={combo.id}
              type="button"
              onClick={() => setSelectedId(combo.id)}
              className={`flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition ${
                selectedId === combo.id
                  ? "border-green-500 bg-green-50"
                  : "border-slate-200 bg-white hover:border-green-200"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{combo.name.es}</p>
                <p className="text-xs text-slate-500">{combo.salad.es}</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p className="font-semibold text-slate-900">RD${combo.price.toLocaleString("es-DO")}</p>
                <p className="text-xs uppercase text-slate-400">{combo.status}</p>
              </div>
            </button>
          ))}
          {!filteredCombos.length && (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No se encontraron combos para la búsqueda ingresada.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
        {selectedCombo && formState ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs text-slate-500">ID: {selectedCombo.id}</p>
            </div>

            {/* Nombres */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Nombres</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nombre (ES) *
                  <input
                    type="text"
                    value={formState.nameEs}
                    onChange={(event) => setFormState({ ...formState, nameEs: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nombre (EN) *
                  <input
                    type="text"
                    value={formState.nameEn}
                    onChange={(event) => setFormState({ ...formState, nameEn: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Ensalada, Jugo, Postre */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contenido del Combo</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ensalada (ES) *
                  <input
                    type="text"
                    value={formState.saladEs}
                    onChange={(event) => setFormState({ ...formState, saladEs: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ensalada (EN) *
                  <input
                    type="text"
                    value={formState.saladEn}
                    onChange={(event) => setFormState({ ...formState, saladEn: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Jugo (ES) *
                  <input
                    type="text"
                    value={formState.juiceEs}
                    onChange={(event) => setFormState({ ...formState, juiceEs: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Jugo (EN) *
                  <input
                    type="text"
                    value={formState.juiceEn}
                    onChange={(event) => setFormState({ ...formState, juiceEn: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Postre (ES) *
                  <input
                    type="text"
                    value={formState.dessertEs}
                    onChange={(event) => setFormState({ ...formState, dessertEs: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Postre (EN) *
                  <input
                    type="text"
                    value={formState.dessertEn}
                    onChange={(event) => setFormState({ ...formState, dessertEn: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Precio y Costos */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Precio y Costos</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Precio (DOP) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={(event) => setFormState({ ...formState, price: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Costo (DOP)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.cost}
                    onChange={(event) => setFormState({ ...formState, cost: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Margen (%)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.margin}
                    onChange={(event) => setFormState({ ...formState, margin: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Información Nutricional */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información Nutricional</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Calorías *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formState.calories}
                    onChange={(event) => setFormState({ ...formState, calories: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Proteína (g) *
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.protein}
                    onChange={(event) => setFormState({ ...formState, protein: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Carbohidratos (g) *
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.carbs}
                    onChange={(event) => setFormState({ ...formState, carbs: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Grasas (g) *
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.fats}
                    onChange={(event) => setFormState({ ...formState, fats: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Fibra (g) *
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.fiber}
                    onChange={(event) => setFormState({ ...formState, fiber: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Azúcares (g) *
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.sugars}
                    onChange={(event) => setFormState({ ...formState, sugars: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Vitamina A
                  <input
                    type="text"
                    value={formState.vitaminA}
                    onChange={(event) => setFormState({ ...formState, vitaminA: event.target.value })}
                    placeholder="Ej: Alto, Muy Alto"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Vitamina C
                  <input
                    type="text"
                    value={formState.vitaminC}
                    onChange={(event) => setFormState({ ...formState, vitaminC: event.target.value })}
                    placeholder="Ej: Alto, Muy Alto"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Beneficios */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Beneficios</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Beneficio Principal (ES) *
                  <input
                    type="text"
                    value={formState.benefitEs}
                    onChange={(event) => setFormState({ ...formState, benefitEs: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Beneficio Principal (EN) *
                  <input
                    type="text"
                    value={formState.benefitEn}
                    onChange={(event) => setFormState({ ...formState, benefitEn: event.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Detalle del Beneficio (ES) *
                  <textarea
                    value={formState.benefitDetailEs}
                    onChange={(event) => setFormState({ ...formState, benefitDetailEs: event.target.value })}
                    rows={2}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Detalle del Beneficio (EN) *
                  <textarea
                    value={formState.benefitDetailEn}
                    onChange={(event) => setFormState({ ...formState, benefitDetailEn: event.target.value })}
                    rows={2}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Recomendado Para (ES) *
                  <textarea
                    value={formState.recommendedForEs}
                    onChange={(event) => setFormState({ ...formState, recommendedForEs: event.target.value })}
                    rows={2}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Recomendado Para (EN) *
                  <textarea
                    value={formState.recommendedForEn}
                    onChange={(event) => setFormState({ ...formState, recommendedForEn: event.target.value })}
                    rows={2}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Imagen */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Imagen</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                URL de Imagen
                <input
                  type="url"
                  value={formState.image}
                  onChange={(event) => setFormState({ ...formState, image: event.target.value })}
                  placeholder="https://... o /images/combos/..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </label>
              {selectedCombo && (
                <ImageUploadField
                  label="Subir nueva imagen"
                  pathPrefix={`combos/${selectedCombo.id}`}
                  onUploaded={(url) => setFormState((state) => ({ ...state!, image: url }))}
                />
              )}
              {formState.image && (
                <div className="mt-2">
                  <Image
                    src={formState.image}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
                    unoptimized={formState.image?.startsWith('http') || formState.image?.startsWith('https')}
                  />
                </div>
              )}
            </div>

            {/* Ingredientes */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Ingredientes</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Ingredientes (JSON array de objetos con es/en)
                <textarea
                  value={JSON.stringify(formState.ingredients, null, 2)}
                  onChange={(event) => {
                    try {
                      const parsed = JSON.parse(event.target.value);
                      setFormState({ ...formState, ingredients: parsed });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={8}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-green-500 focus:outline-none"
                  placeholder='[{"es": "...", "en": "..."}]'
                />
              </label>
            </div>

            {/* Estado */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Estado</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Estado
                  <select
                    value={formState.status}
                    onChange={(event) =>
                      setFormState({ ...formState, status: event.target.value as Combo["status"] })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="coming_soon">Próximamente</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={formState.glutenFree}
                    onChange={(event) => setFormState({ ...formState, glutenFree: event.target.checked })}
                    className="h-4 w-4 rounded border border-slate-300"
                  />
                  Sin Gluten
                </label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={formState.isFeatured}
                  onChange={(event) => setFormState({ ...formState, isFeatured: event.target.checked })}
                  className="h-4 w-4 rounded border border-slate-300"
                />
                Mostrar como destacado en la web
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Selecciona un combo para editar sus datos.</p>
        )}
      </div>
    </div>
  );
}
