"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

import { adminFetch } from "@/modules/admin/api/client";
import { ImageUploadField } from "@/modules/admin/components/image-upload-field";
import { useTranslation } from "@/modules/i18n/use-translation";
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

function getStatusBadge(status: Combo["status"]) {
  switch (status) {
    case "active":
      return "bg-[var(--gd-color-leaf)]/15 text-[var(--gd-color-forest)] border-[var(--gd-color-leaf)]/40";
    case "coming_soon":
      return "bg-[var(--gd-color-citrus)]/15 text-[var(--gd-color-citrus)] border-[var(--gd-color-citrus)]/40";
    case "inactive":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function normalizeComboImage(src: string, comboId?: string) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function fallbackComboImage(comboId?: string) {
  if (!comboId) return "";
  const digits = comboId.match(/\d+/)?.[0];
  if (digits) {
    const padded = digits.padStart(3, "0");
    return `/assets/images/combos/GD-COMB-${padded}.png`;
  }
  return `/assets/images/combos/${comboId}.png`;
}

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
  const { t } = useTranslation();
  const [combos, setCombos] = useState<Combo[]>(initialCombos);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fieldClass =
    "mt-1 w-full rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30";
  const fieldMonoClass =
    "mt-1 w-full rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30";
  const checkboxClass = "h-4 w-4 rounded border border-slate-300";

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

  async function handleCreateCombo() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        name: { es: "Nuevo combo", en: "New combo" },
        price: 0,
        calories: 0,
        protein: 0,
        glutenFree: false,
        benefit: { es: "", en: "" },
        status: "inactive",
        isFeatured: false,
      };

      const response = await adminFetch("/api/admin/catalog/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? t("admin.combo_manager.error_save"));
      }

      const created = json.data as Combo;
      setCombos((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setFormState(buildInitialForm(created));
      setMessage(t("admin.combo_manager.saved"));
      toast.success(t("admin.combo_manager.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

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
        throw new Error(json?.error ?? t("admin.combo_manager.error_save"));
      }

      setCombos((prev) => prev.map((combo) => (combo.id === selectedCombo.id ? json.data : combo)));
      setMessage(t("admin.combo_manager.saved"));
      toast.success(t("admin.combo_manager.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        <div className="glass-panel rounded-3xl p-5 shadow-lg border border-white/60 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">{t("admin.combo_manager.title")}</h3>
              <p className="text-xs text-[var(--gd-color-text-muted)]">
                {filteredCombos.length} {t("admin.combo_manager.items")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateCombo}
              className="px-5 py-2.5 rounded-2xl bg-[var(--gd-color-leaf)] text-white font-medium text-sm hover:bg-[var(--gd-color-forest)] transition-colors flex items-center gap-2"
            >
              {t("admin.combo_manager.create")}
            </button>
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.combo_manager.search")}
            className="w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCombos.map((combo) => {
            const isSelected = selectedId === combo.id;
            const imageSrc = normalizeComboImage(combo.image ?? "", combo.id) || fallbackComboImage(combo.id);
            return (
              <button
                key={combo.id}
                type="button"
                onClick={() => setSelectedId(combo.id)}
                className={`group flex h-full flex-col overflow-hidden rounded-3xl border text-left transition ${
                  isSelected
                    ? "border-[var(--gd-color-leaf)] bg-[var(--gd-color-sprout)]/30 shadow-lg"
                    : "border-white/60 bg-white/70 hover:border-[var(--gd-color-leaf)]/50 hover:shadow-md"
                }`}
              >
                <div className="relative h-36 w-full overflow-hidden bg-[var(--gd-color-beige)]">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={combo.name.es}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/80 via-[var(--gd-color-sprout)]/40 to-[var(--gd-color-leaf)]/20">
                      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">
                        Combo
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{combo.name.es}</p>
                      <p className="text-xs text-[var(--gd-color-text-muted)]">{combo.benefit.es || combo.salad.es}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase ${getStatusBadge(
                        combo.status,
                      )}`}
                    >
                      {combo.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[var(--gd-color-text-muted)]">
                    <p>Ensalada: {combo.salad.es || "-"}</p>
                    <p>Jugo: {combo.juice.es || "-"}</p>
                    <p>Postre: {combo.dessert.es || "-"}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <p className="font-semibold text-[var(--gd-color-forest)]">
                      RD${combo.price.toLocaleString("es-DO")}
                    </p>
                    <span className="text-xs text-[var(--gd-color-text-muted)]">Configurar →</span>
                  </div>
                </div>
              </button>
            );
          })}
          {!filteredCombos.length && (
            <p className="rounded-3xl border border-dashed border-white/60 bg-white/50 p-6 text-center text-sm text-[var(--gd-color-text-muted)] sm:col-span-2 xl:col-span-3">
              {t("admin.combo_manager.no_results")}
            </p>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/60 p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        {selectedCombo && formState ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs text-[var(--gd-color-text-muted)]">ID: {selectedCombo.id}</p>
            </div>

            {/* Nombres */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.names")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.name_es")}
                  <input
                    type="text"
                    value={formState.nameEs}
                    onChange={(event) => setFormState({ ...formState, nameEs: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.name_en")}
                  <input
                    type="text"
                    value={formState.nameEn}
                    onChange={(event) => setFormState({ ...formState, nameEn: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            {/* Ensalada, Jugo, Postre */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.content")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.salad_es")}
                  <input
                    type="text"
                    value={formState.saladEs}
                    onChange={(event) => setFormState({ ...formState, saladEs: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.salad_en")}
                  <input
                    type="text"
                    value={formState.saladEn}
                    onChange={(event) => setFormState({ ...formState, saladEn: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.juice_es")}
                  <input
                    type="text"
                    value={formState.juiceEs}
                    onChange={(event) => setFormState({ ...formState, juiceEs: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.juice_en")}
                  <input
                    type="text"
                    value={formState.juiceEn}
                    onChange={(event) => setFormState({ ...formState, juiceEn: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.dessert_es")}
                  <input
                    type="text"
                    value={formState.dessertEs}
                    onChange={(event) => setFormState({ ...formState, dessertEs: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.dessert_en")}
                  <input
                    type="text"
                    value={formState.dessertEn}
                    onChange={(event) => setFormState({ ...formState, dessertEn: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            {/* Precio y Costos */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.costs")}</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.price")}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.price}
                    onChange={(event) => setFormState({ ...formState, price: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.cost")}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.cost}
                    onChange={(event) => setFormState({ ...formState, cost: event.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.margin")}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.margin}
                    onChange={(event) => setFormState({ ...formState, margin: event.target.value })}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            {/* Información Nutricional */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.nutrition")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.calories")}
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formState.calories}
                    onChange={(event) => setFormState({ ...formState, calories: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.protein")}
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.protein}
                    onChange={(event) => setFormState({ ...formState, protein: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.carbs")}
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.carbs}
                    onChange={(event) => setFormState({ ...formState, carbs: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.fats")}
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.fats}
                    onChange={(event) => setFormState({ ...formState, fats: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.fiber")}
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.fiber}
                    onChange={(event) => setFormState({ ...formState, fiber: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.product_manager.sugars")}
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.sugars}
                    onChange={(event) => setFormState({ ...formState, sugars: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.vitamin_a")}
                  <input
                    type="text"
                    value={formState.vitaminA}
                    onChange={(event) => setFormState({ ...formState, vitaminA: event.target.value })}
                    placeholder="Ej: Alto, Muy Alto"
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.vitamin_c")}
                  <input
                    type="text"
                    value={formState.vitaminC}
                    onChange={(event) => setFormState({ ...formState, vitaminC: event.target.value })}
                    placeholder="Ej: Alto, Muy Alto"
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            {/* Beneficios */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.benefits")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.benefit_es")}
                  <input
                    type="text"
                    value={formState.benefitEs}
                    onChange={(event) => setFormState({ ...formState, benefitEs: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.benefit_en")}
                  <input
                    type="text"
                    value={formState.benefitEn}
                    onChange={(event) => setFormState({ ...formState, benefitEn: event.target.value })}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.benefit_detail_es")}
                  <textarea
                    value={formState.benefitDetailEs}
                    onChange={(event) => setFormState({ ...formState, benefitDetailEs: event.target.value })}
                    rows={2}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.benefit_detail_en")}
                  <textarea
                    value={formState.benefitDetailEn}
                    onChange={(event) => setFormState({ ...formState, benefitDetailEn: event.target.value })}
                    rows={2}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.recommended_es")}
                  <textarea
                    value={formState.recommendedForEs}
                    onChange={(event) => setFormState({ ...formState, recommendedForEs: event.target.value })}
                    rows={2}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.recommended_en")}
                  <textarea
                    value={formState.recommendedForEn}
                    onChange={(event) => setFormState({ ...formState, recommendedForEn: event.target.value })}
                    rows={2}
                    required
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            {/* Imagen */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.image_title")}</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                {t("admin.combo_manager.image_url")}
                <input
                  type="url"
                  value={formState.image}
                  onChange={(event) => setFormState({ ...formState, image: event.target.value })}
                  placeholder="https://... o /assets/images/combos/..."
                  className={fieldClass}
                />
              </label>
              {selectedCombo && (
                <ImageUploadField
                  label={t("admin.combo_manager.upload_image")}
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
                    className="h-32 w-32 rounded-lg border border-white/60 object-cover"
                    unoptimized={formState.image?.startsWith('http') || formState.image?.startsWith('https')}
                  />
                </div>
              )}
            </div>

            {/* Ingredientes */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.ingredients")}</h4>
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                {t("admin.combo_manager.ingredients")}
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
                  className={fieldMonoClass}
                  placeholder='[{"es": "...", "en": "..."}]'
                />
              </label>
            </div>

            {/* Estado */}
            <div className="space-y-3 border-b border-white/40 pb-4">
              <h4 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-wide">{t("admin.combo_manager.status_title")}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--gd-color-text-muted)]">
                  {t("admin.combo_manager.status_label")}
                  <select
                    value={formState.status}
                    onChange={(event) =>
                      setFormState({ ...formState, status: event.target.value as Combo["status"] })
                    }
                    className={fieldClass}
                  >
                    <option value="active">{t("admin.combo_manager.active")}</option>
                    <option value="inactive">{t("admin.combo_manager.inactive")}</option>
                    <option value="coming_soon">{t("admin.combo_manager.coming_soon")}</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                  <input
                    type="checkbox"
                    checked={formState.glutenFree}
                    onChange={(event) => setFormState({ ...formState, glutenFree: event.target.checked })}
                    className={checkboxClass}
                  />
                  {t("admin.product_manager.gluten_free")}
                </label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                <input
                  type="checkbox"
                  checked={formState.isFeatured}
                  onChange={(event) => setFormState({ ...formState, isFeatured: event.target.checked })}
                  className={checkboxClass}
                />
                {t("admin.combo_manager.show_featured")}
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-[var(--gd-color-forest)]">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[var(--gd-color-leaf)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--gd-color-forest)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? t("admin.combo_manager.saving") : t("admin.combo_manager.save")}
            </button>
          </form>
        ) : (
          <p className="text-sm text-[var(--gd-color-text-muted)]">{t("admin.combo_manager.select_hint")}</p>
        )}
      </div>
    </div>
  );
}
