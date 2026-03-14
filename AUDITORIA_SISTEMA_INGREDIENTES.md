# AUDITORÍA: SISTEMA DE INGREDIENTES
## Pre-implementación - Estado Actual del Código

**Fecha:** 2026-02-07  
**Objetivo:** Documentar el estado actual antes de agregar sistema de ingredientes

---

## STEP 1: SUPPLY TYPES

### Archivo: `apps/web/src/modules/supplies/types.ts`

#### 1.1 Complete Supply Interface

```typescript
export type Supply = {
  id: string;
  name: string;
  category: "Packaging" | "Glass" | "Labels" | "Other";
  unit?: string;
  supplier?: string;
  imageUrl?: string;
  unitPrice?: number;
  currency?: string;
  stock: number;
  minStock: number;
  isReturnable: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
```

#### 1.2 SupplyCategory Type Definition

**NO existe un tipo `SupplyCategory` separado.**

La categoría está definida como un **union type literal** directamente en el campo `category`:

```typescript
category: "Packaging" | "Glass" | "Labels" | "Other"
```

#### 1.3 All Fields That Exist

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | ✅ Sí | Identificador único del insumo |
| `name` | `string` | ✅ Sí | Nombre del insumo |
| `category` | `"Packaging" \| "Glass" \| "Labels" \| "Other"` | ✅ Sí | Categoría del insumo (union type literal) |
| `unit` | `string` | ❌ Opcional | Unidad de medida (ej: "kg", "und", "mts") |
| `supplier` | `string` | ❌ Opcional | Proveedor del insumo |
| `imageUrl` | `string` | ❌ Opcional | URL de la imagen |
| `unitPrice` | `number` | ❌ Opcional | Precio unitario |
| `currency` | `string` | ❌ Opcional | Moneda (default: "DOP") |
| `stock` | `number` | ✅ Sí | Stock actual |
| `minStock` | `number` | ✅ Sí | Stock mínimo |
| `isReturnable` | `boolean` | ✅ Sí | Si es retornable |
| `notes` | `string` | ❌ Opcional | Notas adicionales |
| `metadata` | `Record<string, unknown>` | ❌ Opcional | Metadatos adicionales |
| `createdAt` | `Date \| string` | ❌ Opcional | Fecha de creación |
| `updatedAt` | `Date \| string` | ❌ Opcional | Fecha de actualización |

**Nota:** También existe `SupplyMeta` type (líneas 1-6) pero no se usa en el tipo `Supply` principal.

---

## STEP 2: SUPPLY FORM/UI - CATEGORY SELECTOR

### Archivo: `apps/web/src/app/admin/supplies/page.tsx`

#### 2.1 Where Category is Selected

**Hay DOS lugares donde se selecciona la categoría:**

**A) Modal de Creación de Nuevo Insumo:**
- **Líneas:** 752-763
- **Componente:** `<select>` dentro del modal `newSupplyOpen`

**B) Modal de Edición de Insumo Existente:**
- **Líneas:** 898-909
- **Componente:** `<select>` dentro del modal `editingSupply`

#### 2.2 Line Numbers for Category Selector

**Creación (Nuevo Insumo):**
```typescript
// Líneas 752-763
<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  Categoría
  <select
    value={newSupply.category}
    onChange={(e) => setNewSupply((prev) => ({ ...prev, category: e.target.value }))}
    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
  >
    <option value="Packaging">Packaging</option>
    <option value="Glass">Glass</option>
    <option value="Labels">Labels</option>
    <option value="Other">Other</option>
  </select>
</label>
```

**Edición (Insumo Existente):**
```typescript
// Líneas 898-909
<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  Categoría
  <select
    value={editingDraft.category}
    onChange={(e) => setEditingDraft((prev) => ({ ...prev, category: e.target.value }))}
    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
  >
    <option value="Packaging">Packaging</option>
    <option value="Glass">Glass</option>
    <option value="Labels">Labels</option>
    <option value="Other">Other</option>
  </select>
</label>
```

#### 2.3 Current Category Options

**Opciones disponibles (hardcoded en ambos selects):**

1. **"Packaging"** - Etiqueta: "Packaging"
2. **"Glass"** - Etiqueta: "Glass" (pero se muestra como "Botellas/Frascos" en la tabla)
3. **"Labels"** - Etiqueta: "Labels" (pero se muestra como "Etiquetas" en la tabla)
4. **"Other"** - Etiqueta: "Other" (pero se muestra como "Otros" en la tabla)

**Nota:** Existe un objeto `CATEGORY_LABELS` (líneas 25-30) que mapea los valores a etiquetas en español para mostrar en la tabla:

```typescript
const CATEGORY_LABELS: Record<string, string> = {
  Packaging: "Packaging",
  Glass: "Botellas/Frascos",
  Labels: "Etiquetas",
  Other: "Otros",
};
```

**También existe `CATEGORY_FILTERS`** (líneas 17-23) usado para los botones de filtro:

```typescript
const CATEGORY_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "Packaging", label: "Packaging" },
  { id: "Glass", label: "Botellas/Frascos" },
  { id: "Labels", label: "Etiquetas" },
  { id: "Other", label: "Otros" },
];
```

---

## STEP 3: CURRENT RECIPE HANDLERS

### Archivo: `apps/web/src/modules/admin/catalog/components/product-edit-drawer.tsx`

#### 3.1 Current RecipeIngredient State Type in formState

**Línea 41:** Definición en `FormState` type:

```typescript
recipeIngredients: { productId: string; quantity: number; unit: string }[];
```

**Estructura:**
- `productId`: string (ID/SKU del producto ingrediente)
- `quantity`: number (cantidad necesaria)
- `unit`: string (unidad de medida, ej: "kg", "und", "lb", "g", "L", "ml")

**Líneas 89-95:** Inicialización desde producto existente:

```typescript
const recipeIngredients = Array.isArray(product.recipe?.ingredients)
  ? product.recipe?.ingredients.map((item) => ({
      productId: item.productId ?? "",
      quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0,
      unit: item.unit ?? "und",
    }))
  : [];
```

#### 3.2 The handleIngredientChange Function (Complete)

**Líneas 385-399:**

```typescript
const handleIngredientChange = useCallback(
  (index: number, field: "productId" | "quantity" | "unit", value: string) => {
    setFormState((prev) => {
      if (!prev) return prev;
      if (!prev.recipeIngredients[index]) return prev;
      const nextIngredients = [...prev.recipeIngredients];
      const current = nextIngredients[index];
      const nextValue =
        field === "quantity" ? (Number.isFinite(Number(value)) ? Number(value) : 0) : value;
      nextIngredients[index] = { ...current, [field]: nextValue };
      return { ...prev, recipeIngredients: nextIngredients };
    });
  },
  [],
);
```

**Funcionalidad:**
- Actualiza un campo específico de un ingrediente en el array
- Parámetros: `index` (posición), `field` (campo a actualizar), `value` (nuevo valor)
- Si `field === "quantity"`, convierte a número y valida con `Number.isFinite`
- Si no es válido, usa `0` como fallback
- Para otros campos (`productId`, `unit`), usa el valor directamente como string

#### 3.3 The handleAddIngredient Function (Complete)

**Líneas 365-373:**

```typescript
const handleAddIngredient = useCallback(() => {
  setFormState((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      recipeIngredients: [...prev.recipeIngredients, { productId: "", quantity: 1, unit: "und" }],
    };
  });
}, []);
```

**Funcionalidad:**
- Agrega un nuevo ingrediente al array `recipeIngredients`
- Valores por defecto:
  - `productId`: `""` (vacío, debe ser completado por el usuario)
  - `quantity`: `1`
  - `unit`: `"und"` (unidad)

#### 3.4 Line Numbers Where These Are Defined

| Función | Líneas | Tipo |
|---------|--------|------|
| `handleIngredientChange` | 385-399 | `useCallback` |
| `handleAddIngredient` | 365-373 | `useCallback` |
| `handleRemoveIngredient` | 375-383 | `useCallback` (bonus) |
| `handleRecipeYieldChange` | 358-363 | `useCallback` (bonus) |

**Bonus - handleRemoveIngredient (líneas 375-383):**
```typescript
const handleRemoveIngredient = useCallback((index: number) => {
  setFormState((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      recipeIngredients: prev.recipeIngredients.filter((_, idx) => idx !== index),
    };
  });
}, []);
```

**Bonus - handleRecipeYieldChange (líneas 358-363):**
```typescript
const handleRecipeYieldChange = useCallback((value: string) => {
  setFormState((prev) => {
    if (!prev) return prev;
    return { ...prev, recipeYields: value };
  });
}, []);
```

---

## STEP 4: HANDLESAVE - RECIPE SERIALIZATION

### Archivo: `apps/web/src/modules/admin/catalog/components/product-edit-drawer.tsx`

#### 4.1 Does it Already Serialize Recipe Data?

**✅ SÍ, ya serializa datos de receta.**

**Líneas 250-264:** Normalización de ingredientes:

```typescript
const normalizedRecipeIngredients = formState.recipeIngredients
  .map((ingredient) => ({
    productId: ingredient.productId.trim(),
    quantity: Number(ingredient.quantity) || 0,
    unit: ingredient.unit || "und",
  }))
  .filter((ingredient) => ingredient.productId && ingredient.quantity > 0);
```

**Líneas 258-264:** Construcción del payload de receta:

```typescript
const recipePayload =
  formState.type === "prepared"
    ? {
        yields: Math.max(1, Math.floor(Number(formState.recipeYields) || 1)),
        ingredients: normalizedRecipeIngredients,
      }
    : null;
```

#### 4.2 Does it Convert recipeYields/recipeIngredients to recipe Object?

**✅ SÍ, convierte a objeto `recipe`.**

**Línea 285:** El objeto `recipe` se incluye en el payload:

```typescript
const updatePayload = {
  // ... otros campos ...
  recipe: recipePayload,  // ← Se incluye aquí
  // ... otros campos ...
};
```

**Estructura del objeto `recipe` guardado:**

```typescript
{
  yields: number,        // Número de porciones que produce (mínimo 1)
  ingredients: Array<{
    productId: string,   // ID/SKU del producto ingrediente (trimmed)
    quantity: number,    // Cantidad necesaria (convertido a número, mínimo 0)
    unit: string        // Unidad de medida (default: "und")
  }>
}
```

**Condiciones:**
- Solo se guarda si `formState.type === "prepared"`
- Si no es tipo "prepared", `recipePayload = null` y se guarda `recipe: null`
- Los ingredientes se filtran: solo se incluyen si tienen `productId` no vacío y `quantity > 0`
- `yields` se valida: mínimo 1, se convierte a entero con `Math.floor`

#### 4.3 Line Numbers

| Sección | Líneas | Descripción |
|---------|--------|-------------|
| Normalización de ingredientes | 250-256 | Mapea y filtra ingredientes |
| Construcción de recipePayload | 258-264 | Crea objeto recipe si type === "prepared" |
| Inclusión en updatePayload | 285 | Se agrega `recipe: recipePayload` al payload |
| Envío a API | 329-333 | Se envía el payload completo a `/api/admin/catalog/products/${product.id}` |

**Código completo del flujo (líneas 250-285):**

```typescript
// Normalización
const normalizedRecipeIngredients = formState.recipeIngredients
  .map((ingredient) => ({
    productId: ingredient.productId.trim(),
    quantity: Number(ingredient.quantity) || 0,
    unit: ingredient.unit || "und",
  }))
  .filter((ingredient) => ingredient.productId && ingredient.quantity > 0);

// Construcción del objeto recipe
const recipePayload =
  formState.type === "prepared"
    ? {
        yields: Math.max(1, Math.floor(Number(formState.recipeYields) || 1)),
        ingredients: normalizedRecipeIngredients,
      }
    : null;

// Inclusión en payload
const updatePayload = {
  // ... otros campos ...
  recipe: recipePayload,
  // ... otros campos ...
};
```

---

## RESUMEN Y RECOMENDACIONES

### Estado Actual

✅ **Supply Types:**
- Categoría es union type literal: `"Packaging" | "Glass" | "Labels" | "Other"`
- No existe tipo `SupplyCategory` separado
- Todos los campos están bien definidos

✅ **Supply Form:**
- Selector de categoría en 2 lugares (creación y edición)
- Opciones hardcoded: Packaging, Glass, Labels, Other
- Existe mapeo a etiquetas en español para visualización

✅ **Recipe Handlers:**
- `handleIngredientChange`: Actualiza campos individuales
- `handleAddIngredient`: Agrega nuevo ingrediente con valores por defecto
- `handleRemoveIngredient`: Elimina ingrediente por índice
- `handleRecipeYieldChange`: Actualiza número de porciones

✅ **handleSave:**
- **YA serializa datos de receta**
- Convierte `recipeYields` y `recipeIngredients` a objeto `recipe`
- Solo guarda si `type === "prepared"`
- Valida y filtra ingredientes antes de guardar

### Consideraciones para Implementación

1. **Supply Categories:**
   - Si se agregan nuevas categorías, actualizar:
     - Tipo `Supply` en `types.ts`
     - Selects en `supplies/page.tsx` (2 lugares)
     - `CATEGORY_LABELS` y `CATEGORY_FILTERS`

2. **Recipe System:**
   - El sistema de recetas YA está implementado y funcionando
   - Usa `productId` (string) para referenciar productos ingredientes
   - Considerar si se necesita también referenciar `supplies` en recetas

3. **Ingredient System (Nuevo):**
   - Evaluar si se necesita un sistema separado de "ingredientes" además de recetas
   - O si se debe extender el sistema de recetas para incluir supplies como ingredientes

---

**Fin de la Auditoría**
