"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { ImageUploadField } from "@/modules/admin/components/image-upload-field";
import type { Box } from "@/modules/catalog/types";

type BoxManagerProps = {
  initialBoxes: Box[];
};

const BOX_DETAIL_FALLBACKS: Record<string, { dimensionsLabel: string; weightLabel: string }> = {
  "box-1": { dimensionsLabel: "8\" x 8\" x 8\"", weightLabel: "7.7 lb (3.5 kg)" },
  "box-2": { dimensionsLabel: "10\" x 10\" x 10\"", weightLabel: "13.2 lb (6 kg)" },
  "box-3": { dimensionsLabel: "12\" x 12\" x 12\"", weightLabel: "26.4 lb (12 kg)" },
  "caribbean-fresh-pack": { dimensionsLabel: "8\" x 8\" x 8\"", weightLabel: "7.7 lb (3.5 kg)" },
  "island-weekssential": { dimensionsLabel: "10\" x 10\" x 10\"", weightLabel: "13.2 lb (6 kg)" },
  "allgreenxclusive": { dimensionsLabel: "12\" x 12\" x 12\"", weightLabel: "26.4 lb (12 kg)" },
};

type VariantFormState = {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  highlights: Array<{ es: string; en: string }>;
  referenceContents: Array<{
    productId?: string;
    nameEs: string;
    nameEn: string;
    quantity?: string;
  }>;
};

type FormState = {
  nameEs: string;
  nameEn: string;
  priceAmount: string;
  descriptionEs: string;
  descriptionEn: string;
  ruleId: string;
  dimensionsLabel: string;
  weightLabel: string;
  heroImage: string;
  isFeatured: boolean;
  durationDays: string;
  variants: VariantFormState[];
};

function buildInitialForm(box: Box): FormState {
  const fallback = BOX_DETAIL_FALLBACKS[box.id] ?? BOX_DETAIL_FALLBACKS[box.slug];
  return {
    nameEs: box.name.es ?? "",
    nameEn: box.name.en ?? "",
    priceAmount: box.price.amount.toString(),
    descriptionEs: box.description?.es ?? "",
    descriptionEn: box.description?.en ?? "",
    ruleId: box.ruleId ?? "",
    dimensionsLabel: box.dimensionsLabel ?? fallback?.dimensionsLabel ?? "",
    weightLabel: box.weightLabel ?? fallback?.weightLabel ?? "",
    heroImage: box.heroImage ?? "",
    isFeatured: box.isFeatured,
    durationDays: box.durationDays ? box.durationDays.toString() : "",
    variants: box.variants.map((variant) => ({
      id: variant.id,
      slug: variant.slug,
      nameEs: variant.name.es ?? "",
      nameEn: variant.name.en ?? "",
      descriptionEs: variant.description?.es ?? "",
      descriptionEn: variant.description?.en ?? "",
      highlights: variant.highlights.map((h) => ({
        es: h.es ?? "",
        en: h.en ?? "",
      })),
      referenceContents: variant.referenceContents.map((content) => ({
        productId: content.productId,
        nameEs: content.name.es ?? "",
        nameEn: content.name.en ?? "",
        quantity: content.quantity ?? "",
      })),
    })),
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
      name: {
        es: formState.nameEs,
        en: formState.nameEn,
      },
      price: {
        amount: Number(formState.priceAmount),
        currency: selectedBox.price.currency,
      },
      description: {
        es: formState.descriptionEs,
        en: formState.descriptionEn,
      },
      ruleId: formState.ruleId || undefined,
      dimensionsLabel: formState.dimensionsLabel || undefined,
      weightLabel: formState.weightLabel || undefined,
      heroImage: formState.heroImage || undefined,
      isFeatured: formState.isFeatured,
      durationDays: formState.durationDays ? Number(formState.durationDays) : undefined,
      variants: formState.variants.map((variant) => ({
        id: variant.id,
        slug: variant.slug,
        name: {
          es: variant.nameEs,
          en: variant.nameEn,
        },
        description: variant.descriptionEs || variant.descriptionEn ? {
          es: variant.descriptionEs,
          en: variant.descriptionEn,
        } : undefined,
        highlights: variant.highlights.filter((h) => h.es || h.en).map((h) => ({
          es: h.es,
          en: h.en,
        })),
        referenceContents: variant.referenceContents.filter((c) => c.nameEs || c.nameEn).map((c) => ({
          productId: c.productId,
          name: {
            es: c.nameEs,
            en: c.nameEn,
          },
          quantity: c.quantity || undefined,
        })),
      })),
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
        {selectedBox && formState ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs text-slate-500">ID: {selectedBox.id}</p>
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

            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Regla de Contenido</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                ID de regla (Box Rule)
                <input
                  type="text"
                  value={formState.ruleId}
                  onChange={(event) => setFormState({ ...formState, ruleId: event.target.value })}
                  placeholder="Ej: GD-CAJA-001"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </label>
              <p className="text-[0.7rem] text-slate-400">
                Este ID conecta la caja con su contenido (reglas y variantes). Debe existir en Box Rules.
              </p>
            </div>

            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Medidas de la Caja</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Tamaño (texto)
                  <input
                    type="text"
                    value={formState.dimensionsLabel}
                    onChange={(event) => setFormState({ ...formState, dimensionsLabel: event.target.value })}
                    placeholder='Ej: 8" x 8" x 8"'
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Peso aproximado (texto)
                  <input
                    type="text"
                    value={formState.weightLabel}
                    onChange={(event) => setFormState({ ...formState, weightLabel: event.target.value })}
                    placeholder="Ej: 7.7 lb (3.5 kg)"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Precio y Duración */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Precio y Duración</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Precio (DOP) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.priceAmount}
                    onChange={(event) => setFormState({ ...formState, priceAmount: event.target.value })}
                    required
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
              </div>
            </div>

            {/* Imagen */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Imagen</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                URL de Imagen
                <input
                  type="url"
                  value={formState.heroImage}
                  onChange={(event) => setFormState({ ...formState, heroImage: event.target.value })}
                  placeholder="https://... o /images/boxes/..."
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
            </div>

            {/* Descripciones */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Descripciones</h4>
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
            </div>

            {/* Estado */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Estado</h4>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={formState.isFeatured}
                  onChange={(event) => setFormState({ ...formState, isFeatured: event.target.checked })}
                  className="h-4 w-4 rounded border border-slate-300"
                />
                Mostrar como destacada en la web
              </label>
            </div>

            {/* Variantes */}
            <div className="space-y-4 border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Variantes</h4>
              {formState.variants.map((variant, variantIndex) => (
                <details key={variant.id} className="rounded-xl border border-slate-200 p-4 space-y-3 group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h5 className="text-sm font-semibold text-slate-800">{variant.nameEs || variant.nameEn || `Variante ${variantIndex + 1}`}</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">ID: {variant.id}</span>
                      <span className="text-xs text-slate-400 group-open:hidden">▼</span>
                      <span className="text-xs text-slate-400 hidden group-open:inline">▲</span>
                    </div>
                  </summary>
                  <div className="pt-3 space-y-4">
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Nombre Variante (ES)
                      <input
                        type="text"
                        value={variant.nameEs}
                        onChange={(event) => {
                          const newVariants = [...formState.variants];
                          newVariants[variantIndex] = { ...variant, nameEs: event.target.value };
                          setFormState({ ...formState, variants: newVariants });
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      />
                    </label>
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Nombre Variante (EN)
                      <input
                        type="text"
                        value={variant.nameEn}
                        onChange={(event) => {
                          const newVariants = [...formState.variants];
                          newVariants[variantIndex] = { ...variant, nameEn: event.target.value };
                          setFormState({ ...formState, variants: newVariants });
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Descripción Variante (ES)
                      <textarea
                        value={variant.descriptionEs}
                        onChange={(event) => {
                          const newVariants = [...formState.variants];
                          newVariants[variantIndex] = { ...variant, descriptionEs: event.target.value };
                          setFormState({ ...formState, variants: newVariants });
                        }}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      />
                    </label>
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Descripción Variante (EN)
                      <textarea
                        value={variant.descriptionEn}
                        onChange={(event) => {
                          const newVariants = [...formState.variants];
                          newVariants[variantIndex] = { ...variant, descriptionEn: event.target.value };
                          setFormState({ ...formState, variants: newVariants });
                        }}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      />
                    </label>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Highlights (Puntos destacados)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = [...formState.variants];
                          newVariants[variantIndex] = {
                            ...variant,
                            highlights: [...variant.highlights, { es: "", en: "" }],
                          };
                          setFormState({ ...formState, variants: newVariants });
                        }}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold"
                      >
                        + Agregar
                      </button>
                    </div>
                    {variant.highlights.map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="flex gap-2 items-start">
                        <div className="flex-1 grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={highlight.es}
                            onChange={(event) => {
                              const newVariants = [...formState.variants];
                              const newHighlights = [...variant.highlights];
                              newHighlights[highlightIndex] = { ...highlight, es: event.target.value };
                              newVariants[variantIndex] = { ...variant, highlights: newHighlights };
                              setFormState({ ...formState, variants: newVariants });
                            }}
                            placeholder="Highlight (ES)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={highlight.en}
                            onChange={(event) => {
                              const newVariants = [...formState.variants];
                              const newHighlights = [...variant.highlights];
                              newHighlights[highlightIndex] = { ...highlight, en: event.target.value };
                              newVariants[variantIndex] = { ...variant, highlights: newHighlights };
                              setFormState({ ...formState, variants: newVariants });
                            }}
                            placeholder="Highlight (EN)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = [...formState.variants];
                            newVariants[variantIndex] = {
                              ...variant,
                              highlights: variant.highlights.filter((_, i) => i !== highlightIndex),
                            };
                            setFormState({ ...formState, variants: newVariants });
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {variant.highlights.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No hay highlights. Haz clic en "+ Agregar" para agregar uno.</p>
                    )}
                  </div>

                  {/* Reference Contents */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Contenido de Referencia (Productos de ejemplo)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = [...formState.variants];
                          newVariants[variantIndex] = {
                            ...variant,
                            referenceContents: [...variant.referenceContents, { nameEs: "", nameEn: "", quantity: "" }],
                          };
                          setFormState({ ...formState, variants: newVariants });
                        }}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold"
                      >
                        + Agregar
                      </button>
                    </div>
                    {variant.referenceContents.map((content, contentIndex) => (
                      <div key={contentIndex} className="rounded-lg border border-slate-200 p-3 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600">Producto {contentIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = [...formState.variants];
                              newVariants[variantIndex] = {
                                ...variant,
                                referenceContents: variant.referenceContents.filter((_, i) => i !== contentIndex),
                              };
                              setFormState({ ...formState, variants: newVariants });
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            × Eliminar
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={content.nameEs}
                            onChange={(event) => {
                              const newVariants = [...formState.variants];
                              const newContents = [...variant.referenceContents];
                              newContents[contentIndex] = { ...content, nameEs: event.target.value };
                              newVariants[variantIndex] = { ...variant, referenceContents: newContents };
                              setFormState({ ...formState, variants: newVariants });
                            }}
                            placeholder="Nombre producto (ES)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={content.nameEn}
                            onChange={(event) => {
                              const newVariants = [...formState.variants];
                              const newContents = [...variant.referenceContents];
                              newContents[contentIndex] = { ...content, nameEn: event.target.value };
                              newVariants[variantIndex] = { ...variant, referenceContents: newContents };
                              setFormState({ ...formState, variants: newVariants });
                            }}
                            placeholder="Nombre producto (EN)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                          />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={content.productId || ""}
                            onChange={(event) => {
                              const newVariants = [...formState.variants];
                              const newContents = [...variant.referenceContents];
                              newContents[contentIndex] = { ...content, productId: event.target.value || undefined };
                              newVariants[variantIndex] = { ...variant, referenceContents: newContents };
                              setFormState({ ...formState, variants: newVariants });
                            }}
                            placeholder="ID Producto (opcional)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={content.quantity || ""}
                            onChange={(event) => {
                              const newVariants = [...formState.variants];
                              const newContents = [...variant.referenceContents];
                              newContents[contentIndex] = { ...content, quantity: event.target.value || undefined };
                              newVariants[variantIndex] = { ...variant, referenceContents: newContents };
                              setFormState({ ...formState, variants: newVariants });
                            }}
                            placeholder="Cantidad (ej: 2 unidades)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    {variant.referenceContents.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No hay productos de referencia. Haz clic en "+ Agregar" para agregar uno.</p>
                    )}
                  </div>
                  </div>
                </details>
              ))}
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
          <p className="text-sm text-slate-500">Selecciona una caja para editar sus datos.</p>
        )}
      </div>
    </div>
  );
}
