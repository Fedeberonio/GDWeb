# AUDITORÍA COMPLETA: SISTEMA DE COMBOS
## GreenDolio - Estado Actual y Relación con Admin

**Fecha:** 2026-02-06  
**Objetivo:** Documentación técnica completa del sistema de combos de almuerzo, su gestión desde admin y su integración con el frontend público.

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura de Datos](#2-arquitectura-de-datos)
3. [Estructura de Tipos y Schemas](#3-estructura-de-tipos-y-schemas)
4. [Gestión desde Admin](#4-gestión-desde-admin)
5. [Visualización en Frontend Público](#5-visualización-en-frontend-público)
6. [Integración con Carrito y Pedidos](#6-integración-con-carrito-y-pedidos)
7. [APIs y Endpoints](#7-apis-y-endpoints)
8. [Inconsistencias y Problemas Críticos](#8-inconsistencias-y-problemas-críticos)
9. [Flujos de Datos](#9-flujos-de-datos)
10. [Recomendaciones de Mejora](#10-recomendaciones-de-mejora)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estado Actual

El sistema de **Combos de Almuerzo** en GreenDolio presenta una **arquitectura dual** con inconsistencias significativas:

1. **Frontend Público:** Usa datos **hardcodeados** en el componente `LunchCombosSection`
2. **Admin Panel:** Gestiona combos desde Firebase (`lunch_combos`)
3. **Desconexión:** Los combos administrados en Firebase **NO se muestran** en el frontend público

### 1.2 Problemas Críticos Identificados

| Problema | Severidad | Impacto |
|----------|-----------|---------|
| **Datos hardcodeados en frontend** | 🔴 CRÍTICO | Los cambios en admin no se reflejan en el sitio público |
| **Dos colecciones diferentes** | 🔴 CRÍTICO | `lunch_combos` (admin) vs datos estáticos (frontend) |
| **Inconsistencia en tipos** | 🟡 MEDIO | `Combo` vs `LunchCombo` con estructuras diferentes |
| **Falta de sincronización** | 🔴 CRÍTICO | No hay conexión entre admin y frontend público |

### 1.3 Tecnologías Utilizadas

- **Base de Datos:** Firebase Firestore
- **Frontend:** Next.js 16.1.4 (React 19)
- **Backend:** Next.js API Routes + Express API (legacy)
- **Autenticación:** Firebase Auth (para admin)

---

## 2. ARQUITECTURA DE DATOS

### 2.1 Colecciones Firebase

#### Colección: `lunch_combos` (Admin)

**Ubicación en código:** `apps/web/src/app/api/admin/catalog/combos/route.ts`

**Estructura en Firestore:**
```typescript
{
  id: string;                    // ID del documento (generado automáticamente)
  name: { es: string, en: string };
  price: number;
  nutrition: {
    calories: number;
    protein: number;
    isGlutenFree: boolean;
  };
  benefits: { es: string, en: string };
  image?: string;
  isFeatured: boolean;
  status: "active" | "inactive" | "coming_soon";
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

**Características:**
- ✅ Se crea/edita desde admin (`/admin/combos`)
- ✅ Se persiste en Firebase
- ❌ **NO se usa** en el frontend público

#### Colección: `catalog_combos` (API Legacy)

**Ubicación en código:** `apps/api/src/modules/catalog/repository.ts`

**Constante:**
```typescript
const COLLECTIONS = {
  combos: "catalog_combos",  // ⚠️ DIFERENTE a lunch_combos
};
```

**Características:**
- Usada por la API Express legacy
- Referenciada en `repository.ts` y `service.ts`
- ⚠️ **NO se usa** en el frontend Next.js

### 2.2 Datos Hardcodeados (Frontend Público)

**Ubicación:** `apps/web/src/app/_components/lunch-combos-section.tsx`

**Estructura:**
```typescript
const COMBOS: Combo[] = [
  {
    id: 1,                      // ⚠️ Número, no string
    sku: "GD-COMB-001",
    name: LocalizedString,
    salad: LocalizedString,
    juice: LocalizedString,
    dessert: LocalizedString,
    price: number,
    cost: number,
    margin: number,
    calories: number,
    protein: number,
    glutenFree: boolean,
    benefit: LocalizedString,
    benefitDetail: LocalizedString,
    recommendedFor: LocalizedString,
    carbs: number,
    fats: number,
    fiber: number,
    sugars: number,
    vitaminA: string,
    vitaminC: string,
    image: string,
    ingredients: LocalizedString[],
  },
  // ... más combos hardcodeados
];
```

**Características:**
- ❌ **Hardcodeados** en el componente React
- ✅ Se muestran en el frontend público
- ❌ **NO se sincronizan** con Firebase
- ❌ Cambios en admin **NO afectan** estos datos

---

## 3. ESTRUCTURA DE TIPOS Y SCHEMAS

### 3.1 Tipo `Combo` (Frontend)

**Ubicación:** `apps/web/src/modules/catalog/types.ts`

```typescript
export type Combo = {
  id: string;                    // String ID
  name: LocalizedString;
  salad: LocalizedString;
  juice: LocalizedString;
  dessert: LocalizedString;
  price: number;
  cost?: number;
  margin?: number;
  calories: number;
  protein: number;
  glutenFree: boolean;
  benefit: LocalizedString;
  benefitDetail: LocalizedString;
  recommendedFor: LocalizedString;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  vitaminA?: string;
  vitaminC?: string;
  image?: string;
  ingredients: LocalizedString[];
  status: "active" | "inactive" | "coming_soon";
  isFeatured: boolean;
};
```

**Campos completos:** 22 campos

### 3.2 Tipo `LunchCombo` (Simplificado)

**Ubicación:** `apps/web/src/modules/catalog/types.ts`

```typescript
export type LunchCombo = {
  id: string;
  name: LocalizedString;
  price: number;
  nutrition: {
    calories: number;
    protein: number;
    isGlutenFree: boolean;
  };
  benefits: LocalizedString;
  image?: string;
};
```

**Campos:** Solo 5 campos (versión simplificada)

**Uso:** Usado por `fetchLunchCombos()` pero **NO se usa** en el frontend público

### 3.3 Tipo `Combo` (Hardcodeado en Frontend)

**Ubicación:** `apps/web/src/app/_components/lunch-combos-section.tsx`

```typescript
type Combo = {
  id: number;                    // ⚠️ NUMBER, no string
  sku: string;
  name: LocalizedString | string;
  salad: LocalizedString | string;
  juice: LocalizedString | string;
  dessert: LocalizedString | string;
  price: number;
  cost: number;                  // ⚠️ Requerido, no opcional
  margin: number;                // ⚠️ Requerido, no opcional
  calories: number;
  protein: number;
  glutenFree: boolean;
  benefit: LocalizedString | string;
  benefitDetail: LocalizedString | string;
  recommendedFor: LocalizedString | string;
  carbs: number;
  fats: number;
  fiber: number;
  sugars: number;
  vitaminA: string;
  vitaminC: string;
  image?: string;
  ingredients: (LocalizedString | string)[];
};
```

**Diferencias clave:**
- `id` es `number` en lugar de `string`
- `cost` y `margin` son requeridos (no opcionales)
- No tiene `status` ni `isFeatured`
- Tiene `sku` (no presente en tipo `Combo`)

### 3.4 Schema Zod (API)

**Ubicación:** `apps/api/src/modules/catalog/schemas.ts`

```typescript
export const comboSchema = z.object({
  id: z.string().min(1),
  name: localizedStringSchema,
  salad: localizedStringSchema,
  juice: localizedStringSchema,
  dessert: localizedStringSchema,
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().optional(),
  margin: z.number().nonnegative().optional(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  glutenFree: z.boolean().default(false),
  benefit: localizedStringSchema,
  benefitDetail: localizedStringSchema,
  recommendedFor: localizedStringSchema,
  carbs: z.number().nonnegative(),
  fats: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
  sugars: z.number().nonnegative(),
  vitaminA: z.string().optional(),
  vitaminC: z.string().optional(),
  image: optionalNonEmptyStringSchema,
  ingredients: z.array(localizedStringSchema).default([]),
  status: z.enum(["active", "inactive", "coming_soon"]).default("active"),
  isFeatured: z.boolean().default(false),
});
```

**Características:**
- ✅ Valida estructura completa de `Combo`
- ⚠️ **NO coincide** con estructura de `lunch_combos` en Firebase
- ⚠️ Usado por API Express legacy, no por Next.js admin

---

## 4. GESTIÓN DESDE ADMIN

### 4.1 Ruta Admin: `/admin/combos`

**Archivo:** `apps/web/src/app/admin/combos/page.tsx`

**Funcionalidades:**
- ✅ Lista combos desde Firebase (`lunch_combos`)
- ✅ Búsqueda por nombre (es/en)
- ✅ Crear nuevo combo
- ✅ Editar combo existente
- ✅ Visualización de estado (active/inactive/coming_soon)
- ✅ Gestión de imágenes

**Flujo de carga:**
```typescript
1. GET /api/admin/catalog/combos
2. Lee colección "lunch_combos" desde Firestore
3. Transforma datos a formato Combo (con campos vacíos para salad/juice/dessert)
4. Muestra en ComboManager
```

### 4.2 Componente: `ComboManager`

**Archivo:** `apps/web/src/modules/admin/catalog/components/combo-manager.tsx`

**Características:**
- Grid de combos con imágenes
- Formulario de edición completo
- Campos editables:
  - Nombre (es/en)
  - Ensalada (es/en)
  - Jugo (es/en)
  - Postre (es/en)
  - Precio, costo, margen
  - Información nutricional completa
  - Ingredientes
  - Estado y featured
  - Imagen

**Problema crítico:**
- ⚠️ Al guardar, **NO persiste** `salad`, `juice`, `dessert` en Firebase
- Solo persiste: `name`, `price`, `nutrition`, `benefits`, `image`, `status`, `isFeatured`

**Código de guardado (PUT):**
```typescript
const payload = {
  name: body?.name,
  price: Number(body?.price) || 0,
  nutrition: {
    calories: Number(body?.calories) || 0,
    protein: Number(body?.protein) || 0,
    isGlutenFree: Boolean(body?.glutenFree),
  },
  benefits: body?.benefit,
  image: body?.image ?? "",
  isFeatured: body?.isFeatured ?? false,
  status: body?.status ?? "active",
  updatedAt: new Date().toISOString(),
};
// ⚠️ NO incluye: salad, juice, dessert, cost, margin, carbs, fats, fiber, sugars, vitaminA, vitaminC, ingredients
```

### 4.3 API Endpoints Admin

#### GET `/api/admin/catalog/combos`

**Archivo:** `apps/web/src/app/api/admin/catalog/combos/route.ts`

**Funcionalidad:**
- Lee colección `lunch_combos`
- Transforma a formato `Combo` con campos vacíos:
  ```typescript
  salad: { es: "", en: "" },      // ⚠️ Siempre vacío
  juice: { es: "", en: "" },      // ⚠️ Siempre vacío
  dessert: { es: "", en: "" },   // ⚠️ Siempre vacío
  carbs: 0,                       // ⚠️ Siempre 0
  fats: 0,                        // ⚠️ Siempre 0
  fiber: 0,                       // ⚠️ Siempre 0
  sugars: 0,                      // ⚠️ Siempre 0
  ingredients: [],                // ⚠️ Siempre vacío
  ```

**Problema:** Los datos en Firebase no tienen estos campos, por lo que siempre se devuelven vacíos.

#### POST `/api/admin/catalog/combos`

**Funcionalidad:**
- Crea nuevo combo en `lunch_combos`
- Solo guarda campos básicos (name, price, nutrition, benefits, image, status)
- ⚠️ **NO guarda** salad, juice, dessert, cost, margin, etc.

#### PUT `/api/admin/catalog/combos/[id]`

**Archivo:** `apps/web/src/app/api/admin/catalog/combos/[id]/route.ts`

**Funcionalidad:**
- Actualiza combo existente
- Solo actualiza campos básicos
- ⚠️ **NO actualiza** salad, juice, dessert, cost, margin, etc.

### 4.4 API Express Legacy

**Archivo:** `apps/api/src/modules/catalog/admin-routes.ts`

**Endpoints:**
- `GET /admin/catalog/combos` → `listCombosForAdmin()`
- `PUT /admin/catalog/combos/:id` → `updateComboById()`

**Características:**
- Usa colección `catalog_combos` (diferente a `lunch_combos`)
- Valida con `comboSchema` (estructura completa)
- ⚠️ **NO se usa** desde el frontend Next.js admin

---

## 5. VISUALIZACIÓN EN FRONTEND PÚBLICO

### 5.1 Componente: `LunchCombosSection`

**Archivo:** `apps/web/src/app/_components/lunch-combos-section.tsx`

**Ubicación en página:** `/` (homepage), sección `#combos`

**Características:**
- ✅ Muestra grid de combos con animaciones
- ✅ Modal de detalles con información nutricional completa
- ✅ Permite excluir ingredientes
- ✅ Permite agregar notas
- ✅ Selector de cantidad
- ✅ Integración con carrito

**Problema crítico:**
- ❌ Usa array `COMBOS` **hardcodeado** en el componente
- ❌ **NO carga** datos desde Firebase
- ❌ **NO usa** API `/api/catalog/combos`

### 5.2 Datos Mostrados

**Combos hardcodeados:** 3 combos predefinidos:
1. "Detox Verde" (GD-COMB-001)
2. "Mediterráneo Fresh" (GD-COMB-002)
3. "Poder Tropical" (GD-COMB-003)

**Información mostrada:**
- Nombre, precio, imagen
- Ensalada, jugo, postre incluidos
- Información nutricional completa
- Lista de ingredientes
- Beneficios y recomendaciones
- Badge "Sin Gluten" si aplica

### 5.3 API Pública (No Usada)

**Archivo:** `apps/web/src/app/api/catalog/combos/route.ts`

```typescript
export async function GET() {
  const data = await fetchLunchCombos();  // Lee lunch_combos
  return NextResponse.json({ data }, { status: 200 });
}
```

**Problema:**
- ✅ Endpoint existe y funciona
- ❌ **NO se llama** desde `LunchCombosSection`
- ❌ Frontend público usa datos hardcodeados

**Función `fetchLunchCombos()`:**
- Lee colección `lunch_combos`
- Transforma a tipo `LunchCombo` (simplificado)
- ⚠️ Solo devuelve campos básicos (name, price, nutrition, benefits, image)

---

## 6. INTEGRACIÓN CON CARRITO Y PEDIDOS

### 6.1 Agregar al Carrito

**Archivo:** `apps/web/src/app/_components/lunch-combos-section.tsx`

**Función `handleAddCombo()`:**
```typescript
addItem({
  type: "product",              // ⚠️ Se trata como producto, no como combo
  slug: combo.sku,              // Usa SKU del combo hardcodeado
  name: tData(combo.name),
  price: combo.price,
  quantity,
  slotValue: 1,
  weightKg: 0,
  image: combo.image,
  notes: notes || undefined,
  excludedIngredients: excludedIngredients?.length ? excludedIngredients : undefined,
});
```

**Características:**
- ✅ Se agrega al carrito como `type: "product"`
- ✅ Incluye notas y ingredientes excluidos
- ✅ Usa SKU del combo hardcodeado (ej: "GD-COMB-001")

### 6.2 En Pedidos

**Archivo:** `apps/web/src/app/api/orders/route.ts`

**Procesamiento:**
- Los combos se procesan igual que productos normales
- Se guardan en `orders.items[]` con `type: "product"`
- ⚠️ **NO hay diferenciación** entre combo y producto

**Estructura en orden:**
```typescript
{
  id: item.slug || item.id,     // SKU del combo (ej: "GD-COMB-001")
  productId: item.slug || item.id,
  type: "product",              // ⚠️ No hay tipo "combo"
  name: { es: item.name, en: item.name },
  quantity: item.quantity,
  unitPrice: { amount: item.price, currency: "DOP" },
  metadata: item.metadata || item.configuration || {}
}
```

### 6.3 En Admin - Crear Pedido

**Archivo:** `apps/web/src/app/admin/orders/create/page.tsx`

**Carga de combos:**
```typescript
const combosRes = await adminFetch("/api/admin/catalog/combos", { cache: "no-store" });
const combos = Array.isArray(combosJson.data) ? combosJson.data : [];

const normalizedCombos: CatalogItem[] = combos.map((item: any) => ({
  id: item.id,
  slug: item.id,                // ⚠️ Usa ID, no SKU
  name: item.name ?? { es: "", en: "" },
  price: Number(item.price) || 0,
  type: "product",             // ⚠️ Se trata como producto
  // ...
}));
```

**Características:**
- ✅ Combos desde Firebase aparecen en búsqueda de productos
- ✅ Se pueden agregar a pedidos admin
- ⚠️ Se tratan como productos normales

### 6.4 En Admin - Gestión de Productos

**Archivo:** `apps/web/src/app/admin/products/page.tsx`

**Transformación de combos:**
```typescript
const comboProducts = rawCombos.map((combo: any) => ({
  id: combo.id,
  slug: combo.slug ?? combo.id,
  sku: combo.sku ?? combo.id,
  name: combo.name ?? { es: "", en: "" },
  description: combo.benefit ?? { es: "", en: "" },
  unit: "",
  isActive: combo.status === "active",
  price: Number(combo.price) || 0,
  status: combo.status ?? "active",
  image: combo.image ?? "",
  categoryId: "combos",        // ⚠️ Categoría especial "combos"
  type: "combo",                // ⚠️ Tipo "combo" solo aquí
  // ...
}));
```

**Características:**
- ✅ Combos aparecen en lista de productos admin
- ✅ Categoría especial "combos"
- ✅ Tipo "combo" solo en esta vista
- ⚠️ En pedidos se tratan como `type: "product"`

---

## 7. APIS Y ENDPOINTS

### 7.1 Resumen de Endpoints

| Endpoint | Método | Colección | Uso | Estado |
|----------|--------|-----------|-----|--------|
| `/api/admin/catalog/combos` | GET | `lunch_combos` | Admin - Listar | ✅ Activo |
| `/api/admin/catalog/combos` | POST | `lunch_combos` | Admin - Crear | ✅ Activo |
| `/api/admin/catalog/combos/[id]` | PUT | `lunch_combos` | Admin - Editar | ✅ Activo |
| `/api/catalog/combos` | GET | `lunch_combos` | Público - Listar | ✅ Existe pero ❌ No usado |
| `/admin/catalog/combos` (Express) | GET | `catalog_combos` | Legacy API | ⚠️ Existe pero no usado |
| `/admin/catalog/combos/:id` (Express) | PUT | `catalog_combos` | Legacy API | ⚠️ Existe pero no usado |

### 7.2 Transformaciones de Datos

#### Admin GET → Frontend

```typescript
// Firebase (lunch_combos)
{
  name: { es: "...", en: "..." },
  price: 500,
  nutrition: { calories: 420, protein: 12, isGlutenFree: false },
  benefits: { es: "...", en: "..." },
  image: "...",
  status: "active",
  isFeatured: false
}

// ↓ Transformación en GET /api/admin/catalog/combos

// Frontend (Combo)
{
  id: "...",
  name: { es: "...", en: "..." },
  salad: { es: "", en: "" },        // ⚠️ Vacío
  juice: { es: "", en: "" },         // ⚠️ Vacío
  dessert: { es: "", en: "" },       // ⚠️ Vacío
  price: 500,
  cost: undefined,                   // ⚠️ No existe en Firebase
  margin: undefined,                 // ⚠️ No existe en Firebase
  calories: 420,
  protein: 12,
  glutenFree: false,
  benefit: { es: "...", en: "..." },
  benefitDetail: { es: "", en: "" },  // ⚠️ Vacío
  recommendedFor: { es: "", en: "" }, // ⚠️ Vacío
  carbs: 0,                          // ⚠️ Siempre 0
  fats: 0,                           // ⚠️ Siempre 0
  fiber: 0,                          // ⚠️ Siempre 0
  sugars: 0,                         // ⚠️ Siempre 0
  vitaminA: "",                      // ⚠️ Siempre vacío
  vitaminC: "",                      // ⚠️ Siempre vacío
  image: "...",
  ingredients: [],                    // ⚠️ Siempre vacío
  status: "active",
  isFeatured: false
}
```

### 7.3 Problemas de Transformación

**Campos que se pierden al guardar:**
- `salad` (es/en)
- `juice` (es/en)
- `dessert` (es/en)
- `cost`
- `margin`
- `carbs`, `fats`, `fiber`, `sugars`
- `vitaminA`, `vitaminC`
- `ingredients[]`
- `benefitDetail` (es/en)
- `recommendedFor` (es/en)

**Causa:** El endpoint PUT solo guarda campos básicos, ignorando el resto.

---

## 8. INCONSISTENCIAS Y PROBLEMAS CRÍTICOS

### 8.1 🔴 CRÍTICO: Datos Hardcodeados vs Firebase

**Problema:**
- Frontend público usa array `COMBOS` hardcodeado
- Admin gestiona combos en Firebase (`lunch_combos`)
- **NO hay conexión** entre ambos

**Impacto:**
- Cambios en admin **NO se reflejan** en el sitio público
- No se pueden agregar/editar combos desde admin y verlos en público
- Datos duplicados y desincronizados

**Evidencia:**
```typescript
// Frontend público
const COMBOS: Combo[] = [ /* hardcodeados */ ];

// Admin
const combosRes = await adminFetch("/api/admin/catalog/combos");
// Lee desde Firebase pero NO se usa en frontend público
```

### 8.2 🔴 CRÍTICO: Dos Colecciones Diferentes

**Problema:**
- Next.js admin usa: `lunch_combos`
- API Express legacy usa: `catalog_combos`
- **NO hay sincronización** entre ellas

**Impacto:**
- Confusión sobre qué colección usar
- Datos inconsistentes
- Posible pérdida de datos

### 8.3 🟡 MEDIO: Estructura de Datos Incompleta en Firebase

**Problema:**
- Firebase solo guarda campos básicos
- Campos importantes (`salad`, `juice`, `dessert`, `ingredients`, etc.) **NO se guardan**

**Impacto:**
- Admin puede editar campos que **NO se persisten**
- Información se pierde al guardar
- UI de admin muestra campos que no funcionan

**Evidencia:**
```typescript
// Admin permite editar
salad: { es: "...", en: "..." },
juice: { es: "...", en: "..." },
dessert: { es: "...", en: "..." },
ingredients: [...],
// Pero PUT solo guarda:
name, price, nutrition, benefits, image, status, isFeatured
```

### 8.4 🟡 MEDIO: Tipos Inconsistentes

**Problema:**
- `Combo` (types.ts): `id: string`, campos completos
- `Combo` (lunch-combos-section.tsx): `id: number`, campos diferentes
- `LunchCombo`: Estructura simplificada diferente

**Impacto:**
- Errores de tipo en desarrollo
- Confusión al desarrollar nuevas features
- Necesidad de conversiones manuales

### 8.5 🟡 MEDIO: Tratamiento como Productos

**Problema:**
- Combos se agregan al carrito como `type: "product"`
- En pedidos se guardan como `type: "product"`
- **NO hay diferenciación** entre combo y producto

**Impacto:**
- No se puede filtrar combos en reportes
- No se puede aplicar lógica específica para combos
- Confusión en análisis de datos

### 8.6 🟢 BAJO: API Pública No Usada

**Problema:**
- Endpoint `/api/catalog/combos` existe y funciona
- **NO se llama** desde el frontend público

**Impacto:**
- Código muerto
- Confusión sobre qué endpoint usar
- Oportunidad perdida de usar datos dinámicos

---

## 9. FLUJOS DE DATOS

### 9.1 Flujo Actual (Admin → Firebase)

```
Admin (/admin/combos)
  ↓
ComboManager carga datos
  ↓
GET /api/admin/catalog/combos
  ↓
Lee colección "lunch_combos"
  ↓
Transforma a formato Combo (con campos vacíos)
  ↓
Muestra en UI
  ↓
Admin edita campos (salad, juice, dessert, etc.)
  ↓
PUT /api/admin/catalog/combos/[id]
  ↓
Guarda SOLO campos básicos en Firebase
  ↓
⚠️ Campos editados (salad, juice, etc.) SE PIERDEN
```

### 9.2 Flujo Actual (Frontend Público)

```
Usuario visita homepage (/)
  ↓
LunchCombosSection renderiza
  ↓
Usa array COMBOS hardcodeado
  ↓
Muestra combos estáticos
  ↓
Usuario agrega combo al carrito
  ↓
Se agrega como type: "product"
  ↓
Se procesa igual que productos normales
```

### 9.3 Flujo Deseado (Ideal)

```
Admin (/admin/combos)
  ↓
Crea/edita combo completo
  ↓
PUT /api/admin/catalog/combos/[id]
  ↓
Guarda TODOS los campos en Firebase
  ↓
Frontend público carga datos
  ↓
GET /api/catalog/combos
  ↓
Lee colección "lunch_combos"
  ↓
Filtra por status: "active"
  ↓
Muestra combos dinámicos
  ↓
Usuario agrega combo al carrito
  ↓
Se agrega como type: "combo" (o "product" con metadata)
```

---

## 10. RECOMENDACIONES DE MEJORA

### 10.1 🔴 ALTA PRIORIDAD

#### 1. Conectar Frontend Público con Firebase

**Acción:**
- Modificar `LunchCombosSection` para cargar datos desde `/api/catalog/combos`
- Eliminar array `COMBOS` hardcodeado
- Manejar estados de carga y error

**Archivos a modificar:**
- `apps/web/src/app/_components/lunch-combos-section.tsx`

**Esfuerzo:** Medio (2-3 horas)

#### 2. Guardar Todos los Campos en Firebase

**Acción:**
- Modificar `PUT /api/admin/catalog/combos/[id]` para guardar todos los campos
- Actualizar estructura de `lunch_combos` en Firebase
- Migrar datos existentes si es necesario

**Archivos a modificar:**
- `apps/web/src/app/api/admin/catalog/combos/[id]/route.ts`
- `apps/web/src/app/api/admin/catalog/combos/route.ts` (POST)

**Esfuerzo:** Medio (2-3 horas)

#### 3. Estandarizar Colección

**Acción:**
- Decidir usar `lunch_combos` o `catalog_combos`
- Migrar datos de una colección a otra si es necesario
- Actualizar todas las referencias en el código
- Eliminar código legacy si no se usa

**Esfuerzo:** Alto (4-6 horas)

### 10.2 🟡 MEDIA PRIORIDAD

#### 4. Estandarizar Tipos TypeScript

**Acción:**
- Unificar tipos `Combo` y `LunchCombo`
- Crear tipo base y tipos derivados si es necesario
- Actualizar todos los componentes

**Archivos a modificar:**
- `apps/web/src/modules/catalog/types.ts`
- `apps/web/src/app/_components/lunch-combos-section.tsx`
- `apps/web/src/modules/admin/catalog/components/combo-manager.tsx`

**Esfuerzo:** Medio (2-3 horas)

#### 5. Diferenciar Combos en Pedidos

**Acción:**
- Agregar campo `type: "combo"` al agregar combos al carrito
- Actualizar procesamiento de pedidos para reconocer combos
- Agregar filtros en reportes admin

**Esfuerzo:** Medio (2-3 horas)

#### 6. Validación de Datos Completa

**Acción:**
- Validar que todos los campos requeridos estén presentes
- Validar formato de datos (números, strings, etc.)
- Mostrar errores claros en admin

**Esfuerzo:** Bajo (1-2 horas)

### 10.3 🟢 BAJA PRIORIDAD

#### 7. Migración de Datos Hardcodeados

**Acción:**
- Crear script para migrar combos hardcodeados a Firebase
- Validar que todos los campos se migren correctamente
- Documentar proceso

**Esfuerzo:** Bajo (1-2 horas)

#### 8. Mejoras de UX en Admin

**Acción:**
- Agregar preview de combo antes de guardar
- Agregar validación en tiempo real
- Mejorar feedback visual al guardar

**Esfuerzo:** Bajo (1-2 horas)

---

## 11. DIAGRAMA DE ARQUITECTURA ACTUAL

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  lunch_combos/{id}                                          │
│  ├─ name (LocalizedString)                                 │
│  ├─ price (number)                                         │
│  ├─ nutrition (calories, protein, isGlutenFree)           │
│  ├─ benefits (LocalizedString)                            │
│  ├─ image (string)                                        │
│  ├─ status ("active" | "inactive" | "coming_soon")        │
│  └─ isFeatured (boolean)                                  │
│                                                             │
│  catalog_combos/{id} (Legacy - NO USADO)                   │
│  └─ Estructura completa según comboSchema                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GET /api/admin/catalog/combos                             │
│  └─ Lee lunch_combos, transforma con campos vacíos        │
│                                                             │
│  POST /api/admin/catalog/combos                            │
│  └─ Crea en lunch_combos (solo campos básicos)            │
│                                                             │
│  PUT /api/admin/catalog/combos/[id]                        │
│  └─ Actualiza lunch_combos (solo campos básicos)           │
│                                                             │
│  GET /api/catalog/combos                                   │
│  └─ Lee lunch_combos, transforma a LunchCombo            │
│  └─ ⚠️ NO SE USA en frontend público                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN UI (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /admin/combos                                              │
│  ├─ Lista combos desde Firebase                            │
│  ├─ Permite editar TODOS los campos                        │
│  └─ ⚠️ Solo guarda campos básicos                          │
│                                                             │
│  /admin/products                                            │
│  └─ Muestra combos como productos (categoría "combos")   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND PÚBLICO                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  / (Homepage)                                               │
│  └─ LunchCombosSection                                      │
│     ├─ Usa array COMBOS hardcodeado                        │
│     ├─ ⚠️ NO carga desde Firebase                           │
│     └─ ⚠️ NO usa /api/catalog/combos                       │
│                                                             │
│  Carrito                                                     │
│  └─ Combos se agregan como type: "product"                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. CONCLUSIÓN

El sistema de combos en GreenDolio presenta **problemas críticos de arquitectura** que impiden su uso efectivo:

### Fortalezas
- ✅ UI de admin completa y funcional
- ✅ Frontend público muestra combos correctamente (aunque hardcodeados)
- ✅ Integración con carrito funciona
- ✅ Endpoints API existen y funcionan

### Debilidades Críticas
- ❌ **Desconexión total** entre admin y frontend público
- ❌ **Datos hardcodeados** en frontend público
- ❌ **Campos no se guardan** en Firebase
- ❌ **Dos colecciones** diferentes sin sincronización
- ❌ **Tipos inconsistentes** entre componentes

### Recomendación General

**Prioridad 1:** Conectar frontend público con Firebase y guardar todos los campos. Esto permitirá que los cambios en admin se reflejen en el sitio público.

**Prioridad 2:** Estandarizar colección y tipos. Esto mejorará la mantenibilidad y reducirá errores.

**Prioridad 3:** Diferenciar combos en pedidos. Esto permitirá análisis y reportes más precisos.

---

**Fin del Reporte**
