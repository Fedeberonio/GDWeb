"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { adminFetch } from "@/modules/admin/api/client";
import { ImageUploadField } from "@/modules/admin/components/image-upload-field";
import { ProductImageFallback } from "@/app/_components/product-image-fallback";
import type { Product, ProductCategory } from "@/modules/catalog/types";

const STATUS_OPTIONS: Product["status"][] = ["active", "inactive", "coming_soon", "discontinued"];

type ProductManagerProps = {
  initialProducts: Product[];
  categories: ProductCategory[];
  onProductCreated: (product: Product) => void;
};

type FormState = {
  sku: string;
  nameEs: string;
  nameEn: string;
  priceAmount: string;
  salePriceAmount: string;
  priceCurrency: string;
  descriptionEs: string;
  descriptionEn: string;
  unitEs: string;
  unitEn: string;
  image: string;
  tags: string;
  status: Product["status"];
  isFeatured: boolean;
  categoryId: string;
  slotValue: string;
  wholesaleCost: string;
  weightKg: string;
  storageEs: string;
  storageEn: string;
  dimensionLength: string;
  dimensionWidth: string;
  dimensionHeight: string;
  vegan: boolean;
  glutenFree: boolean;
  organic: boolean;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugars: string;
};

function buildInitialForm(product: Product): FormState {
  return {
    sku: product.sku ?? "",
    nameEs: product.name.es ?? "",
    nameEn: product.name.en ?? "",
    priceAmount: product.price.amount.toString(),
    salePriceAmount: product.salePrice?.amount.toString() ?? "",
    priceCurrency: product.price.currency,
    descriptionEs: product.description?.es ?? "",
    descriptionEn: product.description?.en ?? "",
    unitEs: product.unit?.es ?? "",
    unitEn: product.unit?.en ?? "",
    image: product.image ?? "",
    tags: product.tags.join(", "),
    status: product.status,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    slotValue: product.metadata?.slotValue?.toString() ?? "",
    wholesaleCost: product.metadata?.wholesaleCost?.toString() ?? "",
    weightKg: product.logistics?.weightKg?.toString() ?? "",
    storageEs: product.logistics?.storage?.es ?? "",
    storageEn: product.logistics?.storage?.en ?? "",
    dimensionLength: product.logistics?.dimensionsCm?.length.toString() ?? "",
    dimensionWidth: product.logistics?.dimensionsCm?.width.toString() ?? "",
    dimensionHeight: product.logistics?.dimensionsCm?.height.toString() ?? "",
    vegan: product.nutrition?.vegan ?? false,
    glutenFree: product.nutrition?.glutenFree ?? false,
    organic: product.nutrition?.organic ?? false,
    calories: product.nutrition?.calories?.toString() ?? "",
    protein: product.nutrition?.protein?.toString() ?? "",
    carbs: product.nutrition?.carbs?.toString() ?? "",
    fats: product.nutrition?.fats?.toString() ?? "",
    fiber: product.nutrition?.fiber?.toString() ?? "",
    sugars: product.nutrition?.sugars?.toString() ?? "",
  };
}

type ProductFormProps = {
  selectedProduct: Product | null;
  formState: FormState | null;
  categories: ProductCategory[];
  saving: boolean;
  error: string | null;
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setFormState: React.Dispatch<React.SetStateAction<FormState | null>>;
};

function ProductForm({
  selectedProduct,
  formState,
  categories,
  saving,
  error,
  message,
  onSubmit,
  setFormState,
}: ProductFormProps) {
  if (!selectedProduct || !formState) {
    return <p className="text-sm text-slate-500">Selecciona un producto para editar sus datos.</p>;
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {/* Información del producto */}
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Información del Producto</h3>
        <p className="text-xs text-slate-400">ID: {selectedProduct.id}</p>
      </div>

      {/* SKU */}
      <div className="space-y-3 border-b border-slate-200 pb-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">SKU</h4>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          SKU (Código de producto)
          <input
            type="text"
            value={formState.sku}
            onChange={(event) => setFormState({ ...formState, sku: event.target.value })}
            placeholder="Opcional"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>

      {/* Nombres */}
      <div className="space-y-3">
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

      {/* Precios */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Precios</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Precio Regular (DOP) *
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
            Precio de Oferta (DOP)
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.salePriceAmount}
              onChange={(event) => setFormState({ ...formState, salePriceAmount: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Estado y Categoría */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Estado
          <select
            value={formState.status}
            onChange={(event) => setFormState({ ...formState, status: event.target.value as Product["status"] })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        {/* Categoría */}
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Categoría
          <select
            value={formState.categoryId}
            onChange={(event) => setFormState({ ...formState, categoryId: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.es}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Descripciones */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
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

      {/* Unidades */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Unidades de Venta</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Unidad (ES)
            <input
              type="text"
              value={formState.unitEs}
              onChange={(event) => setFormState({ ...formState, unitEs: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Unidad (EN)
            <input
              type="text"
              value={formState.unitEn}
              onChange={(event) => setFormState({ ...formState, unitEn: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Imagen */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Imagen</h4>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          URL de Imagen
          <input
            type="text"
            inputMode="url"
            value={formState.image}
            onChange={(event) => setFormState({ ...formState, image: event.target.value })}
            placeholder="https://... o /images/products/..."
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          {formState.image && (
            <div className="mt-2">
              <Image
                src={formState.image}
                alt="Preview"
                width={128}
                height={128}
                className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
              />
            </div>
          )}
        </label>

        {selectedProduct && (
          <ImageUploadField
            label="Subir nueva imagen"
            pathPrefix={`products/${selectedProduct.id}`}
            onUploaded={(url) => setFormState((state) => ({ ...state!, image: url }))}
          />
        )}
      </div>

      {/* Metadata y Logística */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Metadata y Logística</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Slots
            <input
              type="number"
              min="1"
              step="1"
              value={formState.slotValue}
              onChange={(event) => setFormState({ ...formState, slotValue: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Costo mayorista (DOP)
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.wholesaleCost}
              onChange={(event) => setFormState({ ...formState, wholesaleCost: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Peso (kg)
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.weightKg}
              onChange={(event) => setFormState({ ...formState, weightKg: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Valores Nutricionales */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Valores Nutricionales</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={formState.vegan}
              onChange={(event) => setFormState({ ...formState, vegan: event.target.checked })}
              className="h-4 w-4 rounded border border-slate-300"
            />
            Vegano
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
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={formState.organic}
              onChange={(event) => setFormState({ ...formState, organic: event.target.checked })}
              className="h-4 w-4 rounded border border-slate-300"
            />
            Orgánico
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Calorías
            <input
              type="number"
              min="0"
              step="1"
              value={formState.calories}
              onChange={(event) => setFormState({ ...formState, calories: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Proteínas (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.protein}
              onChange={(event) => setFormState({ ...formState, protein: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Carbohidratos (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.carbs}
              onChange={(event) => setFormState({ ...formState, carbs: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Grasas (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.fats}
              onChange={(event) => setFormState({ ...formState, fats: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Fibra (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.fiber}
              onChange={(event) => setFormState({ ...formState, fiber: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Azúcares (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.sugars}
              onChange={(event) => setFormState({ ...formState, sugars: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Logística y Dimensiones */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Logística</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Almacenamiento (ES)
            <input
              type="text"
              value={formState.storageEs}
              onChange={(event) => setFormState({ ...formState, storageEs: event.target.value })}
              placeholder="Ej: Refrigerado"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Almacenamiento (EN)
            <input
              type="text"
              value={formState.storageEn}
              onChange={(event) => setFormState({ ...formState, storageEn: event.target.value })}
              placeholder="Ej: Refrigerated"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Largo (cm)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.dimensionLength}
              onChange={(event) => setFormState({ ...formState, dimensionLength: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ancho (cm)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.dimensionWidth}
              onChange={(event) => setFormState({ ...formState, dimensionWidth: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Alto (cm)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formState.dimensionHeight}
              onChange={(event) => setFormState({ ...formState, dimensionHeight: event.target.value })}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Tags y Destacado */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Tags (separados por coma)
          <input
            type="text"
            value={formState.tags}
            onChange={(event) => setFormState({ ...formState, tags: event.target.value })}
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
  );
}

type NewProductFormProps = {
  categories: ProductCategory[];
  onCreated: (product: Product) => void;
};

function NewProductForm({ categories, onCreated }: NewProductFormProps) {
  const [form, setForm] = useState({
    nameEs: "",
    nameEn: "",
    categoryId: categories[0]?.id ?? "",
    priceAmount: "",
    priceCurrency: "DOP",
    status: "active" as Product["status"],
    descriptionEs: "",
    descriptionEn: "",
    unitEs: "",
    unitEn: "",
    tags: "",
    image: "",
    isFeatured: false,
    slotValue: "",
    wholesaleCost: "",
    weightKg: "",
    storageEs: "",
    storageEn: "",
    dimensionLength: "",
    dimensionWidth: "",
    dimensionHeight: "",
    vegan: false,
    glutenFree: false,
    organic: false,
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
    sugars: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.nameEs.trim() || !form.nameEn.trim() || !form.priceAmount.trim()) {
      setError("Completa nombre y precio.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const slotValue = form.slotValue.trim();
      const wholesaleCost = form.wholesaleCost.trim();
      const weightKg = form.weightKg.trim();
      const storageEs = form.storageEs.trim();
      const storageEn = form.storageEn.trim();
      const dimensionLength = form.dimensionLength.trim();
      const dimensionWidth = form.dimensionWidth.trim();
      const dimensionHeight = form.dimensionHeight.trim();
      const calories = form.calories.trim();
      const protein = form.protein.trim();
      const carbs = form.carbs.trim();
      const fats = form.fats.trim();
      const fiber = form.fiber.trim();
      const sugars = form.sugars.trim();
      const metadata =
        slotValue || wholesaleCost
          ? {
              slotValue: slotValue ? Number(slotValue) : undefined,
              wholesaleCost: wholesaleCost ? Number(wholesaleCost) : undefined,
            }
          : undefined;
      const dimensions = dimensionLength && dimensionWidth && dimensionHeight
        ? {
            length: Number(dimensionLength),
            width: Number(dimensionWidth),
            height: Number(dimensionHeight),
          }
        : undefined;
      const storage = storageEs || storageEn
        ? {
            es: storageEs || storageEn,
            en: storageEn || storageEs,
          }
        : undefined;
      const logistics =
        weightKg || dimensions || storage
          ? {
              ...(weightKg ? { weightKg: Number(weightKg) } : {}),
              ...(dimensions ? { dimensionsCm: dimensions } : {}),
              ...(storage ? { storage } : {}),
            }
          : undefined;
      const nutrition =
        form.vegan ||
        form.glutenFree ||
        form.organic ||
        calories ||
        protein ||
        carbs ||
        fats ||
        fiber ||
        sugars
          ? {
              vegan: form.vegan || undefined,
              glutenFree: form.glutenFree || undefined,
              organic: form.organic || undefined,
              calories: calories ? Number(calories) : undefined,
              protein: protein ? Number(protein) : undefined,
              carbs: carbs ? Number(carbs) : undefined,
              fats: fats ? Number(fats) : undefined,
              fiber: fiber ? Number(fiber) : undefined,
              sugars: sugars ? Number(sugars) : undefined,
            }
          : undefined;

      const response = await adminFetch("/api/admin/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: { es: form.nameEs, en: form.nameEn },
          categoryId: form.categoryId || categories[0]?.id,
          price: {
            amount: Number(form.priceAmount),
            currency: form.priceCurrency,
          },
          status: form.status,
          description:
            form.descriptionEs || form.descriptionEn
              ? { es: form.descriptionEs, en: form.descriptionEn }
              : undefined,
          unit:
            form.unitEs || form.unitEn
              ? { es: form.unitEs || form.unitEn, en: form.unitEn || form.unitEs }
              : undefined,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          image: form.image || undefined,
          isFeatured: form.isFeatured,
          ...(metadata ? { metadata } : {}),
          ...(nutrition ? { nutrition } : {}),
          ...(logistics ? { logistics } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo crear el producto");
      }
      onCreated(json.data);
      setMessage("Producto creado con éxito");
      setForm({
        nameEs: "",
        nameEn: "",
        categoryId: categories[0]?.id ?? "",
        priceAmount: "",
        priceCurrency: "DOP",
        status: "active",
        descriptionEs: "",
        descriptionEn: "",
        unitEs: "",
        unitEn: "",
        tags: "",
        image: "",
        isFeatured: false,
        slotValue: "",
        wholesaleCost: "",
        weightKg: "",
        storageEs: "",
        storageEn: "",
        dimensionLength: "",
        dimensionWidth: "",
        dimensionHeight: "",
        vegan: false,
        glutenFree: false,
        organic: false,
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        fiber: "",
        sugars: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">Producto nuevo</p>
          <h3 className="text-lg font-semibold text-slate-900">Agregar un producto al catálogo</h3>
        </div>
        <button
          type="submit"
          className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-brand-accent)] disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Guardando..." : "Crear"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Nombre (ES)
          <input
            type="text"
            value={form.nameEs}
            onChange={(event) => setForm({ ...form, nameEs: event.target.value })}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Nombre (EN)
          <input
            type="text"
            value={form.nameEn}
            onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Categoría
          <select
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.es}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Precio (DOP)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.priceAmount}
            onChange={(event) => setForm({ ...form, priceAmount: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Slots
          <input
            type="number"
            min="1"
            step="1"
            value={form.slotValue}
            onChange={(event) => setForm({ ...form, slotValue: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Costo mayorista (DOP)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.wholesaleCost}
            onChange={(event) => setForm({ ...form, wholesaleCost: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Peso (kg)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.weightKg}
            onChange={(event) => setForm({ ...form, weightKg: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Estado
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as Product["status"] })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Unidad (ES)
          <input
            type="text"
            value={form.unitEs}
            onChange={(event) => setForm({ ...form, unitEs: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Unidad (EN)
          <input
            type="text"
            value={form.unitEn}
            onChange={(event) => setForm({ ...form, unitEn: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Tags
          <input
            type="text"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Imagen (URL)
          <input
            type="url"
            value={form.image}
            onChange={(event) => setForm({ ...form, image: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Almacenamiento (ES)
          <input
            type="text"
            value={form.storageEs}
            onChange={(event) => setForm({ ...form, storageEs: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Almacenamiento (EN)
          <input
            type="text"
            value={form.storageEn}
            onChange={(event) => setForm({ ...form, storageEn: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Largo (cm)
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.dimensionLength}
            onChange={(event) => setForm({ ...form, dimensionLength: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Ancho (cm)
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.dimensionWidth}
            onChange={(event) => setForm({ ...form, dimensionWidth: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Alto (cm)
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.dimensionHeight}
            onChange={(event) => setForm({ ...form, dimensionHeight: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Valores Nutricionales</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.vegan}
              onChange={(event) => setForm({ ...form, vegan: event.target.checked })}
              className="h-4 w-4 rounded border border-slate-300"
            />
            Vegano
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.glutenFree}
              onChange={(event) => setForm({ ...form, glutenFree: event.target.checked })}
              className="h-4 w-4 rounded border border-slate-300"
            />
            Sin Gluten
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.organic}
              onChange={(event) => setForm({ ...form, organic: event.target.checked })}
              className="h-4 w-4 rounded border border-slate-300"
            />
            Orgánico
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Calorías
            <input
              type="number"
              min="0"
              step="1"
              value={form.calories}
              onChange={(event) => setForm({ ...form, calories: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Proteínas (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.protein}
              onChange={(event) => setForm({ ...form, protein: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Carbohidratos (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.carbs}
              onChange={(event) => setForm({ ...form, carbs: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Grasas (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.fats}
              onChange={(event) => setForm({ ...form, fats: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Fibra (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.fiber}
              onChange={(event) => setForm({ ...form, fiber: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Azúcares (g)
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.sugars}
              onChange={(event) => setForm({ ...form, sugars: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </label>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
        <input
          type="checkbox"
          checked={form.isFeatured}
          onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
        />
        Destacado
      </label>
    </form>
  );
}

export function ProductManager({ initialProducts, categories, onProductCreated }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickActionProductId, setQuickActionProductId] = useState<string | null>(null);
  const categoriesMap = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category.name.es])), [
    categories,
  ]);

  const selectedProduct = useMemo(
    () => (selectedId ? products.find((product) => product.id === selectedId) ?? null : null),
    [products, selectedId],
  );

  useEffect(() => {
    if (selectedProduct) {
      setFormState(buildInitialForm(selectedProduct));
      setMessage(null);
      setError(null);
    }
  }, [selectedProduct]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = query
        ? product.name.es.toLowerCase().includes(query.toLowerCase()) ||
        product.name.en.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesCategory = categoryFilter === "all" ? true : product.categoryId === categoryFilter;
      const matchesStatus = statusFilter === "all" ? true : product.status === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, categoryFilter, statusFilter]);

  async function sendProductUpdate(productId: string, payload: Record<string, unknown>) {
    const response = await adminFetch(`/api/admin/catalog/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error ?? "No se pudo guardar el producto");
    }

    setProducts((prev) => prev.map((product) => (product.id === productId ? (json.data as Product) : product)));
    return json.data as Product;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct || !formState) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    const tags = formState.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const slotValue = formState.slotValue.trim();
    const wholesaleCost = formState.wholesaleCost.trim();
    const weightKg = formState.weightKg.trim();
    const salePriceAmount = formState.salePriceAmount.trim();
    const storageEs = formState.storageEs.trim();
    const storageEn = formState.storageEn.trim();
    const dimensionLength = formState.dimensionLength.trim();
    const dimensionWidth = formState.dimensionWidth.trim();
    const dimensionHeight = formState.dimensionHeight.trim();
    const calories = formState.calories.trim();
    const protein = formState.protein.trim();
    const carbs = formState.carbs.trim();
    const fats = formState.fats.trim();
    const fiber = formState.fiber.trim();
    const sugars = formState.sugars.trim();

    const metadata =
      slotValue || wholesaleCost
        ? {
            slotValue: slotValue ? Number(slotValue) : undefined,
            wholesaleCost: wholesaleCost ? Number(wholesaleCost) : undefined,
          }
        : undefined;

    const nutrition =
      formState.vegan ||
      formState.glutenFree ||
      formState.organic ||
      calories ||
      protein ||
      carbs ||
      fats ||
      fiber ||
      sugars
        ? {
            vegan: formState.vegan || undefined,
            glutenFree: formState.glutenFree || undefined,
            organic: formState.organic || undefined,
            calories: calories ? Number(calories) : undefined,
            protein: protein ? Number(protein) : undefined,
            carbs: carbs ? Number(carbs) : undefined,
            fats: fats ? Number(fats) : undefined,
            fiber: fiber ? Number(fiber) : undefined,
            sugars: sugars ? Number(sugars) : undefined,
          }
        : undefined;

    const dimensions = dimensionLength && dimensionWidth && dimensionHeight
      ? {
          length: Number(dimensionLength),
          width: Number(dimensionWidth),
          height: Number(dimensionHeight),
        }
      : undefined;

    const storage = storageEs || storageEn
      ? {
          es: storageEs || storageEn,
          en: storageEn || storageEs,
        }
      : undefined;

    const logistics = weightKg || dimensions || storage
      ? {
          ...(weightKg ? { weightKg: Number(weightKg) } : {}),
          ...(dimensions ? { dimensionsCm: dimensions } : {}),
          ...(storage ? { storage } : {}),
        }
      : undefined;

    const payload: Record<string, unknown> = {
      sku: formState.sku.trim() || undefined,
      name: {
        es: formState.nameEs.trim(),
        en: formState.nameEn.trim(),
      },
      price: {
        amount: Number(formState.priceAmount),
        currency: formState.priceCurrency || "DOP",
      },
      salePrice: salePriceAmount 
        ? {
            amount: Number(salePriceAmount),
            currency: formState.priceCurrency || "DOP",
          }
        : null,
      description: {
        es: formState.descriptionEs.trim(),
        en: formState.descriptionEn.trim(),
      },
      unit:
        formState.unitEs || formState.unitEn
          ? {
            es: formState.unitEs.trim() || formState.unitEn.trim(),
            en: formState.unitEn.trim() || formState.unitEs.trim(),
          }
          : undefined,
      image: formState.image.trim() || undefined,
      tags,
      status: formState.status,
      isFeatured: formState.isFeatured,
      categoryId: formState.categoryId,
      ...(metadata ? { metadata } : {}),
      ...(nutrition ? { nutrition } : {}),
      ...(logistics ? { logistics } : {}),
    };

    try {
      await sendProductUpdate(selectedProduct.id, payload);
      setMessage("Cambios guardados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFeatured(product: Product) {
    setQuickActionProductId(product.id);
    try {
      await sendProductUpdate(product.id, { isFeatured: !product.isFeatured });
      setMessage(product.isFeatured ? "Producto quitado de destacados" : "Producto destacado");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setQuickActionProductId(null);
    }
  }

  async function handleToggleStatus(product: Product) {
    const nextStatus = product.status === "active" ? "inactive" : "active";
    setQuickActionProductId(product.id);
    try {
      await sendProductUpdate(product.id, { status: nextStatus });
      setMessage(nextStatus === "active" ? "Producto activado" : "Producto desactivado");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setQuickActionProductId(null);
    }
  }

  return (
    <>
      <NewProductForm
        categories={categories}
        onCreated={(product) => {
          setProducts((prev) => [...prev, product]);
          onProductCreated(product);
        }}
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto"
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-green-500"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-green-500 sm:w-48"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.es}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-green-500 sm:w-40"
          >
            <option value="all">Todos los estados</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedId === product.id;
            const isBusy = quickActionProductId === product.id;

            return (
              <div
                key={product.id}
                className={`rounded-3xl border bg-white p-4 shadow-soft transition ${isSelected ? "border-green-500 ring-2 ring-green-100" : "border-slate-200 hover:border-green-200"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(product.id)}
                  className="flex w-full items-center gap-4 text-left"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 relative">
                    <ProductImageFallback
                      product={product}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{product.name.es}</p>
                    <p className="text-xs text-slate-500">{categoriesMap[product.categoryId] ?? "Sin categoría"}</p>
                    <p className="text-xs text-slate-400">{product.tags.slice(0, 3).join(" · ")}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">RD${product.price.amount.toLocaleString("es-DO")}</p>
                    <p className="text-xs uppercase text-slate-400">{product.status}</p>
                  </div>
                </button>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleFeatured(product);
                    }}
                    disabled={isBusy}
                    className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {product.isFeatured ? "Quitar destacado" : "Destacar"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleStatus(product);
                    }}
                    disabled={isBusy}
                    className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition hover:border-green-500 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {product.status === "active" ? "Desactivar" : "Activar"}
                  </button>
                </div>
                {isSelected && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
                    <ProductForm
                      selectedProduct={selectedProduct}
                      formState={formState}
                      categories={categories}
                      saving={saving}
                      error={error}
                      message={message}
                      onSubmit={handleSubmit}
                      setFormState={setFormState}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {!filteredProducts.length && (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No se encontraron productos para los filtros seleccionados.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
