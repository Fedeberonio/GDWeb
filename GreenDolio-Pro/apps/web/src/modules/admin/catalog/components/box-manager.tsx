"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { ImageUploadField } from "@/modules/admin/components/image-upload-field";
import type { Box } from "@/modules/catalog/types";

type BoxManagerProps = {
  initialBoxes: Box[];
};

type FormState = {
  priceAmount: string;
  descriptionEs: string;
  descriptionEn: string;
  heroImage: string;
  isFeatured: boolean;
  durationDays: string;
};

function buildInitialForm(box: Box): FormState {
  return {
    priceAmount: box.price.amount.toString(),
    descriptionEs: box.description?.es ?? "",
    descriptionEn: box.description?.en ?? "",
    heroImage: box.heroImage ?? "",
    isFeatured: box.isFeatured,
    durationDays: box.durationDays ? box.durationDays.toString() : "",
  };
}

export function BoxManager({ initialBoxes }: BoxManagerProps) {
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredBoxes = useMemo(() => {
    return boxes.filter((box) =>
      query ? box.name.es.toLowerCase().includes(query.toLowerCase()) || box.name.en.toLowerCase().includes(query.toLowerCase()) : true,
    );
  }, [boxes, query]);

  const selectedBox = useMemo(() => (selectedId ? boxes.find((box) => box.id === selectedId) ?? null : null), [boxes, selectedId]);

  useEffect(() => {
    if (selectedBox) {
      setFormState(buildInitialForm(selectedBox));
      setMessage(null);
      setError(null);
    }
  }, [selectedBox]);

  useEffect(() => {
    setBoxes(initialBoxes);
  }, [initialBoxes]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBox || !formState) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    const payload: Record<string, unknown> = {
      price: {
        amount: Number(formState.priceAmount),
        currency: selectedBox.price.currency,
      },
      description: {
        es: formState.descriptionEs,
        en: formState.descriptionEn,
      },
      heroImage: formState.heroImage || undefined,
      isFeatured: formState.isFeatured,
      durationDays: formState.durationDays ? Number(formState.durationDays) : undefined,
    };

    try {
      const response = await adminFetch(`/api/admin/catalog/boxes/${selectedBox.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo guardar la caja");
      }

      setBoxes((prev) => prev.map((box) => (box.id === selectedBox.id ? json.data : box)));
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
          placeholder="Buscar caja"
          className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-green-500"
        />

        <div className="space-y-3">
          {filteredBoxes.map((box) => (
            <button
              key={box.id}
              type="button"
              onClick={() => setSelectedId(box.id)}
              className={`flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition ${
                selectedId === box.id ? "border-green-500 bg-green-50" : "border-slate-200 bg-white hover:border-green-200"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{box.name.es}</p>
                <p className="text-xs text-slate-500">Variantes: {box.variants.map((variant) => variant.name.es).join(" · ")}</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p className="font-semibold text-slate-900">RD${box.price.amount.toLocaleString("es-DO")}</p>
                {box.durationDays && <p className="text-xs uppercase text-slate-400">{box.durationDays} días</p>}
              </div>
            </button>
          ))}
          {!filteredBoxes.length && (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No se encontraron cajas para la búsqueda ingresada.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        {selectedBox && formState ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedBox.name.es}</h3>
              <p className="text-xs text-slate-500">ID: {selectedBox.id}</p>
            </div>

            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Precio (DOP)
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.priceAmount}
                onChange={(event) => setFormState({ ...formState, priceAmount: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Duración (días)
              <input
                type="number"
                min="1"
                value={formState.durationDays}
                onChange={(event) => setFormState({ ...formState, durationDays: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Imagen destacada (URL)
              <input
                type="url"
                value={formState.heroImage}
                onChange={(event) => setFormState({ ...formState, heroImage: event.target.value })}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            {selectedBox && (
              <ImageUploadField
                label="Subir nueva imagen"
                pathPrefix={`boxes/${selectedBox.id}`}
                onUploaded={(url) => setFormState((state) => ({ ...state!, heroImage: url }))}
              />
            )}

            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Descripción (ES)
              <textarea
                value={formState.descriptionEs}
                onChange={(event) => setFormState({ ...formState, descriptionEs: event.target.value })}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Descripción (EN)
              <textarea
                value={formState.descriptionEn}
                onChange={(event) => setFormState({ ...formState, descriptionEn: event.target.value })}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.isFeatured}
                onChange={(event) => setFormState({ ...formState, isFeatured: event.target.checked })}
                className="h-4 w-4 rounded border border-slate-300"
              />
              Mostrar como destacada en la web
            </label>

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
          <p className="text-sm text-slate-500">Selecciona una caja para editar sus datos.</p>
        )}
      </div>
    </div>
  );
}
